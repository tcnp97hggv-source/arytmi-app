/* =============================================================
   ARYTMI — auth.js
   Mailadressen er identiteten. Kunderejsen, besluttet 7/9.
   =============================================================

   Rejsen, som den er aftalt:
     1-3  kunden køber, oprettes automatisk som betalende bruger
     4    ordrebekræftelsen indeholder et AKTIVERINGSLINK
     5    kunden logger ind med sin mail — kun hvis den er oprettet
     6    kunden vælger et kodeord på mindst 12 tegn
     7    kunden kan oprette ÉN partner, én gang

   Aktiveringslinket er ikke pynt. Uden det er det eneste, der skiller en
   fremmed fra en betalt konto, at han kender mailadressen — og
   mailadresser er ikke hemmeligheder, de står på LinkedIn. Linket er
   beviset på, at man er køberen.

   SMS bruges KUN til at invitere en ven med på én arytme (fase 3). Ikke
   til login. Det er derfor, `send-sms` er flyttet fra at være Supabases
   login-hook til at være en funktion, vi selv kalder.

   Filen rører ikke DOM'en og kender ikke til skærme. Den ved kun, hvordan
   man kommer ind. `app.js` tegner.

   NØGLEN HERUNDER ER OFFENTLIG. Det er anon-nøglen, lavet til at stå i
   klientkode: den giver ingenting uden at RLS siger god for det — bevist,
   ikke antaget, se `supabase/LAES-MIG.md`. Service-nøglen er en HELT anden
   ting og må aldrig i dette repo. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArytmiAuth = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const PROJEKT = {
    url: 'https://vxleyvtumbwtkejoiaev.supabase.co',
    anon: 'sb_publishable_NQvNdYWs3PZrHGai2l0rgw_Vz1KCCLP'
  };

  /* Kodeordsreglen, besluttet af Kennet 7/9: mindst 12 tegn, og ikke et
     kodeord fra et kendt læk. BEVIDST intet krav om specialtegn — tvungne
     tegnkrav producerer Sommer2026! og genbrug på tværs af tjenester.
     Længden gør arbejdet.

     Læk-tjekket sker på serveren, ikke her. En regel, der kun findes i en
     browser, er en anbefaling. Tallet står begge steder, fordi brugeren
     skal kunne se det, mens hun skriver. */
  const MIN_KODEORD = 12;

  let klient = null;

  /* Klienten laves først, når nogen beder om den. Under Node (testene) og i
     navigationstesten findes `supabase` ikke, og så skal auth.js hverken
     kaste eller prøve at nå nettet — den skal bare sige "ikke tilgængelig".
     Testen skal kunne køre uden en netværksforbindelse. */
  function faaKlient() {
    if (klient) return klient;
    if (typeof supabase === 'undefined' || !supabase.createClient) return null;
    klient = supabase.createClient(PROJEKT.url, PROJEKT.anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Vi læser selv aktiveringstokenet ud af adressen. Supabase skal
        // ikke blande sig i den del.
        detectSessionInUrl: false,
        storageKey: 'arytmi-session'
      }
    });
    return klient;
  }

  function tilgaengelig() { return faaKlient() !== null; }

  /* ---------- mailadresser ----------
     Ét format hele vejen: trimmet og småt. Uden det ville
     "Kennet@Arytmi.com" og "kennet@arytmi.com " blive to forskellige
     brugere — og hun ville ikke kunne finde den konto, hun havde betalt
     for. Databasen har et unikt indeks på lower(email), så de to steder
     skal være enige. */
  function normaliserEmail(raa) {
    const e = String(raa || '').trim().toLowerCase();
    if (!e) return null;
    // Bevidst løs kontrol. En streng regel afviser gyldige adresser, og
    // den rigtige prøve er alligevel, om mailen kom frem.
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return null;
    if (e.length > 254) return null;
    return e;
  }

  /* Hvad er galt med kodeordet? Returnerer null, når intet er.
     Bruges til at fortælle brugeren det MENS hun skriver — serveren siger
     nej alligevel, hvis hun ikke lytter. */
  function kodeordsFejl(kodeord) {
    const k = String(kodeord || '');
    if (k.length < MIN_KODEORD) {
      return `Kodeordet skal være mindst ${MIN_KODEORD} tegn. Du har ${k.length}.`;
    }
    return null;
  }

  /* ---------- telefonnumre ----------
     Bruges nu KUN til at invitere en ven med på en tur, ikke til login.
     Normaliseringen bliver: to måder at skrive det samme nummer på må ikke
     blive til to forskellige invitationer. */
  function normaliserTelefon(raa) {
    let t = String(raa || '').replace(/[\s\-().]/g, '');
    if (!t) return null;
    if (t.slice(0, 2) === '00') t = '+' + t.slice(2);
    if (t[0] !== '+') {
      // Otte cifre uden landekode læses som dansk. Alt andet skal skrives
      // med + foran, så vi ikke gætter forkert på en udenlandsk gæst.
      if (/^\d{8}$/.test(t)) t = '+45' + t;
      else return null;
    }
    if (!/^\+\d{8,15}$/.test(t)) return null;
    return t;
  }

  function visTelefon(e164) {
    const t = String(e164 || '');
    if (/^\+45\d{8}$/.test(t)) {
      const c = t.slice(3);
      return '+45 ' + c.slice(0, 2) + ' ' + c.slice(2, 4) + ' ' + c.slice(4, 6) + ' ' + c.slice(6);
    }
    return t;
  }

  /* ---------- aktivering (trin 5-6) ---------- */

  /* Tokenet står i adressens FRAGMENT — arytmi.com/aktiver#<token> — og
     ikke i en forespørgselsstreng. Fragmentet sendes aldrig til en server
     og havner derfor ikke i logfiler eller i en henvisende adresse. Samme
     valg som gæstelinket i fase 3. */
  function tokenFraAdressen() {
    if (typeof location === 'undefined') return null;
    const h = String(location.hash || '').replace(/^#/, '').trim();
    return /^[0-9a-f]{32,128}$/i.test(h) ? h : null;
  }

  /* Sætter kodeordet og gør kontoen til hendes. Serveren kontrollerer
     tokenet, længden OG om kodeordet står i et kendt læk. */
  async function aktiver(token, kodeord) {
    const lokalFejl = kodeordsFejl(kodeord);
    if (lokalFejl) return { ok: false, fejl: lokalFejl };
    if (!token) return { ok: false, fejl: 'Aktiveringslinket mangler. Åbn linket fra din ordrebekræftelse.' };
    try {
      const r = await fetch(PROJEKT.url + '/functions/v1/aktiver-konto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: PROJEKT.anon },
        body: JSON.stringify({ token, kodeord })
      });
      const svar = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, fejl: svar.error || 'Kontoen kunne ikke aktiveres.' };
      return { ok: true, email: svar.email || null };
    } catch (e) {
      return { ok: false, fejl: 'Ingen forbindelse. Tjek nettet, og prøv igen.' };
    }
  }

  /* ---------- koden på mail (K21, Kennet og Oliivia 4/10) ----------
     Kunden opretter sig I APPEN: mail → 6-cifret kode på mail → kodeord.
     Kontoen findes allerede (købet lavede den); koden beviser, at det er
     hende, der ejer postkassen. Samme vej bruges til "glemt kodeord".
     Serveren er `mailkode` og svarer det samme, uanset om adressen findes. */

  async function bedOmKode(raaEmail) {
    const email = normaliserEmail(raaEmail);
    if (!email) return { ok: false, fejl: 'Skriv den mailadresse, du købte Arytmi med.' };
    try {
      const r = await fetch(PROJEKT.url + '/functions/v1/mailkode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: PROJEKT.anon },
        body: JSON.stringify({ email })
      });
      const svar = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, fejl: svar.error || 'Koden kunne ikke sendes. Prøv igen.' };
      return { ok: true, email };
    } catch (e) {
      return { ok: false, fejl: 'Ingen forbindelse. Tjek nettet, og prøv igen.' };
    }
  }

  /* Mellemrum og bindestreg tåles — mailen viser koden som "123 456". */
  function rensKode(raa) {
    const k = String(raa || '').replace(/[\s-]/g, '');
    return /^\d{6}$/.test(k) ? k : null;
  }

  async function saetKodeordMedKode(raaEmail, raaKode, kodeord) {
    const email = normaliserEmail(raaEmail);
    if (!email) return { ok: false, fejl: 'Skriv din mailadresse.' };
    const kode = rensKode(raaKode);
    if (!kode) return { ok: false, fejl: 'Koden er seks cifre. Du finder den i mailen fra os.' };
    const lokalFejl = kodeordsFejl(kodeord);
    if (lokalFejl) return { ok: false, fejl: lokalFejl };
    try {
      const r = await fetch(PROJEKT.url + '/functions/v1/mailkode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: PROJEKT.anon },
        body: JSON.stringify({ email, kode, kodeord })
      });
      const svar = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, fejl: svar.error || 'Det gik ikke. Prøv igen.' };
      return { ok: true, email: svar.email || email };
    } catch (e) {
      return { ok: false, fejl: 'Ingen forbindelse. Tjek nettet, og prøv igen.' };
    }
  }

  /* ---------- ind og ud ---------- */

  async function logInd(raaEmail, kodeord) {
    const email = normaliserEmail(raaEmail);
    if (!email) return { ok: false, fejl: 'Skriv din mailadresse.' };
    if (!kodeord) return { ok: false, fejl: 'Skriv dit kodeord.' };
    const k = faaKlient();
    if (!k) return { ok: false, fejl: 'Ingen forbindelse til Arytmi lige nu.' };
    try {
      const { data, error } = await k.auth.signInWithPassword({ email, password: kodeord });
      if (error) return { ok: false, fejl: laesbarFejl(error) };
      return { ok: true, bruger: (data && data.user) || null };
    } catch (e) {
      return { ok: false, fejl: laesbarFejl(e) };
    }
  }

  async function logUd() {
    const k = faaKlient();
    if (!k) return { ok: true };
    try { await k.auth.signOut(); } catch (e) { /* offline: sessionen ryger lokalt alligevel */ }
    return { ok: true };
  }

  async function nuvaerendeBruger() {
    const k = faaKlient();
    if (!k) return null;
    try {
      const { data } = await k.auth.getUser();
      return (data && data.user) || null;
    } catch (e) {
      return null;
    }
  }

  async function bruger_id() {
    const b = await nuvaerendeBruger();
    return b ? b.id : null;
  }

  /* ER HUN LOGGET IND? (4/10) — læses LOKALT, uden net. true/false, eller
     null når vi ikke kan vide det (ingen klient: navigationstesten, eller
     biblioteket er ikke indlæst). En udløbet adgangsnøgle tæller som logget
     ind: den fornys, når der er net. Kun en session, der er VÆK, er false. */
  async function harSession() {
    const k = faaKlient();
    if (!k) return null;
    try {
      const { data } = await k.auth.getSession();
      return !!(data && data.session);
    } catch (e) {
      return null;
    }
  }

  /* Kaldes, hvis sessionen forsvinder, mens appen er åben — fx fordi
     fornyelsen blev afvist. Uden den kørte appen videre, som om alt var
     godt, og intet kom op på serveren (iPhonen 4/10). */
  function vedUdlogning(fn) {
    const k = faaKlient();
    if (!k || typeof fn !== 'function') return;
    try {
      k.auth.onAuthStateChange((hændelse) => { if (hændelse === 'SIGNED_OUT') fn(); });
    } catch (e) { /* uden lytter er vi ikke dårligere stillet end før */ }
  }

  /* ---------- fejl, et menneske kan læse ----------
     Mønsteret er det samme som `errorMessage()` i værktøjskassen — og den
     lærte os noget den 6/9: en generel tekst må ALDRIG overskrive en
     præcis. Kendte tilfælde først, den engelske besked som sidste udvej. */
  function laesbarFejl(fejl) {
    const besked = String((fejl && (fejl.message || fejl.msg)) || '').toLowerCase();
    const status = fejl && (fejl.status || fejl.statusCode);

    /* Den vigtigste. Supabase svarer det samme, uanset om mailen ikke
       findes, eller kodeordet er forkert — og sådan skal det være: kunne
       man se forskel, kunne man afprøve mailadresser og finde ud af, hvem
       der er kunde. Teksten her skal derfor heller ikke skelne, men den
       skal nævne, at man kun kan logge ind, hvis man har købt. */
    if (besked.includes('invalid login credentials') || besked.includes('invalid_credentials')) {
      return 'Mail eller kodeord passer ikke. Har du købt Arytmi, men ikke oprettet dig endnu, så tryk "Første gang? Opret dig".';
    }
    if (besked.includes('email not confirmed')) return 'Kontoen er ikke oprettet endnu. Tryk "Første gang? Opret dig".';
    if (besked.includes('rate limit') || status === 429) return 'For mange forsøg. Vent et minut, og prøv igen.';
    if (besked.includes('failed to fetch') || besked.includes('network')) return 'Ingen forbindelse. Tjek nettet, og prøv igen.';
    if (besked.includes('signups not allowed')) return 'Der kan ikke oprettes konti her. Arytmi fås ved at købe pakken.';
    if (besked.includes('password') && besked.includes('short')) return `Kodeordet skal være mindst ${MIN_KODEORD} tegn.`;

    // Har Supabase en brugbar besked, får den lov at stå frem for en tom
    // floskel — det var præcis dét, der gik galt i core.js den 6/9.
    if (fejl && fejl.message) return fejl.message;
    return 'Noget gik galt. Prøv igen.';
  }

  /* ---------- profilen ----------
     Profilrækken laves af en trigger ved oprettelsen, så den findes altid.
     Bemærk: `email`, `telefon`, `rolle` og `partner_laast` kan IKKE rettes
     herfra. Databasen har frataget brugeren skriveretten på netop de fire
     kolonner — ellers kunne enhver gøre sig selv til admin eller slå sin
     egen partnerlås fra. */
  async function hentProfil() {
    const k = faaKlient();
    if (!k) return null;
    const id = await bruger_id();
    if (!id) return null;
    try {
      const { data, error } = await k.from('profiler').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  async function gemProfil(felter) {
    const k = faaKlient();
    if (!k) return { ok: false, fejl: 'Ingen forbindelse.' };
    const id = await bruger_id();
    if (!id) return { ok: false, fejl: 'Du er ikke logget ind.' };
    // Kun de tre felter, brugeren ejer. Sender vi mere, afviser databasen
    // hele opdateringen — og så mister hun også det, hun havde lov til.
    const tilladt = {};
    ['navn', 'foedselsdag', 'notifikationer'].forEach(f => {
      if (Object.prototype.hasOwnProperty.call(felter || {}, f)) tilladt[f] = felter[f];
    });
    if (!Object.keys(tilladt).length) return { ok: true };
    try {
      const { error } = await k.from('profiler').update(tilladt).eq('id', id);
      if (error) return { ok: false, fejl: laesbarFejl(error) };
      return { ok: true };
    } catch (e) {
      return { ok: false, fejl: laesbarFejl(e) };
    }
  }

  /* ---------- den faste rejsemakker (fase 3) ----------

     Trin 7 i rejsen øverst i filen. Indtil nu var den teater:
     `partnerInviter()` i app.js satte `status = 'sendt'` i localStorage og
     viste en tegning af en SMS, der aldrig blev sendt.

     INVITATIONEN SENDES AF SERVEREN, ikke herfra. Tokenet er det eneste,
     der står mellem en fremmed og fuld adgang til alle jeres ture, og det
     må derfor ikke laves et sted, hvor nogen kan se det blive til. Og
     beskeden skal af sted, selv hvis telefonen lukkes i samme sekund.
     `inviter-partner` gør begge dele. Her siger vi til, og rækker svaret
     videre, som det er. */
  async function inviterPartner(raaNavn, raaTelefon) {
    const navn = String(raaNavn || '').trim();
    const telefon = normaliserTelefon(raaTelefon);
    if (!navn) return { ok: false, fejl: 'Skriv hvad din rejsemakker hedder.' };
    if (!telefon) return { ok: false, fejl: 'Skriv et telefonnummer, vi kan læse — otte cifre, eller med + og landekode.' };

    const k = faaKlient();
    if (!k) return { ok: false, fejl: 'Ingen forbindelse til Arytmi lige nu.' };

    /* Identiteten kommer fra sessionens token og ingen andre steder fra.
       Funktionen læser afsenderen ud af det selv — vi sender ikke et
       bruger-id med, for så kunne enhver invitere på enhver andens vegne. */
    let adgangstoken = null;
    try {
      const { data } = await k.auth.getSession();
      adgangstoken = (data && data.session && data.session.access_token) || null;
    } catch (e) { adgangstoken = null; }
    if (!adgangstoken) return { ok: false, fejl: 'Log ind først.' };

    try {
      const r = await fetch(PROJEKT.url + '/functions/v1/inviter-partner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: PROJEKT.anon,
          Authorization: 'Bearer ' + adgangstoken
        },
        body: JSON.stringify({ navn, telefon })
      });
      const svar = await r.json().catch(() => ({}));
      /* Funktionens egen besked, ord for ord. Den ved, hvad der gik galt —
         låsen, taksten, adgangen, eller at SMS'en ikke kunne sendes — og en
         almindelig "noget gik galt" ville kaste den viden væk. Præcis den
         fejl, `laesbarFejl` blev skrevet for at undgå. */
      if (!r.ok) return { ok: false, fejl: svar.error || 'Invitationen kunne ikke sendes.' };
      return { ok: true, telefon };
    } catch (e) {
      return { ok: false, fejl: 'Ingen forbindelse. Tjek nettet, og prøv igen.' };
    }
  }

  /* Er invitationen blevet accepteret? Accepten sker på `arytmi.com/os`, på
     HENDES telefon — afsenderens app hører aldrig om det af sig selv. Den
     eneste ærlige måde at vide det på er at spørge databasen.

     Rækken i `partner` må vi selv læse (politikken "egne partnerskaber
     laeses" i 0001). Den er nok: findes den, er I koblet.

     HENDES NAVN ligger ikke her. `profiler` må kun læses af ejeren selv,
     så partnerskabsrækken kan ikke bære navnet med. Afsenderen har det fra
     den invitation, hun selv skrev; den inviterede spørger
     `hentPartnerNavn()` nedenfor (0027). */
  async function hentPartner() {
    /* TO FORSKELLIGE NEJ, og de maa ikke se ens ud.

       "Der findes intet partnerskab" er et svar. "Jeg kunne ikke naa
       databasen" er fravaeret af et svar. Foerste udgave returnerede null
       for begge, og saa kunne app.js kun turde gaa én vej — den kunne
       opdage en accept, men aldrig opdage en ophaevelse, for den kunne ikke
       vide, om det tomme svar betoed "slettet" eller "offline".

       Derfor: { ok: false } naar vi ikke fik spurgt, { ok: true, partner:
       null } naar vi spurgte og der ikke var nogen. */
    const k = faaKlient();
    if (!k) return { ok: false };
    const id = await bruger_id();
    if (!id) return { ok: false };
    try {
      const { data, error } = await k.from('partner')
        .select('a_id, b_id, status')
        .or('a_id.eq.' + id + ',b_id.eq.' + id)
        .limit(1);
      if (error) return { ok: false };
      if (!data || !data.length) return { ok: true, partner: null };
      const p = data[0];
      return { ok: true, partner: { status: p.status, jegInviterede: p.a_id === id } };
    } catch (e) {
      return { ok: false };
    }
  }

  /* Sletningen er rigtig nu: rækken ryger, og hun mister adgangen til
     jeres ture i samme sekund.

     LÅSEN BLIVER STÅENDE. Migration 0004 siger det lige ud: "Laasen
     slettes IKKE, naar partnerskabet slettes. Det er hele pointen."
     Derfor skal app.js sige det i spørgsmålet — før der trykkes, ikke
     bagefter. */
  async function fjernPartner() {
    const k = faaKlient();
    if (!k) return { ok: false, fejl: 'Ingen forbindelse til Arytmi lige nu.' };
    const id = await bruger_id();
    if (!id) return { ok: false, fejl: 'Du er ikke logget ind.' };
    try {
      const { error } = await k.from('partner').delete().or('a_id.eq.' + id + ',b_id.eq.' + id);
      if (error) return { ok: false, fejl: laesbarFejl(error) };
      return { ok: true };
    } catch (e) {
      return { ok: false, fejl: laesbarFejl(e) };
    }
  }

  /* Har jeg en invitation ude, som ingen har taget imod endnu?

     KENNET 11/9, ved at kigge på sin egen skærm: "Skal det ikke blive der
     indtil personen har accepteret?" Jo — og det kunne det ikke, fordi
     "Afventer Oliivia" kun fandtes i localStorage på den telefon, der
     sendte den. `fladgoer()` sender ikke `profil.partner` op, så en ny
     telefon, ryddede data eller en frisk app fra Play viste den tomme
     formular, mens tokenet levede videre i fjorten dage.

     `0015` lod afsenderen læse sine egne invitationer — SELECT alene, og
     uden `token_hash`, som ingen kan læse. Derfor kan kortet nu finde
     tilbage til sandheden i stedet for at gætte ud fra, hvad der tilfældigvis
     står på den her enhed.

     Kun den ÅBNE: brugt eller udløbet er ikke noget, man venter på. */
  async function hentSendtInvitation() {
    const k = faaKlient();
    if (!k) return { ok: false };
    try {
      const { data, error } = await k.from('partner_invitation')
        .select('navn, telefon, udloeber')
        .is('brugt_kl', null)
        .gt('udloeber', new Date().toISOString())
        .order('oprettet', { ascending: false })
        .limit(1);
      if (error) return { ok: false };
      if (!data || !data.length) return { ok: true, invitation: null };
      return { ok: true, invitation: data[0] };
    } catch (e) {
      return { ok: false };
    }
  }

  /* Navnet på den, invitationen gik til — OGSÅ når den er indløst.

     `hentSendtInvitation()` ovenfor filtrerer med vilje på `brugt_kl is
     null`: den skal finde en invitation, der stadig VENTER. Men når den er
     accepteret, står partnerskabet tilbage uden et navn nogen steder —
     `profiler` må kun læses af ejeren selv, så den andens navn kan ikke
     slås op dér.

     Afsenderen skrev navnet selv, da hun sendte invitationen, og
     politikken `egne sendte invitationer laeses` giver hende lov til at
     læse sine egne rækker. Så navnet hentes tilbage herfra.

     Virker KUN for den, der inviterede. Den inviterede har ingen sendt
     invitation og ser derfor stadig "Din rejsemakker", til vi har en vej
     til at dele et visningsnavn begge veje. */
  async function hentIndloestInvitation() {
    const k = faaKlient();
    if (!k) return { ok: false };
    try {
      const { data, error } = await k.from('partner_invitation')
        .select('navn, telefon, brugt_kl')
        .not('brugt_kl', 'is', null)
        .order('brugt_kl', { ascending: false })
        .limit(1);
      if (error) return { ok: false };
      if (!data || !data.length) return { ok: true, invitation: null };
      return { ok: true, invitation: data[0] };
    } catch (e) {
      return { ok: false };
    }
  }

  /* Navnet på den, man deler med — den vej, en invitation ikke kan svare på.

     `hentIndloestInvitation()` ovenfor virker kun for den, der INVITEREDE:
     hun skrev selv navnet, da hun sendte SMS'en. Den inviterede har aldrig
     sendt en invitation, og `profiler` må kun læses af ejeren selv — så
     hos hende stod der "Din rejsemakker", også længe efter at de delte alt
     andet. Kennet 15/9, da Oliivia havde fået appen i hånden: "Du må også
     gerne fikse det med at Oliivia også kan se at hun deler med mig."

     `partner_navn()` (migration 0027) svarer på det ene spørgsmål uden at
     åbne profilen: den tager INGEN parameter, så den kan ikke bruges til at
     slå andre brugere op — kun "hvad hedder min partner". Findes der intet
     aktivt partnerskab, er svaret null, og kortet falder tilbage som før. */
  async function hentPartnerNavn() {
    const k = faaKlient();
    if (!k) return { ok: false };
    try {
      const { data, error } = await k.rpc('partner_navn');
      if (error) return { ok: false };
      return { ok: true, navn: (typeof data === 'string' && data) ? data : null };
    } catch (e) {
      return { ok: false };
    }
  }

  /* ---------- gæsten på ÉN tur (fase 3) ----------

     Forskellen på gæsten og rejsemakkeren er hele pointen:
       rejsemakker   én person, alle ture, for altid, med login
       gæst          én person, én tur, én gang, uden login

     Derfor et token og ikke et partnerskab. Gæsten har ingen identitet
     hos os og skal ikke have en.

     `visning` er det, gæsten får at se, og den regnes i app.js — dér hvor
     pakkelistens opdeling findes. Serveren klipper felterne, men den
     regner dem ikke ud: den samme udregning to steder ville drive fra
     hinanden, præcis som den falske SMS i partnerkortet gjorde. */
  async function inviterGaest(turId, raaNavn, raaTelefon, besked, visning) {
    const navn = String(raaNavn || '').trim();
    const telefon = normaliserTelefon(raaTelefon);
    if (!turId) return { ok: false, fejl: 'Der er ingen tur at invitere til.' };
    if (!navn) return { ok: false, fejl: 'Skriv hvad din gæst hedder.' };
    if (!telefon) return { ok: false, fejl: 'Skriv et telefonnummer, vi kan læse — otte cifre, eller med + og landekode.' };

    const k = faaKlient();
    if (!k) return { ok: false, fejl: 'Ingen forbindelse til Arytmi lige nu.' };

    let adgangstoken = null;
    try {
      const { data } = await k.auth.getSession();
      adgangstoken = (data && data.session && data.session.access_token) || null;
    } catch (e) { adgangstoken = null; }
    if (!adgangstoken) return { ok: false, fejl: 'Log ind først.' };

    try {
      const r = await fetch(PROJEKT.url + '/functions/v1/inviter-gaest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: PROJEKT.anon,
          Authorization: 'Bearer ' + adgangstoken
        },
        body: JSON.stringify({ tur_id: turId, navn, telefon, besked: besked || '', visning: visning || {} })
      });
      const svar = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, fejl: svar.error || 'Invitationen kunne ikke sendes.' };
      return { ok: true, telefon };
    } catch (e) {
      return { ok: false, fejl: 'Ingen forbindelse. Tjek nettet, og prøv igen.' };
    }
  }

  /* Har gæsten svaret? Svaret gives på `arytmi.com/liste`, på GÆSTENS
     telefon — afsenderens app hører aldrig om det af sig selv.

     `tur_gaest` må læses af turens ejer og af den faste rejsemakker
     (politikken "egne gaester laeses" i 0014), men KUN de kolonner, 0014
     giver videre. `token_hash` står ikke på listen og kan ikke læses af
     nogen — en hash, der kan læses, er et skridt nærmere et token, der
     kan gættes.

     Samme to-slags-nej som `hentPartner`: { ok: false } når vi ikke fik
     spurgt, { ok: true, gaest: null } når vi spurgte og der ingen var. */
  async function hentGaest(turId) {
    const k = faaKlient();
    if (!k || !turId) return { ok: false };
    try {
      const { data, error } = await k.from('tur_gaest')
        .select('navn, svar, svar_kl, udloeber, annulleret_kl')
        .eq('tur_id', turId)
        .is('annulleret_kl', null)
        .limit(1);
      if (error) return { ok: false };
      if (!data || !data.length) return { ok: true, gaest: null };
      const g = data[0];
      return { ok: true, gaest: { navn: g.navn || '', svar: g.svar || null, udloeber: g.udloeber } };
    } catch (e) {
      return { ok: false };
    }
  }

  /* SLET KONTOEN. Den eneste uigenkaldelige handling i appen.

     Kodeordet sendes med, fordi funktionen kræver det: et gyldigt login
     beviser, at telefonen er låst op — ikke at det er ejeren, der sidder
     med den. Se noten i `supabase/functions/slet-konto/index.ts`.

     ⚠️ DER RYDDES IKKE OP LOKALT HERFRA. Sessionen og `localStorage` hører
     til app.js, og oprydningen dér blev skrevet 15/9, efter at logud lod
     den ene kundes ture ligge og blive stemplet med den næstes ejer-id.
     Den kode skal kaldes ét sted fra, ikke kopieres herind. */
  async function sletKonto(kodeord) {
    if (!kodeord) return { ok: false, fejl: 'Skriv dit kodeord for at bekræfte.' };

    const k = faaKlient();
    if (!k) return { ok: false, fejl: 'Ingen forbindelse til Arytmi lige nu.' };

    let adgangstoken = null;
    try {
      const { data } = await k.auth.getSession();
      adgangstoken = (data && data.session && data.session.access_token) || null;
    } catch (e) { adgangstoken = null; }
    if (!adgangstoken) return { ok: false, fejl: 'Log ind først.' };

    try {
      const r = await fetch(PROJEKT.url + '/functions/v1/slet-konto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: PROJEKT.anon,
          Authorization: 'Bearer ' + adgangstoken
        },
        body: JSON.stringify({ kodeord: kodeord })
      });
      const svar = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, fejl: svar.error || 'Kontoen kunne ikke slettes.' };
      return { ok: true, fjernet: svar.fjernet || null };
    } catch (e) {
      return { ok: false, fejl: 'Ingen forbindelse. Tjek nettet, og prøv igen.' };
    }
  }

  /* ---------- push-abonnementet (K22, 0049) ----------

     Rækken ER svaret på "har hun sagt ja til beskeder på telefonen": findes
     den, sender `paamind-afholdt` påmindelsen som push; ellers som mail.

     bruger_id sendes IKKE med - databasen sætter den selv til den, der er
     logget ind, og kolonnen er ikke hendes at skrive (0049). Findes adressen
     allerede, gør det ingenting: samme telefon, samme abonnement. */
  async function gemPushAbonnement(abonnement) {
    const k = faaKlient();
    if (!k) return { ok: false, fejl: 'Ingen forbindelse.' };
    const j = abonnement && typeof abonnement.toJSON === 'function' ? abonnement.toJSON() : (abonnement || {});
    const noegler = j.keys || {};
    if (!j.endpoint || !noegler.p256dh || !noegler.auth) return { ok: false, fejl: 'Telefonen gav ikke et abonnement.' };
    try {
      const { error } = await k.from('push_abonnement')
        .upsert({ endpoint: j.endpoint, p256dh: noegler.p256dh, auth: noegler.auth },
                { onConflict: 'endpoint', ignoreDuplicates: true });
      if (error) return { ok: false, fejl: laesbarFejl(error) };
      return { ok: true };
    } catch (e) {
      return { ok: false, fejl: laesbarFejl(e) };
    }
  }

  /* Ved udlogning: telefonen er ikke længere hendes. Kun hendes egen række
     kan slettes (RLS), og uden net sker der ingenting - så falder push-
     tjenestens 404/410 tilbage til mail, når abonnementet er opsagt. */
  async function fjernPushAbonnement(endpoint) {
    const k = faaKlient();
    if (!k || !endpoint) return { ok: true };
    try { await k.from('push_abonnement').delete().eq('endpoint', endpoint); } catch (e) { /* se ovenfor */ }
    return { ok: true };
  }

  return {
    PROJEKT, MIN_KODEORD,
    faaKlient, tilgaengelig,
    normaliserEmail, kodeordsFejl,
    normaliserTelefon, visTelefon,
    tokenFraAdressen, aktiver,
    bedOmKode, rensKode, saetKodeordMedKode,
    logInd, logUd,
    nuvaerendeBruger, bruger_id, harSession, vedUdlogning,
    hentProfil, gemProfil,
    inviterPartner, hentPartner, fjernPartner, hentSendtInvitation, hentIndloestInvitation,
    hentPartnerNavn,
    gemPushAbonnement, fjernPushAbonnement,
    inviterGaest, hentGaest,
    sletKonto,
    laesbarFejl
  };
});
