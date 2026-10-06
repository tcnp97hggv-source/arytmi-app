/* =============================================================
   ARYTMI — sync.js
   Udbakken. Lokalt først, serveren bagefter.
   =============================================================

   Appen bruges dér, hvor dækningen er dårligst. Derfor er rækkefølgen
   ikke til forhandling: `gem()` skriver `localStorage` og er FÆRDIG.
   Intet i denne fil må kunne få en gemning til at vente på et netværk,
   og intet må kunne få den til at fejle. Sker der noget her, bliver
   ændringen liggende i udbakken, til nettet kommer tilbage.

   Fire valg, og grunden til hvert:

   1. `gem()` får ÉN linje. De ~150 kaldesteder røres ikke. Til gengæld
      ved `gem()` ikke, hvad der blev ændret — så sync finder det selv
      ved at sammenligne med et spejl af det, serveren sidst var enig i.
      Det er prisen for ikke at skrive appen om, og den er billig: hele
      tilstanden er nogle få kilobyte.

   2. Udbakken er et OPSLAG pr. række, ikke en liste af hændelser.
      Krydser man det samme punkt af og til igen tyve gange offline,
      står der én række i udbakken, ikke tyve. Det er også planens regel
      for konflikter: sidste skrivning vinder PR. RÆKKE. Rækker frem for
      klumper er hele grunden til, at to telefoner ikke kan slette
      hinandens flueben.

   3. Uden en klient gør filen INGENTING. Ingen timere, ingen fejl, ingen
      ventende løfter. Navigationstesten kører uden netværk og uden
      supabase-biblioteket, og den skal blive ved med at være 301 ruter
      og 0 fejl. Det samme gælder en bruger, der endnu ikke er logget ind.

   4. Alt, der kommer NED fra serveren, går gennem `rens()`, før det
      lander i `s`. Appen tegner med `innerHTML`, og planen kalder det
      selv den største XSS-risiko: rens ved indgangen, ikke ved udgangen.
      Ét sted at holde øje med i stedet for 706 linjer med interpolation.

   TURENE KOM MED 8/9 med migration `0008`. `ture.id` er nu `text`, så
   en tur lavet i flytilstand har sit endelige id med det samme, og hele
   turen ligger i én `data`-kolonne. Det var netop, hvad udbakken var
   bygget til: turene blev én tabel mere i `fladgoer()`, og intet andet
   her skulle laves om.

   HVAD DER STADIG IKKE ER MED, og hvorfor det er rigtigt:
   afkrydsninger, valg og fordeling ligger i turens `data` og ikke i
   `tur_afkrydsning`, `tur_valg` og `tur_fordeling`. Tabellerne står
   klar og er tomme. Fase 1 er ÉN person på TO enheder, og da er sidste
   skrivning pr. TUR det rigtige. Først når der er TO mennesker, kan to
   flueben kollidere — og så flytter de ud i hver sin række, præcis som
   planen siger. Det er en tilføjelse, ikke en omskrivning.

   Filen rører aldrig DOM'en og indlæses efter `auth.js`, før `app.js`.
   Under Node kan den `require()`es. Samme mønster som `model.js`. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArytmiSync = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  /* Udbakken og spejlet har hver sin nøgle og ligger UDEN FOR `arytmi-v5`.
     Ellers ville en oprydning i tilstanden kunne smide uafsendte ændringer
     væk, og et spejl inde i tilstanden ville synkronisere sig selv. */
  const UDBAKKE = 'arytmi-udbakke';
  const SPEJL   = 'arytmi-spejl';

  /* Ventetiden mellem to forsøg, når serveren ikke svarer. Fordobles, til
     den rammer loftet. Uden loft ville en telefon, der har ligget i en
     rygsæk hele dagen, vente en time efter den første succes. */
  const FORSØG_MIN = 2000;
  const FORSØG_MAX = 60000;

  /* Tabeller, hvor en forsvunden række også skal forsvinde på serveren.
     `anmeldelser` står bevidst IKKE her: den eneste måde, en anmeldelse
     kan forsvinde lokalt, er at hele den afholdte tur blev slettet — og
     så rydder fremmednøglen op af sig selv. Databasen har heller ingen
     slettepolitik på anmeldelser, så et forsøg ville blive afvist i en
     løkke, der aldrig tømtes. */
  const MÅ_SLETTES = ['egne_ting', 'afholdte_ture', 'ture'];

  /* Sat af `anvendPåTilstand`, læst samme sted. Et modul-niveau-flag og
     ikke en parameter, fordi `anvendPåTilstand` også kaldes uden
     ejerskabsoplysninger fra testene. */
  let ændretFremmed = false;

  /* ER DET HER OVERHOVEDET NYT?

     `anvendPåTilstand` satte før `ændret = true` for hver eneste række, den
     rørte — også når serveren sagde præcis det, der allerede stod. Ved
     opstart kostede det én gentegning for meget, og det var til at leve med.

     Med Realtime er det ikke til at leve med: hver gang udbakken skubber en
     ændring op, fyrer serveren en besked tilbage om den samme række, og
     appen ville tegne sig selv om, mens hun skriver. Derfor sammenlignes
     der nu, før der skrives.

     JSON.stringify er nok her. Rækkerne er små, og de er netop kommet
     gennem `rens()`, så nøglerækkefølgen er den samme i begge ender. */
  function ensLydende(a, b) {
    try { return JSON.stringify(a) === JSON.stringify(b); }
    catch (e) { return false; }
  }

  /* Hvad ejerkolonnen hedder i hver tabel. De fleste siger `bruger_id`,
     men `ture` siger `ejer_id` — fordi en tur kan have DELTAGERE, og
     ejeren er en anden slags end dem. Den forskel kostede en 400'er den
     8/9: enhedstesten kunne ikke se den, for attrapklienten tager imod
     hvad som helst. Det var den rigtige database, der sagde fra. */
  const EJERKOLONNE = { ture: 'ejer_id' };
  function ejerkolonne(tabel) { return EJERKOLONNE[tabel] || 'bruger_id'; }

  let opsætning = null;      // det, start() fik at vide
  let klient = null;
  let kører = false;         // ét skub ad gangen
  let planlagt = null;       // timer-id på næste forsøg
  let ventetid = FORSØG_MIN;
  let anvender = false;      // vi skriver selv i tilstanden lige nu
  let klar = false;          // en hentning er lykkedes, spejlet står
  let sidstHentet = 0;       // hvornår vi sidst hentede ned

  /* ---------- lager ----------
     Under Node findes `localStorage` ikke, og testen leverer sit eget.
     Alt går gennem de to her, så resten af filen ikke skal vide det. */
  function lager() {
    if (opsætning && opsætning.lager) return opsætning.lager;
    if (typeof localStorage !== 'undefined') return localStorage;
    return null;
  }
  function læs(nøgle) {
    const l = lager();
    if (!l) return null;
    try { const r = l.getItem(nøgle); return r ? JSON.parse(r) : null; }
    catch (e) { return null; }
  }
  function skriv(nøgle, værdi) {
    const l = lager();
    if (!l) return;
    try { l.setItem(nøgle, JSON.stringify(værdi)); }
    catch (e) { /* fuldt lager: udbakken lever videre i hukommelsen */ }
  }

  /* ---------- rens ----------
     Alt fra serveren passerer her. To ting fjernes: de tegn, der kan
     lukke et attribut eller en tag ud af en template-streng, og alt for
     lange strenge. Vi laver IKKE HTML-escaping — appens egen `esc()`
     gør det ved udskrivning, og gjorde vi det også her, ville brugeren
     se `&amp;` i sit eget navn efter en tur forbi serveren. */
  const MAKS_TEKST = 4000;
  function rens(v) {
    if (typeof v === 'string') {
      return v.replace(/[<>]/g, '').slice(0, MAKS_TEKST);
    }
    if (Array.isArray(v)) return v.map(rens);
    if (v && typeof v === 'object') {
      const ud = {};
      Object.keys(v).forEach(k => { ud[k] = rens(v[k]); });
      return ud;
    }
    return v;
  }

  /* ---------- tilstand -> rækker ----------

     Ét opslag pr. tabel, og hver række har en nøgle, der er STABIL på
     tværs af enheder. Det er hele grunden til, at `model.js` gav alting
     id'er i fase 0: uden dem ville "den fjerde tur" betyde noget
     forskelligt på to telefoner.

     Formen her er databasens, ikke appens: ASCII-kolonner (foedselsdag,
     ikke fødselsdag), og tomme datoer bliver til `null`, fordi Postgres
     ikke tager en tom streng som `date`. */
  function fladgoer(s) {
    const t = s || {};
    const profil = t.profil || {};
    const ud = { profiler: {}, egne_ting: {}, afholdte_ture: {}, anmeldelser: {}, ture: {} };

    /* Profilen er ÉN række, og kun tre kolonner må røres herfra.
       `email`, `telefon`, `rolle` og `partner_laast` fratog `0006`
       brugeren skriveretten på — sender vi dem med, afviser databasen
       hele opdateringen, og så mister hun også det, hun havde lov til. */
    ud.profiler['mig'] = {
      navn: profil.navn || '',
      foedselsdag: profil.fødselsdag || null,
      notifikationer: profil.notifikationer !== false
    };

    Object.keys(t.egneTing || {}).forEach(liste => {
      const arr = t.egneTing[liste];
      if (!Array.isArray(arr)) return;
      arr.forEach(p => {
        if (!p || !p.id) return;
        ud.egne_ting[p.id] = { id: p.id, liste, tekst: p.tekst || '' };
      });
    });

    /* De KOMMENDE ture. Bemærk navnene: appens `s.arytmer` er databasens
       `ture`, og appens `s.ture` er de AFHOLDTE. Forvirrende, men det er
       de navne, appen og skemaet hver især har haft længe, og at omdøbe
       det ene ville bare flytte forvirringen.

       Hele turen sendes som ét objekt. `dato` skal IKKE med som kolonne —
       den er genereret ud af `data` i databasen, så der kun er ét sted
       med sandheden om, hvornår turen er. */
    (t.arytmer || []).forEach(a => {
      if (!a || !a.id) return;
      ud.ture[a.id] = { id: a.id, data: a };
    });

    (t.ture || []).forEach(tur => {
      if (!tur || !tur.id) return;
      ud.afholdte_ture[tur.id] = {
        id: tur.id,
        sted: tur.sted || '',
        dato: tur.dato || null,
        kommentar: tur.kommentar || '',
        godt: tur.godt || '',
        bedre: tur.bedre || '',
        minde: tur.minde || '',
        plan: tur.plan || null
      };
      /* Anmeldelsen er en selvstændig række, fordi den skal kunne læses
         samlet af OD uden at give adgang til selve turen. Findes der
         ingen score, findes der ingen række — en tom anmeldelse er ikke
         det samme som en anmeldelse med nul stjerner. */
      const sc = tur.score;
      if (sc && (sc.destination || sc.komfort || sc.app || sc.hygge)) {
        ud.anmeldelser[tur.id] = {
          afholdt_id: tur.id,
          score_destination: sc.destination || null,
          score_komfort: sc.komfort || null,
          score_app: sc.app || null,
          score_hygge: sc.hygge || null
        };
      }
    });

    return ud;
  }

  /* ---------- forskellen ----------

     Sammenligner det, der står i appen nu, med spejlet af det, serveren
     sidst var enig i. Resultatet er de rækker, der skal skubbes.

     Sammenligningen er en tekstsammenligning af hele rækken. Det er groft
     nok til at et felt, der er sat til den samme værdi igen, ikke bliver
     til en skrivning — og det er præcis det, vi vil undgå, når `gem()`
     kaldes 150 steder fra. */
  function findÆndringer(nu, spejl) {
    const ændringer = [];
    Object.keys(nu).forEach(tabel => {
      const nyeRækker = nu[tabel] || {};
      const gamleRækker = (spejl && spejl[tabel]) || {};

      Object.keys(nyeRækker).forEach(nøgle => {
        const før = gamleRækker[nøgle];
        if (før === undefined || JSON.stringify(før) !== JSON.stringify(nyeRækker[nøgle])) {
          ændringer.push({ tabel, nøgle, op: 'skriv', data: nyeRækker[nøgle] });
        }
      });

      if (MÅ_SLETTES.indexOf(tabel) === -1) return;
      Object.keys(gamleRækker).forEach(nøgle => {
        if (nyeRækker[nøgle] === undefined) {
          ændringer.push({ tabel, nøgle, op: 'slet', data: null });
        }
      });
    });
    return ændringer;
  }

  /* ---------- udbakken ----------

     Nøglen er `tabel|række`. Derfor kan den samme række kun stå ét sted,
     og den nyeste udgave er den, der bliver sendt. En liste af hændelser
     ville vokse ubegrænset, når man sidder uden dækning og retter i den
     samme pakkeliste en time i træk. */
  function udbakkeNøgle(æ) { return æ.tabel + '|' + æ.nøgle; }

  function hentUdbakke() { return læs(UDBAKKE) || {}; }

  function læg(ændringer) {
    if (!ændringer.length) return hentUdbakke();
    const u = hentUdbakke();
    ændringer.forEach(æ => { u[udbakkeNøgle(æ)] = æ; });
    skriv(UDBAKKE, u);
    return u;
  }

  function fjernFraUdbakke(nøgler) {
    if (!nøgler.length) return;
    const u = hentUdbakke();
    nøgler.forEach(n => { delete u[n]; });
    skriv(UDBAKKE, u);
  }

  /* Spejlet flyttes KUN, når serveren har sagt ja. Flyttede vi det, når
     ændringen blev lagt i udbakken, ville en afvist skrivning være væk
     for altid: næste forskel ville ikke kunne se den. */
  function flytSpejl(ændringer) {
    const spejl = læs(SPEJL) || {};
    ændringer.forEach(æ => {
      if (!spejl[æ.tabel]) spejl[æ.tabel] = {};
      if (æ.op === 'slet') delete spejl[æ.tabel][æ.nøgle];
      else spejl[æ.tabel][æ.nøgle] = æ.data;
    });
    skriv(SPEJL, spejl);
  }

  /* ---------- ud på nettet ----------

     Én tabel ad gangen, og en tabel, der fejler, stopper ikke de andre.
     Rækkerne, der kom igennem, ryger ud af udbakken; resten bliver
     liggende til næste forsøg. */
  async function skrivTabel(tabel, poster, brugerId) {
    if (tabel === 'profiler') {
      /* Profilrækken laves af en trigger ved oprettelsen og findes
         altid. Derfor `update`, ikke `upsert`: et upsert ville sende
         `id` med, og `id` er en af de kolonner, brugeren ikke ejer. */
      const { error } = await klient.from('profiler').update(poster[0].data).eq('id', brugerId);
      if (error) throw error;
      return;
    }
    const ejer = {};
    ejer[ejerkolonne(tabel)] = brugerId;
    const rækker = poster.map(p => Object.assign({}, ejer, p.data));
    const { error } = await klient.from(tabel).upsert(rækker);
    if (error) throw error;
  }

  async function sletRækker(tabel, poster) {
    const kolonne = tabel === 'anmeldelser' ? 'afholdt_id' : 'id';
    const { error } = await klient.from(tabel).delete().in(kolonne, poster.map(p => p.nøgle));
    if (error) throw error;
  }

  /* Tømmer udbakken, så langt som serveren vil være med. Returnerer
     antallet af rækker, der stadig venter. */
  async function skub() {
    if (kører || !klient) return -1;
    const u = hentUdbakke();
    const nøgler = Object.keys(u);
    if (!nøgler.length) return 0;

    const brugerId = await hentBrugerId();
    if (!brugerId) return nøgler.length;   // ikke logget ind: bliv liggende

    kører = true;
    let fejlede = false;
    try {
      /* Grupperet pr. tabel og pr. handling. Rækkefølgen er ikke
         ligegyldig: skrivninger før sletninger, så en tur, der blev
         oprettet og slettet igen offline, ikke efterlader en række. */
      const grupper = {};
      nøgler.forEach(n => {
        const æ = u[n];
        const g = æ.tabel + '#' + æ.op;
        (grupper[g] = grupper[g] || []).push(Object.assign({ _n: n }, æ));
      });

      const erSlet = g => g.indexOf('#slet') !== -1;
      const rækkefølge = Object.keys(grupper).sort((a, b) => (erSlet(a) ? 1 : 0) - (erSlet(b) ? 1 : 0));
      for (const g of rækkefølge) {
        const poster = grupper[g];
        const tabel = poster[0].tabel;
        try {
          if (poster[0].op === 'slet') await sletRækker(tabel, poster);
          else await skrivTabel(tabel, poster, brugerId);
          fjernFraUdbakke(poster.map(p => p._n));
          flytSpejl(poster);
        } catch (e) {
          fejlede = true;
          meld('Kunne ikke skrive ' + tabel, e);
        }
      }
    } finally {
      kører = false;
    }

    const tilbage = Object.keys(hentUdbakke()).length;
    if (fejlede || tilbage) planlægForsøg(); else ventetid = FORSØG_MIN;
    return tilbage;
  }

  /* ---------- ned fra nettet ----------

     Køres ved opstart. Reglen for, hvem der vinder, er den enkleste,
     der er til at forsvare: SERVEREN VINDER — undtagen for rækker, der
     står i udbakken. De er nyere lokale ændringer, som serveren endnu
     ikke har set, og de ville blive tabt, hvis vi lod hentningen skrive
     hen over dem. Det er også svaret på planens prøve: sluk nettet, ret
     noget, tænd igen — det er der. */
  async function hent() {
    if (!klient) return null;
    const brugerId = await hentBrugerId();
    if (!brugerId) return null;

    const rækker = { profiler: {}, egne_ting: {}, afholdte_ture: {}, anmeldelser: {}, ture: {} };

    /* HVEM EJER HVAD. Fra 0012 kan en rejsemakkers rækker komme med ned,
       og så skal appen kunne se forskel: hendes ture må vises med mærkat,
       og de må ikke kunne slettes herfra (politikken "kun ejeren sletter").

       Ejerkolonnen holdes UDE af `rækker`. Spejlet sammenlignes mod
       `fladgoer()`, og et felt, fladgoer ikke laver, ville få hver eneste
       række til at se ændret ud og lande i udbakken. Derfor to spor: det
       hentede går i `rækker` i præcis den form, det plejer, og ejerskabet
       går ved siden af.

       Kun det FREMMEDE noteres. Fraværet betyder "min", og det er den
       rigtige vej rundt: en gammel tilstand uden feltet opfører sig som
       før, i stedet for at alt pludselig ser fremmed ud. */
    const fremmed = { ture: {}, egne_ting: {}, afholdte_ture: {} };
    try {
      /* `rolle` er LÆSE-ONLY for brugeren (0006 fratog hende skriveretten),
         og den sendes aldrig med tilbage — fladgoer() ovenfor rører kun de
         tre felter, hun må rette. Den hentes, fordi appen skal kunne vise
         kladder for en administrator: "forhåndsvisningen er appen selv". */
      const p = await klient.from('profiler').select('navn,foedselsdag,notifikationer,rolle').eq('id', brugerId);
      if (p.error) throw p.error;
      if (p.data && p.data[0]) rækker.profiler['mig'] = rens(p.data[0]);

      const e = await klient.from('egne_ting').select('id,liste,tekst,bruger_id');
      if (e.error) throw e.error;
      (e.data || []).forEach(r => {
        if (r.bruger_id && r.bruger_id !== brugerId) fremmed.egne_ting[r.id] = true;
        rækker.egne_ting[r.id] = rens({ id: r.id, liste: r.liste, tekst: r.tekst });
      });

      const a = await klient.from('afholdte_ture').select('id,sted,dato,kommentar,godt,bedre,minde,plan,bruger_id');
      if (a.error) throw a.error;
      (a.data || []).forEach(r => {
        if (r.bruger_id && r.bruger_id !== brugerId) fremmed.afholdte_ture[r.id] = true;
        rækker.afholdte_ture[r.id] = rens({
          id: r.id, sted: r.sted, dato: r.dato,
          kommentar: r.kommentar, godt: r.godt, bedre: r.bedre, minde: r.minde, plan: r.plan
        });
      });

      const an = await klient.from('anmeldelser').select('afholdt_id,score_destination,score_komfort,score_app,score_hygge');
      if (an.error) throw an.error;
      (an.data || []).forEach(r => { rækker.anmeldelser[r.afholdt_id] = rens(r); });

      const k = await klient.from('ture').select('id,data,ejer_id');
      if (k.error) throw k.error;
      (k.data || []).forEach(r => {
        if (r.ejer_id && r.ejer_id !== brugerId) fremmed.ture[r.id] = true;
        rækker.ture[r.id] = { id: r.id, data: rens(r.data) };
      });
    } catch (e) {
      meld('Kunne ikke hente', e);
      planlægForsøg();
      return null;
    }

    /* Spejlet sættes til det, serveren lige sagde. Bagefter finder
       `efterGem()` af sig selv ud af, hvad der står lokalt, som serveren
       ikke kender — og lægger netop det i udbakken. Det er derfor en
       tilstand, der er lavet offline før første login, ikke går tabt. */
    /* Er det den FØRSTE hentning i denne session? Det skal læses her, før
       `klar` sættes — og det afgør, om en fremmed tur er "ny" eller bare
       "en, vi ikke havde set endnu". Uden den skelnen ville et login på en
       ny telefon melde hver eneste delte tur som nyheder på én gang. */
    const førsteHentning = !klar;

    /* DET FORRIGE SPEJL, læst FØR det overskrives (21/9). Det er den eneste
       kilde til, om serveren nogensinde har kendt en af MINE rækker — og
       dermed den eneste måde at skelne disse to fra hinanden:

         lavet offline, aldrig sendt  →  stod ikke i spejlet  →  skal OP
         slettet på en anden enhed    →  stod i spejlet       →  skal VÆK

       Uden den skelnen sender `efterGem()` en tur, man lige har slettet på
       telefonen, op igen fra pc'en — se `fjernForsvundne`. */
    const førSpejl = læs(SPEJL) || {};

    skriv(SPEJL, rækker);
    klar = true;
    sidstHentet = Date.now();
    anvendPåTilstand(rækker, fremmed, førsteHentning, førSpejl);
    return rækker;
  }

  /* Skriver de hentede rækker ind i den levende tilstand. Rækker, der
     står i udbakken, springes over — se reglen ovenfor. */
  function anvendPåTilstand(rækker, fremmed, førsteHentning, førSpejl) {
    if (!opsætning || !opsætning.tilstand) return false;
    const s = opsætning.tilstand();
    if (!s) return false;

    /* `s.fremmed` synkroniseres ALDRIG. `fladgoer()` læser fire faste
       nøgler og kender ikke denne, så den kan ikke havne i udbakken.
       Den er et svar fra serveren om, hvad der kom med ned — ikke noget,
       brugeren ejer, og ikke noget, der skal sendes tilbage. */
    /* Den FORRIGE fremmedliste skal bruges nedenfor, før den overskrives:
       den er den eneste kilde til, hvilke lokale rækker der kom fra en
       anden — og dermed hvilke der skal fjernes igen, hvis serveren
       holder op med at give dem. */
    const førFremmed = s.fremmed || {};

    /* ---- "HUN HAR DELT EN TUR MED DIG" (KN 16/9) ----
       En tur, der er FREMMED nu og ikke var det før, er en tur, den anden
       lige har delt. Det er hele signalet, og det koster ingenting: listen
       over fremmede id'er bliver udregnet i forvejen, fire linjer længere
       nede i `hent()`.

       ⚠️ IKKE VED FØRSTE HENTNING. Logger man ind på en ny telefon, er ALT
       fremmed for første gang, og uden den spærre ville appen melde otte
       måneders delte ture som nyheder på én gang.

       Her meldes kun ID'ERNE. Hvad der skal ske med dem — en besked, et
       kort på forsiden, ingenting — er app.js' beslutning, og sync.js
       rører ikke DOM'en. */
    const nyeDelte = [];
    if (fremmed && !førsteHentning) {
      const før = førFremmed.ture || {};
      Object.keys(fremmed.ture || {}).forEach(id => {
        if (!før[id]) nyeDelte.push(id);
      });
    }

    if (fremmed) {
      const før = JSON.stringify(s.fremmed || {});
      s.fremmed = fremmed;
      if (JSON.stringify(fremmed) !== før) ændretFremmed = true;
    }
    const u = hentUdbakke();
    const venter = (tabel, nøgle) => Object.prototype.hasOwnProperty.call(u, tabel + '|' + nøgle);
    let ændret = ændretFremmed;
    ændretFremmed = false;

    const p = rækker.profiler && rækker.profiler['mig'];
    if (p && !venter('profiler', 'mig')) {
      if (!s.profil) s.profil = {};
      s.profil.navn = p.navn || '';
      s.profil.fødselsdag = p.foedselsdag || '';
      s.profil.notifikationer = p.notifikationer !== false;
      /* Står der ingenting, er man kunde. Aldrig den anden vej rundt: en
         manglende kolonne må ikke kunne blive til en administrator. */
      s.profil.rolle = p.rolle === 'admin' ? 'admin' : 'kunde';
      ændret = true;
    }

    Object.keys(rækker.egne_ting || {}).forEach(id => {
      if (venter('egne_ting', id)) return;
      const r = rækker.egne_ting[id];
      if (!s.egneTing) s.egneTing = {};
      if (!Array.isArray(s.egneTing[r.liste])) s.egneTing[r.liste] = [];
      const står = s.egneTing[r.liste].find(x => x && x.id === id);
      if (!står) { s.egneTing[r.liste].push({ id, tekst: r.tekst || '' }); ændret = true; }
      else if (står.tekst !== (r.tekst || '')) { står.tekst = r.tekst || ''; ændret = true; }
    });

    if (afdublér(s)) ændret = true;

    if (!Array.isArray(s.ture)) s.ture = [];
    Object.keys(rækker.afholdte_ture || {}).forEach(id => {
      if (venter('afholdte_ture', id)) return;
      const r = rækker.afholdte_ture[id];
      const an = (rækker.anmeldelser || {})[id];
      const score = an ? { destination: an.score_destination || 0, komfort: an.score_komfort || 0, app: an.score_app || 0, hygge: an.score_hygge || 0 } : null;
      const findes = s.ture.find(t => t && t.id === id);
      const felter = {
        id, sted: r.sted || '', dato: r.dato || '',
        kommentar: r.kommentar || '', godt: r.godt || '', bedre: r.bedre || '',
        minde: r.minde || '', plan: r.plan || null
      };
      if (score) felter.score = score;
      if (findes) {
        const før = {};
        Object.keys(felter).forEach(n => { før[n] = findes[n]; });
        if (!ensLydende(før, felter)) { Object.assign(findes, felter); ændret = true; }
      } else {
        s.ture.push(Object.assign({ score: null }, felter));
        ændret = true;
      }
    });

    /* De kommende ture. `s.forberedelse` er et OPSLAG i `s.arytmer`
       (app.js:883, en getter der finder på `aktivId`), så en tur, der
       kommer ned, bliver fundet af sig selv — der er ingen anden reference
       at holde ved lige.

       `aktivId` synkroniseres bevidst IKKE. Hvilken tur man sidder og
       kigger på, er noget ved enheden, ikke ved turen: åbner hun
       pakkelisten på telefonen, skal computeren ikke hoppe med. */
    if (!Array.isArray(s.arytmer)) s.arytmer = [];
    Object.keys(rækker.ture || {}).forEach(id => {
      if (venter('ture', id)) return;
      const data = rækker.ture[id].data;
      if (!data || typeof data !== 'object') return;
      data.id = id;
      const plads = s.arytmer.findIndex(a => a && a.id === id);
      if (plads === -1) { s.arytmer.push(data); ændret = true; }
      else if (!ensLydende(s.arytmer[plads], data)) { s.arytmer[plads] = data; ændret = true; }
    });

    /* ---- RÆKKER, SERVEREN IKKE LÆNGERE GIVER (KN 15/9) ----

       `anvendPåTilstand` har indtil nu kun kunnet tilføje og opdatere.
       En række, der forsvandt fra serveren, blev liggende lokalt for
       evigt. Det var ikke et problem, så længe alt delt var delt for
       altid — men fra 0029 kan en tur gøres PRIVAT, og så holder serveren
       op med at give den til rejsemakkeren. Uden det her ville hendes
       telefon beholde kopien, og "privat" ville være en påstand.

       KUN DET FREMMEDE FJERNES, og det er hele sikkerheden i det: en
       fremmed række er pr. definition kommet fra serveren, så holder
       serveren op med at give den, findes den ikke længere for mig.
       Mine EGNE rækker røres aldrig — de kan være lavet offline, ligge i
       udbakken eller vente på første login, og en oprydning, der kunne
       slette dem, ville være langt farligere end en forældet kopi.

       Rækker, der venter i udbakken, springes over: de er ikke sendt
       endnu, så serverens tavshed siger ikke noget om dem. */
    /* ⚠️ UDVIDET 21/9, OG DET ER EN ÆNDRING I HVORNÅR DER SLETTES LOKALT.
       Læs den her, før du rører noget.

       FØR: kun FREMMEDE rækker blev fjernet. Egne blev aldrig rørt, med
       den begrundelse — som er rigtig — at en egen række kan være lavet
       offline og ikke sendt endnu.

       PRISEN VAR, AT SLETNING PÅ TVÆRS AF ENHEDER IKKE VIRKEDE, og den var
       værre end "en forældet kopi": pc'en beholdt sin kopi, spejlet blev
       sat til serverens svar UDEN turen, og `efterGem()` så derfor turen
       som "noget serveren ikke kender" og sendte den OP IGEN. Turen stod
       altså op fra de døde med et nyt `oprettet`-tidspunkt. Set i data
       21/9: en tur slettet på telefonen var indsat på ny få minutter efter.

       NU skelnes der på, om serveren HAR KENDT rækken:

         stod i det forrige spejl  →  serveren kendte den, nu er den væk
                                      →  den blev slettet et andet sted
         stod IKKE i spejlet       →  serveren har aldrig set den
                                      →  lavet offline, skal OP, ikke væk

       ⚠️ DET HER MÅ KUN KØRE EFTER EN HEL HENTNING. Det gør det: hver
       delforespørgsel i `hent()` kaster ved `.error`, og `catch` returnerer
       null FØR spejlet skrives og før vi når hertil. Et halvt svar kan
       altså ikke se ud som en stribe sletninger.

       ⚠️ ÉN GRÆNSE AT KENDE: PostgREST svarer med højst 1000 rækker uden
       et eksplicit interval. Kommer `egne_ting` nogensinde over det, ville
       de afskårne se slettede ud. Der er langt derop i dag — men den dag
       listen kan vokse frit, skal der hentes i sider, FØR den her linje
       må blive stående. */
    const fjernForsvundne = (tabel, liste, findId) => {
      const var_fremmed = førFremmed[tabel] || {};
      const var_kendt = (førSpejl && førSpejl[tabel]) || {};
      const nu = rækker[tabel] || {};
      for (let i = liste.length - 1; i >= 0; i--) {
        const id = findId(liste[i]);
        if (!id) continue;
        if (Object.prototype.hasOwnProperty.call(nu, id)) continue;  // kom stadig med
        if (venter(tabel, id)) continue;                 // ikke sendt endnu
        /* Fremmed før, ELLER kendt af serveren før. Er ingen af delene
           sandt, er det min egen række, som serveren aldrig har set — og
           den skal op, ikke væk. */
        if (!var_fremmed[id] && !Object.prototype.hasOwnProperty.call(var_kendt, id)) continue;
        liste.splice(i, 1);
        ændret = true;
      }
    };
    fjernForsvundne('ture', s.arytmer, a => a && a.id);
    fjernForsvundne('afholdte_ture', s.ture, t => t && t.id);
    if (s.egneTing) {
      Object.keys(s.egneTing).forEach(navn => {
        if (Array.isArray(s.egneTing[navn])) fjernForsvundne('egne_ting', s.egneTing[navn], p => p && p.id);
      });
    }

    /* Beskeden gives FØR der gemmes og tegnes, så app.js kan nå at lægge
       den i tilstanden og få den med i samme tegning. Den må ikke kunne
       vælte hentningen: går app.js' egen håndtering galt, er prisen en
       manglende besked — ikke en tabt synkronisering. */
    if (nyeDelte.length && opsætning.nyDeltTur) {
      try { opsætning.nyDeltTur(nyeDelte); ændret = true; }
      catch (e) { meld('Kunne ikke melde en ny delt tur', e); }
    }

    if (ændret) {
      /* Vi skriver selv i tilstanden lige nu. Uden flaget ville
         `gemLokalt()` kalde `efterGem()`, som ville finde en forskel,
         som ville lægge serverens egne rækker tilbage i udbakken. */
      anvender = true;
      try {
        if (opsætning.gemLokalt) opsætning.gemLokalt();
        if (opsætning.tegnIgen) opsætning.tegnIgen();
      } finally {
        anvender = false;
      }
    }
    return ændret;
  }

  /* ---------- SAMME PUNKT TO GANGE (5/10) ----------

     Oliivia 5/10: "ting kommer til at stå dobbelt på listerne". I data:
     Projektor, Lærred og Bog to gange hver, lagt op 21/9 kl. 10.54 og igen
     kl. 11.53 — samme konto, tre ad gangen. To enheder (eller en nulstillet
     app) havde lavet de samme punkter hver for sig, med hver sine id'er, og
     ved første synkronisering sendte begge deres op. Hentningen fletter på
     id, så begge blev stående.

     NU: to punkter i samme liste med samme tekst — uden forskel på store og
     små bogstaver og på mellemrum, så "Pynte puder" og "Pyntepuder" er ét —
     er ét punkt. Det med det LAVESTE id bliver; reglen er den samme på alle
     enheder, så de ender med det samme. Det andet fjernes lokalt, og fordi
     serveren kendte det, bliver det slettet dér ved næste gem (se
     fjernForsvundne og findÆndringer). Afkrydsninger, der pegede på det
     fjernede id, flyttes over på det, der blev — også de præfiksede i
     klarTjek ('p-', 'b-', 'ms-', 'mo-'). */
  function ensTekst(t) {
    return String(t || '').toLowerCase().replace(/\s+/g, '');
  }
  const VALGLISTER = ['pakkeTjek', 'bilHuske', 'brugValg', 'morgenValg', 'klarTjek'];
  function afdublér(s) {
    if (!s || !s.egneTing) return false;
    const flyt = {};   // fjernet id -> det id, der blev
    Object.keys(s.egneTing).forEach(navn => {
      const liste = s.egneTing[navn];
      if (!Array.isArray(liste)) return;
      const bedst = {};
      liste.forEach(p => {
        if (!p || !p.id) return;
        const k = ensTekst(p.tekst);
        if (!k) return;
        if (!bedst[k] || p.id < bedst[k].id) bedst[k] = p;
      });
      for (let i = liste.length - 1; i >= 0; i--) {
        const p = liste[i];
        if (!p || !p.id) continue;
        const b = bedst[ensTekst(p.tekst)];
        if (b && b !== p) { flyt[p.id] = b.id; liste.splice(i, 1); }
      }
    });
    const fjernede = Object.keys(flyt);
    if (!fjernede.length) return false;
    const omdøb = x => {
      if (typeof x !== 'string') return x;
      if (flyt[x]) return flyt[x];
      for (const gl of fjernede) {
        if (x.length > gl.length && x.endsWith(gl) && x[x.length - gl.length - 1] === '-') {
          return x.slice(0, x.length - gl.length) + flyt[gl];
        }
      }
      return x;
    };
    const ret = f => {
      if (!f || typeof f !== 'object') return;
      VALGLISTER.forEach(k => {
        if (Array.isArray(f[k])) f[k] = Array.from(new Set(f[k].map(omdøb)));
      });
    };
    ret(s.forberedelse);
    (s.arytmer || []).forEach(ret);
    return true;
  }

  /* ---------- den ene linje, `gem()` får ----------

     Må ALDRIG kaste, og må aldrig vente. Finder forskellen, lægger den i
     udbakken og forsøger at skubbe — men gemningen er færdig, uanset
     hvad der sker bagefter. */
  function efterGem() {
    if (anvender) return;
    /* Der samles INTET op, før en hentning er lykkedes. Det er ikke en
       optimering, det er en rettelse — og "har vi en klient" er ikke det
       samme spørgsmål: supabase-biblioteket er indlæst i browseren, længe
       før nogen er logget ind, så klienten findes hele tiden.

       Uden spejlet fra en hentning ville forskellen blive regnet mod
       ingenting, og HELE den lokale tilstand ville lande i udbakken. Så
       ville hentningen springe netop de rækker over (se anvendPåTilstand),
       og en ny, tom telefon ville vinde over serveren. Præcis den tur, der
       skulle hentes ned, ville blive slettet af en tom kopi.

       Efter en lykket hentning står spejlet, og så opdager efterGem() alt
       det lokale, serveren ikke kendte, i én omgang. */
    if (!klar) return;
    try {
      const s = opsætning && opsætning.tilstand ? opsætning.tilstand() : null;
      if (!s) return;
      const ændringer = findÆndringer(fladgoer(s), læs(SPEJL) || {});
      if (!ændringer.length) return;
      læg(ændringer);
      if (klient) skub();
    } catch (e) {
      meld('efterGem', e);
    }
  }

  /* ---------- hent igen, når hun kommer tilbage ----------

     Vejen OP er live: `gem()` lægger i udbakken, og den tømmes med det
     samme. Vejen NED løb kun ved opstart, og det opdagede Kennet med det
     samme den 8/9 — han afsluttede en tur på den ene enhed og måtte
     genindlæse browseren på den anden for at se den.

     Derfor hentes der også, når appen kommer frem igen. Det er præcis
     det øjeblik, hvor hun har været et andet sted og kan være kommet
     bagud, og det er også det øjeblik, hvor det er SIKKERT at tegne
     skærmen om: hun står ikke midt i at skrive noget.

     Derfor er der heller ingen timer. En hentning hvert tiende sekund
     ville kunne ramme ned i et felt, hun sidder og skriver i, og
     `tegn()` tegner hele skærmen om. Rigtig live samtidighed — to
     telefoner, der ser fluebenene dukke op hos hinanden — er Realtime,
     og den hører i fase 3, hvor planen har lagt den.

     Spærren på 10 sekunder er mod at skifte frem og tilbage: browseren
     fyrer `visibilitychange` ved hvert eneste faneskift. */
  const HENT_SPAERRE = 10000;
  function hentHvisModen() {
    if (!klar) return;
    const nu = Date.now();
    if (nu - sidstHentet < HENT_SPAERRE) return;
    hent();
  }

  /* ---------- forsøg igen ----------

     To ting vækker os: uret og browserens `online`. Uden `online` ville
     en telefon, der lige fik dækning igen, vente resten af sin backoff. */
  function planlægForsøg() {
    if (planlagt || !klient) return;
    const om = ventetid;
    ventetid = Math.min(ventetid * 2, FORSØG_MAX);
    planlagt = setTimeout(() => { planlagt = null; skub(); }, om);
    /* Node holder processen i live for en ventende timer. Testene skal
       kunne slutte, og appen er ligeglad. */
    if (planlagt && typeof planlagt.unref === 'function') planlagt.unref();
  }

  async function hentBrugerId() {
    if (opsætning && opsætning.brugerId) return opsætning.brugerId();
    if (typeof ArytmiAuth !== 'undefined' && ArytmiAuth.bruger_id) return ArytmiAuth.bruger_id();
    return null;
  }

  function meld(hvad, fejl) {
    if (opsætning && opsætning.log) opsætning.log(hvad, fejl);
  }

  /* ---------- opstart ----------

     `start()` er med vilje ikke `await`et af `app.js`: appen skal tegne
     med det samme og ikke vente på et netværk. Hentningen lander, når
     den lander, og `tegnIgen` sørger for, at skærmen følger med. */
  function start(valg) {
    opsætning = valg || {};
    klient = opsætning.klient
      || (typeof ArytmiAuth !== 'undefined' && ArytmiAuth.faaKlient ? ArytmiAuth.faaKlient() : null);
    if (!klient) return false;

    if (typeof addEventListener === 'function') {
      /* Nettet er tilbage: både af sted med det, der venter, OG ned efter
         det, de andre har lavet imens. */
      addEventListener('online', () => { ventetid = FORSØG_MIN; skub(); hentHvisModen(); });
    }
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) hentHvisModen();
      });
    }
    hent().then(() => efterGem());
    lytPåÆndringer();
    return true;
  }

  /* ---------- REALTIME (fase 3, 11/9) ----------

     Hidtil hentede vi ned ved opstart og når appen kom frem igen. Det er
     nok til ÉN person på to enheder — hun er kun ét sted ad gangen. Med en
     fast rejsemakker sidder to mennesker med hver sin telefon på samme tid,
     og planens prøve er "kryds af samtidig fra to enheder → begge flueben
     står".

     VI ABONNERER PÅ EN BESKED, IKKE PÅ DATA. Beskeden siger kun "der skete
     noget i den tabel"; så kalder vi `hent()`, som vi allerede stoler på.
     Den kender reglen om, at serveren vinder undtagen for det, der venter i
     udbakken, og den skriver spejlet. Ville vi skrive rækken fra beskeden
     direkte ind, skulle den regel findes to steder — og de to ville drive
     fra hinanden.

     RLS gælder også her: Supabase sender kun rækker, man må se. Derfor
     virker det for en rejsemakker i samme sekund, som 0012 giver adgang,
     uden filtre i klienten.

     HVORFOR DER STADIG IKKE TEGNES MIDT I EN SÆTNING. Kommentaren over
     `hentHvisModen` siger, at en timer ville kunne ramme ned i et felt, hun
     sidder og skriver i. Det gælder ordret for en besked fra en anden
     telefon. To ting holder den fra det:

       1. Står markøren i et felt, venter vi til hun forlader det.
       2. Ellers venter vi et kort øjeblik alligevel. Én gemt tur bliver til
          flere beskeder — turen, tingene, anmeldelsen — og de skal blive til
          ÉN hentning, ikke fem.

     Og `anvendPåTilstand` tegner kun om, når noget faktisk er anderledes
     (se `ensLydende`). Uden den ville vores egne skrivninger komme tilbage
     som beskeder og tegne skærmen om, mens hun skriver. */
  const TABELLER = ['ture', 'egne_ting', 'afholdte_ture', 'anmeldelser'];
  const RO_MS = 700;
  let kanal = null;
  let roTimer = null;
  let venterPåRo = false;

  function skriverLigeNu() {
    if (typeof document === 'undefined') return false;
    const e = document.activeElement;
    if (!e) return false;
    const t = (e.tagName || '').toLowerCase();
    return t === 'input' || t === 'textarea' || t === 'select' || e.isContentEditable === true;
  }

  function hentNårDerErRo() {
    if (roTimer) clearTimeout(roTimer);
    roTimer = setTimeout(() => {
      roTimer = null;
      if (skriverLigeNu()) {
        /* Hun står i et felt. Vi prøver igen, når hun forlader det — og
           `once`, så der ikke hober sig lyttere op ved hvert tastetryk. */
        if (!venterPåRo && typeof document !== 'undefined' && document.addEventListener) {
          venterPåRo = true;
          document.addEventListener('focusout', function igen() {
            document.removeEventListener('focusout', igen);
            venterPåRo = false;
            hentNårDerErRo();
          });
        }
        return;
      }
      hent();
    }, RO_MS);
    if (roTimer && roTimer.unref) roTimer.unref();
  }

  function lytPåÆndringer() {
    if (!klient || kanal || typeof klient.channel !== 'function') return false;
    try {
      kanal = klient.channel('arytmi-deling');
      TABELLER.forEach(tabel => {
        kanal.on('postgres_changes', { event: '*', schema: 'public', table: tabel }, hentNårDerErRo);
      });
      kanal.subscribe();
      return true;
    } catch (e) {
      /* Realtime er en forbedring, ikke et fundament. Kan den ikke sættes
         op, henter vi som før ved opstart og når appen kommer frem. Appen
         må ikke gå i stykker af noget, der kun gør den hurtigere. */
      meld('Realtime kunne ikke sættes op', e);
      kanal = null;
      return false;
    }
  }

  function stopLytning() {
    if (roTimer) { clearTimeout(roTimer); roTimer = null; }
    venterPåRo = false;
    if (!kanal) return;
    try { if (klient && klient.removeChannel) klient.removeChannel(kanal); } catch (e) { /* lukket i forvejen */ }
    kanal = null;
  }

  /* GLEM ALT OM DEN, DER LIGE VAR LOGGET IND (KN 15/9).

     Indtil nu ryddede et logud kun `onboarded` og mailen i app.js.
     Udbakken, spejlet og alle rækkerne blev liggende — og så skete det
     her, når den næste bruger loggede ind paa samme telefon:

       1. `hentNed()` satte spejlet til DEN NYES rækker.
       2. `efterGem()` saa den forriges ture som "noget lokalt, serveren
          ikke kender", og lagde dem i udbakken.
       3. `skrivTabel()` stempler hver række med `ejer_id = den der er
          logget ind nu`.

     Resultatet: den ene brugers ture blev den andens. Det er ikke bare
     rod — det er den ene kundes data i den anden kundes konto.

     Mekanismen i 2 er med vilje og skal blive: den redder en tur, der er
     lavet offline FØR første login. Den er bare kun rigtig, saa laenge det
     er den SAMME bruger. Derfor ryddes der ved logud i stedet for at
     aendre reglen. */
  function glem() {
    const l = lager();
    if (l) {
      try { l.removeItem(UDBAKKE); } catch (e) {}
      try { l.removeItem(SPEJL); } catch (e) {}
    }
    nulstil();
  }

  /* Til testen: gør filen tom igen mellem to prøver. */
  function nulstil() {
    stopLytning();
    opsætning = null; klient = null; kører = false; anvender = false; klar = false;
    sidstHentet = 0;
    ventetid = FORSØG_MIN;
    if (planlagt) { clearTimeout(planlagt); planlagt = null; }
  }

  function status() {
    return {
      klient: !!klient,
      lytter: !!kanal,
      klar,
      venter: Object.keys(hentUdbakke()).length,
      ventetid
    };
  }

  /* ---------- KLADDERNE ----------

     Fase 4A. Almindelige brugere ser det UDGIVNE bundt — hurtigt, cachet,
     virker uden net. En administrator kan derudover se kladderne, og de
     hentes LIVE fra databasen, ikke fra bundtet: en kladde er netop det,
     der ikke er udgivet endnu.

     RLS'en gør arbejdet. "turene laeses af admin" giver adgang til ALLE
     rækker, synlige som ej; er man ikke admin, svarer den med en tom
     liste. Der er altså ingen tjek her, som kan komme til at sige ja ved
     en fejl — svaret er tomt, fordi databasen siger det.

     Fejler kaldet, svares der med null og IKKE med en tom liste. De to
     betyder noget forskelligt: tom liste er "der er ingen kladder", null
     er "vi ved det ikke". Appen skal kunne skelne, for den sidste må ikke
     tømme kortet. */
  async function hentKladder() {
    if (!klient) return null;
    try {
      const { data, error } = await klient
        .from('indhold_tur')
        /* Alle kolonner (5/10): en ny kolonne (fx adresse, 0047) kommer med,
           når migrationen er kørt — og kladderne går ikke i stykker, mens
           appen venter på den. Kun en admin kan læse tabellen. */
        .select('*')
        .order('raekkefoelge');
      if (error) throw error;
      return data || [];
    } catch (e) {
      return null;
    }
  }

  return {
    UDBAKKE, SPEJL, MÅ_SLETTES,
    hentKladder, afdublér,
    rens, fladgoer, findÆndringer, hentHvisModen, ejerkolonne,
    lytPåÆndringer, stopLytning,
    hentUdbakke, læg,
    start, efterGem, skub, hent, status, nulstil, glem
  };
});
