/* =============================================================
   ARYTMI — model.js
   Datalaget, skilt fra skærmene.
   =============================================================

   Tre ting bor her, og ingen af dem rører DOM'en:

   1. `migrerTilV5(g)` — løfter en gemt tilstand op på version 5. Den giver
      stabile id'er til alt, der før blev adresseret med et array-indeks eller
      en tæller, der kun var unik i én session. Det er forudsætningen for at
      to telefoner kan skrive i den samme tur uden at flette forkert.

   2. `tilRaekker(s)` / `fraRaekker(rows)` — oversætter mellem appens ene
      store `s`-objekt og de flade rækker, en database vil have. De er
      hinandens spejlbillede: `fraRaekker(tilRaekker(s))` giver `s` tilbage,
      og det er dækket af en test. Fase 1 sætter Supabase i den anden ende;
      indtil da bruges de kun af testen.

   3. `nytId()` — ét sted, der laver id'er, der ikke kan kollidere mellem to
      enheder. Tid alene er ikke nok: to telefoner, der får det samme punkt
      skrevet ind i det samme millisekund, ville få det samme id.

   Filen indlæses som et almindeligt `<script>` før `app.js` og lægger sig på
   `window.ArytmiModel`. Under Node kan den `require()`es. Samme mønster som
   `vaerktoejskasse/core.js`. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArytmiModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const STATE_VERSION = 7;

  /* Tre dele, og de dækker hver sit hul:
       tid      — læsbart og sorterbart, og skiller to sessioner
       tæller   — skiller id'er lavet i det SAMME millisekund på denne enhed
       tilfælde — skiller to enheder, der laver et id i samme millisekund

     Tælleren er ikke pynt. Første udgave havde kun tid + fire tilfældige tegn,
     og testen fangede en kollision allerede ved 5.000 id'er i samme
     millisekund: 36^4 er 1,7 mio., og fødselsdagsparadokset æder det tal
     hurtigere, end man tror. Migrationen laver netop et id pr. eget punkt i
     én tæt løkke — det er dér, det ville gøre ondt, for to punkter med samme
     id smelter sammen til ét på pakkelisten. */
  let tæller = 0;
  function nytId(præfiks) {
    tæller = (tæller + 1) % 1679616;   // 36^4, så halen bliver ikke lang
    return (præfiks || '') + Date.now().toString(36)
         + '-' + tæller.toString(36)
         + Math.random().toString(36).slice(2, 8);
  }

  /* Hvor et selvskrevet punkts id kan ligge gemt ude i en tur. De fire første
     er rene lister af id'er. `klarTjek` gemmer id'et PRÆFIKSET, fordi det
     samme punkt kan krydses af på flere lister — derfor sin egen behandling. */
  const EGNE_VALGLISTER = ['pakkeTjek', 'bilHuske', 'brugValg', 'morgenValg'];
  const KLAR_PRÆFIKSER = ['p-', 'b-', 'ms-', 'mo-', 's-'];

  /* Alle steder, hvor en "forberedelse" kan ligge: de kommende ture, den der
     endnu ikke er flyttet ind i arytmer (gamle tilstande), og de snapshots,
     afholdte ture bærer rundt på, så de kan gentages. Sidstnævnte er let at
     glemme — og så ville "Gentag turen" hente en pakkeliste med døde id'er. */
  function alleForberedelser(g) {
    const ud = [];
    if (Array.isArray(g.arytmer)) g.arytmer.forEach(a => { if (a && typeof a === 'object') ud.push(a); });
    if (g.forberedelse && typeof g.forberedelse === 'object' && !ud.includes(g.forberedelse)) ud.push(g.forberedelse);
    if (Array.isArray(g.ture)) g.ture.forEach(t => { if (t && t.plan && typeof t.plan === 'object') ud.push(t.plan); });
    return ud;
  }

  /* =============================================================
     FORMEN PÅ EN FORBEREDELSE (21/9)
     =============================================================
     Fundet, fordi forsiden kastede `Cannot read properties of undefined
     (reading 'length')` i `tjeklisteData`. Årsagen lå i `fraRaekker`
     nedenfor:

         arytmer: (r.arytmer || []).map(a => a.data)

     Hver anden linje dér har omhyggelige standardværdier — `p.email || ''`,
     `!!meta.onboarded`, `p.notifikationer !== false`. Arytmerne gik RÅT
     igennem fra serverens JSON, og appen læste dem bagefter, som om de kom
     fra `nyForberedelse()`.

     ⚠️ DET RAMMER IKKE KUN EN GAMMEL TILSTAND. En tur, der kommer ned fra
     serveren — en rejsemakker deler sin, eller man logger ind på en ny
     telefon — har præcis den form, den havde, da den blev gemt. Mangler
     feltet, kaster forsiden, og fejlen ligner en fejl i appen frem for en
     manglende nøgle i et stykke JSON.

     Den samme udfyldning stod i forvejen i `indlæs()` (`if(!f.snackValg)
     f.snackValg = []`) — men KUN for den aktive forberedelse, ikke for de
     øvrige arytmer. Det var halv dækning af det rigtige problem.

     ⚠️ `brugSet` STÅR MED VILJE IKKE PÅ LISTEN. Den har sin egen migration
     i `indlæs()`: `if(!f.brugSet) f.brugSet = [...(f.madValg||[])]`. Satte
     vi den til `[]` her først, ville `!f.brugSet` være falsk bagefter — et
     tomt array er sandt — og migrationen ville springe over. Så ville et
     valgt madscenarie tabe sine forvalgte punkter lydløst. */
  const LISTEFELTER = ['pakkeTjek', 'klarTjek', 'bilHuske', 'madValg',
                       'snackValg', 'morgenValg', 'brugValg', 'invForslag'];

  function sikrForberedelse(f) {
    if (!f || typeof f !== 'object') return f;
    LISTEFELTER.forEach(navn => { if (!Array.isArray(f[navn])) f[navn] = []; });
    return f;
  }

  /* ⚠️ SNAPSHOTS PÅ AFHOLDTE TURE (`s.ture[].plan`) RØRES IKKE. De er
     historik, og `turSnapshot()` udelader afkrydsningerne MED VILJE, så en
     gentaget tur starter forfra. At fylde dem ud ved hver indlæsning ville
     skrive i noget, der ikke har ændret sig, og sende det op igen.
     `gentagTur` er sikker uden: `nyForberedelse({...t.plan})` lægger
     standardværdierne på, netop fordi nøglen mangler i snapshottet. */

  function omdøbEgneReferencer(g, kort) {
    alleForberedelser(g).forEach(f => {
      EGNE_VALGLISTER.forEach(navn => {
        if (Array.isArray(f[navn])) f[navn] = f[navn].map(x => kort[x] || x);
      });
      if (Array.isArray(f.klarTjek)) {
        f.klarTjek = f.klarTjek.map(x => {
          if (typeof x !== 'string') return x;
          for (const pf of KLAR_PRÆFIKSER) {
            if (x.slice(0, pf.length) === pf && kort[x.slice(pf.length)]) return pf + kort[x.slice(pf.length)];
          }
          return kort[x] || x;
        });
      }
    });
  }

  /* Løfter en gemt tilstand til version 5. Kører kun én gang — bagefter står
     der et `version`-felt, og næste indlæsning springer over.

     To ting rettes:

     a) Afholdte ture (`s.ture`) blev adresseret med deres plads i arrayet.
        `gemMinde(3, …)` skrev i "den fjerde tur", ikke i en bestemt tur. Læg
        en tur ind foran, og alle tal peger ét sted forkert. To enheder, der
        begge logger en tur, ville flette hinandens minder sammen.

     b) Egne punkter fik id af en tæller, der startede på `Date.now()` og
        aldrig blev gemt. På én telefon holder det. To telefoner, der starter
        appen i samme sekund, laver de samme id'er til vidt forskellige ting.

     Punkternes id'er ligger fem steder ude i turene, så de skrives om samtidig
     — ellers ville pakkelister og afkrydsninger tømmes lydløst. */
  /* v6: telefonnummeret bliver identiteten.
     PIN-koden lå i klartekst i localStorage og blev aldrig kontrolleret igen
     — den kunne ikke andet end at ligne en lås. Og `email` var hårdkodet til
     `kennet@justsecure.dk` i `friskState()`, så enhver ny bruger arvede den.
     Begge felter fjernes, og `telefon` kommer til. Det rigtige login ligger
     i `auth.js`; her ryddes kun sporene efter det gamle. */
  function migrerTilV6(g) {
    if (!g || typeof g !== 'object') return g;
    if (!g.profil || typeof g.profil !== 'object') g.profil = {};
    if (typeof g.profil.telefon !== 'string') g.profil.telefon = '';
    delete g.profil.kode;
    delete g.profil.kodeEmail;
    delete g.profil.email;
    return g;
  }

  function migrerTilV5(g) {
    if (!g || typeof g !== 'object') return g;
    if (g.version >= STATE_VERSION) return g;
    if (g.version >= 5) return migrerFaerdig(g);

    if (Array.isArray(g.ture)) {
      g.ture.forEach(t => { if (t && typeof t === 'object' && !t.id) t.id = nytId('t'); });
    }

    const kort = {};
    if (g.egneTing && typeof g.egneTing === 'object') {
      Object.keys(g.egneTing).forEach(liste => {
        const arr = g.egneTing[liste];
        if (!Array.isArray(arr)) return;
        arr.forEach(p => {
          if (!p || typeof p !== 'object') return;
          const gammel = p.id;
          p.id = nytId('eget-' + liste + '-');
          if (gammel) kort[gammel] = p.id;
        });
      });
    }
    if (Object.keys(kort).length) omdøbEgneReferencer(g, kort);

    return migrerFaerdig(g);
  }

  /* Trinnene efter v5 samles her, så `indlæs()` kun har ét kald at forholde
     sig til. Kommer der et v7, lægges det på enden — ikke inde i v5-koden,
     som er kørt på rigtige telefoner og ikke skal røres igen. */
  /* v7: mailadressen bliver identiteten.
     v6 fjernede `email`, fordi telefonnummeret skulle være kontoen. Samme
     dag blev kunderejsen lagt fast — salget starter i en mail — og så kom
     feltet tilbage. v6 rettes IKKE; den har kørt på en maskine, og en
     migration, der ændrer sig efter at have kørt, er ikke til at stole på.
     Der lægges et trin på i stedet.

     Telefonen bliver stående. Den bruges nu kun til at invitere en ven med
     på én tur. */
  function migrerTilV7(g) {
    if (!g || typeof g !== 'object') return g;
    if (!g.profil || typeof g.profil !== 'object') g.profil = {};
    if (typeof g.profil.email !== 'string') g.profil.email = '';
    return g;
  }

  /* Hvert trin køres KUN, hvis tilstanden ikke allerede er forbi det.
     Første udgave kørte dem alle hver gang, og så slettede v6-trinnet en
     mailadresse, som v7 lige havde gjort til identiteten — på en tilstand,
     der allerede var på 6. Testen fangede det.

     Reglen: et migrationstrin er skrevet til at løfte fra ÉN version til
     den næste. Køres det på noget nyere, laver det skade, ikke ingenting. */
  function migrerFaerdig(g) {
    const fra = Number(g.version) || 0;
    if (fra < 6) migrerTilV6(g);
    if (fra < 7) migrerTilV7(g);
    g.version = STATE_VERSION;
    return g;
  }

  /* ---------- appens tilstand <-> flade rækker ----------

     Formen her er ikke den endelige Postgres-tabel — den skrives i Fase 1,
     når vi ved, hvad RLS skal kunne. Det, den ER, er kontrakten: hver række
     har et id, ingen række kender sin plads i et array, og intet går tabt
     undervejs. Testen holder os til det.

     `arytmer` og de afholdte tures `plan` gemmes som hele objekter. Det er
     med vilje: turens indhold ændrer sig stadig hver uge, og en kolonne pr.
     felt ville skulle laves om hver gang. Id, dato og ejer skal derimod stå
     for sig — det er dem, man søger og deler på. */
  function tilRaekker(s) {
    const profil = (s && s.profil) || {};
    const partner = profil.partner || {};
    return {
      meta: {
        version: STATE_VERSION,
        onboarded: !!(s && s.onboarded),
        aktivId: (s && s.aktivId) || null
      },
      profil: {
        email: profil.email || '',
        telefon: profil.telefon || '',
        navn: profil.navn || '',
        fødselsdag: profil.fødselsdag || '',
        notifikationer: profil.notifikationer !== false,
        partnerNavn: partner.navn || '',
        partnerTelefon: partner.telefon || '',
        partnerStatus: partner.status == null ? null : partner.status
      },
      arytmer: ((s && s.arytmer) || []).map(a => ({ id: a.id, data: a })),
      ture: ((s && s.ture) || []).map(t => ({
        id: t.id,
        sted: t.sted || '',
        dato: t.dato || '',
        score: t.score || null,
        kommentar: t.kommentar || '',
        godt: t.godt || '',
        bedre: t.bedre || '',
        minde: t.minde || '',
        plan: t.plan || null
      })),
      /* Én flad liste i stedet for et objekt med en nøgle pr. liste. Sådan
         ser en tabel ud, og sådan kan et enkelt punkt deles eller slettes
         uden at hele pakkelisten skal skrives om. */
      egne: fladEgneTing((s && s.egneTing) || {})
    };
  }

  function fladEgneTing(egneTing) {
    const ud = [];
    Object.keys(egneTing).forEach(liste => {
      const arr = egneTing[liste];
      if (!Array.isArray(arr)) return;
      arr.forEach(p => { if (p && typeof p === 'object') ud.push({ id: p.id, liste, tekst: p.tekst || '' }); });
    });
    return ud;
  }

  /* Modsatte vej. `listeNavne` sikrer, at tomme lister findes igen bagefter —
     uden dem ville en liste, man har tømt, forsvinde helt, og appen ville
     ikke kunne skelne "ingen egne punkter" fra "listen findes ikke". */
  function fraRaekker(rows, listeNavne) {
    const r = rows || {};
    const meta = r.meta || {};
    const p = r.profil || {};
    const egneTing = {};
    (listeNavne || []).forEach(k => { egneTing[k] = []; });
    (r.egne || []).forEach(e => {
      if (!e || !e.liste) return;
      if (!Array.isArray(egneTing[e.liste])) egneTing[e.liste] = [];
      egneTing[e.liste].push({ id: e.id, tekst: e.tekst || '' });
    });
    return {
      version: meta.version || STATE_VERSION,
      onboarded: !!meta.onboarded,
      aktivId: meta.aktivId == null ? null : meta.aktivId,
      profil: {
        email: p.email || '',
        telefon: p.telefon || '',
        navn: p.navn || '',
        fødselsdag: p.fødselsdag || '',
        notifikationer: p.notifikationer !== false,
        partner: {
          navn: p.partnerNavn || '',
          telefon: p.partnerTelefon || '',
          status: p.partnerStatus == null ? null : p.partnerStatus
        }
      },
      /* `sikrForberedelse` og ikke bare `a.data`: rækken fra serveren har
         den form, den havde, da den blev gemt — ikke nødvendigvis den,
         appen læser den med. Se kommentaren over LISTEFELTER. */
      arytmer: (r.arytmer || []).map(a => sikrForberedelse(a.data)),
      ture: (r.ture || []).map(t => ({
        id: t.id,
        sted: t.sted || '',
        dato: t.dato || '',
        score: t.score || null,
        kommentar: t.kommentar || '',
        godt: t.godt || '',
        bedre: t.bedre || '',
        minde: t.minde || '',
        plan: t.plan || null
      })),
      egneTing
    };
  }

  return { STATE_VERSION, nytId, migrerTilV5, migrerTilV6, migrerTilV7, tilRaekker, fraRaekker,
           fladEgneTing, sikrForberedelse };
});
