/* =============================================================
   fejl.js — nettet under appen
   =============================================================

   HVORFOR DEN FINDES
   ------------------
   Sentry blev sat op 11/9, og den dækker de syv Edge-funktioner. Der var
   ikke én linje fejlovervågning i appen selv. Når Oliiviias telefon kastede
   en undtagelse, skete der ingenting nogen steder.

   Og arkitekturen gør det værre end i en almindelig app. Hver skærm tegnes
   fra bunden med `innerHTML` gennem én `tegn()`:

       $('indhold').innerHTML = `...`;

   Kaster noget en undtagelse MIDT i den streng, bliver `innerHTML` aldrig
   sat. Skærmen bliver stående tom, der kommer ingen fejlbesked, og appen
   ser ud til at være gået i stå. Det eneste, brugeren kan fortælle os, er
   "den virker ikke".

   Filen her gør to ting, og den første er den vigtigste:

     1. FANGER FEJLEN, så appen kan vise noget i stedet for ingenting.
        Det virker uden Sentry, uden netværk og uden nøgler.
     2. MELDER DEN, hvis en DSN er sat.

   Rækkefølgen er med vilje. En fejl, brugeren kan komme videre fra, er mere
   værd end en fejl, vi kan læse om bagefter.


   DSN'EN ER TOM, OG DET ER IKKE EN FORGLEMMELSE
   ---------------------------------------------
   `SENTRY_DSN` i Supabases secrets hører til SERVEREN. En browser-DSN er en
   anden nøgle i samme projekt, og den er offentlig af natur — den står i
   kildekoden på enhver hjemmeside, der bruger Sentry, og den kan kun sende
   fejl ind, ikke læse noget ud.

   Men den er stadig Kennets at hente. Indtil den står her, melder filen
   ingenting og skriver kun i konsollen. **Alt andet i filen virker uden
   den.**

       Hentes i Sentry under Projekt → Settings → Client Keys (DSN).
       Det er den, der ser ud som https://<noget>@<noget>.ingest.../<tal>


   HVAD DER IKKE MELDES, OG HVORFOR
   --------------------------------
   Samme regel som `meld.ts` fik 11/9, og den er værd at gentage:

       "En alarm, der bipper ved hverdagen, er en, man slår fra inden for
        en uge. Og så er man dårligere stillet end uden."

   Derfor sorteres tre ting fra, før noget sendes:

     · NETVÆRKSFEJL. Appen er bygget til at være offline — udbakken i
       `sync.js` er hele svaret på det. En mislykket `fetch` er ikke en
       fejl, det er en tirsdag i en kælder.
     · STØJ FRA BROWSEREN SELV. "ResizeObserver loop limit exceeded",
       udvidelser, oversættelsesværktøjer. Intet af det er vores kode.
     · DEN SAMME FEJL IGEN. Går noget i stykker i `tegn()`, sker det ved
       HVER navigation. Uden en spærre ville ét besøg sende hundrede
       beskeder.

   ⚠️ OG DER SENDES ALDRIG PERSONDATA. Ikke mailadresser, ikke navne, ikke
   telefonnumre, ikke destinationer. Kun hvilken skærm, hvilken fil og
   hvilken linje. Samme regel som serverens, og af samme grund: en
   fejlbesked er ikke et sted at opbevare kundedata. */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ArytmiFejl = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  /* `root` ovenfor er wrapperens parameter og findes IKKE herinde — fabrikken
     tager ingen argumenter. Derfor hentes vinduet igen her.
     Fundet 17/9 ved at prøve: første udgave skrev `root.addEventListener`
     inde i start(), og det kastede
     "root is not defined". Fordi filen indlæses FØR app.js, nåede app.js
     aldrig at blive evalueret færdig. Hele appen var hvid.
     Ironien er noteret: nettet, der skal fange den hvide skærm, lavede en.
     Lektien er den samme som altid — en fil, der ikke er kørt, er ikke
     skrevet endnu. */
  const vindue = (typeof window !== 'undefined') ? window : globalThis;

  /* ---------- Kennets felt ----------
     ⚠️ DET ER DEN HER LINJE. Sæt DSN'en mellem anførselstegnene, og
     meldingerne begynder at komme frem. Intet andet skal røres.
     Hentes i Sentry under Projekt → Settings → Client Keys (DSN). */
  const DSN = '';                   // se noten i toppen
  const MILJOE = 'app';

  /* ---------- lofter ---------- */
  const MAKS_PR_SESSION = 20;       // et sammenbrud skal ikke koste en kvote
  const GLEM_EFTER_MS = 60000;      // samme fejl igen inden for et minut: tie

  let sendt = 0;
  const sete = new Map();           // aftryk -> hvornår sidst
  let opsætning = { skærm: () => '', udgave: '', dsn: '' };

  /* DSN'en fra linjen ovenfor er den, der gælder. `start({dsn})` kan sætte
     en anden, og det er der to grunde til — ingen af dem er "fleksibilitet
     for fleksibilitetens skyld":

       1. PRØVERNE. Indtil 17/9 var afsendelsen det eneste i filen, der
          aldrig var kørt. Den kunne ikke prøves, fordi der ikke var nogen
          DSN at sætte, og en prøve kan ikke opfinde en konstant. Nu kan
          `test/fejl.test.js` sætte en falsk DSN, tage imod kuverten og
          kontrollere, at den er rigtigt skruet sammen — og at der ikke
          rider persondata med.
       2. DEN DAG, DSN'EN SKAL VÆRE FORSKELLIG i appen og på en prøveflade.
          Så er der et sted at gøre det.

     Rækkefølgen er med vilje: linjen i filen vinder. Kennet skal kunne
     sætte én streng ét sted og være færdig. */
  function denAktiveDSN() { return DSN || opsætning.dsn || ''; }

  /* Hverdag. Listen er kort med vilje: står noget her, hører vi det ALDRIG
     igen, og det er en dyrere beslutning end den ser ud. */
  const HVERDAG = [
    /Failed to fetch/i,
    /NetworkError/i,
    /Load failed/i,
    /ERR_INTERNET_DISCONNECTED/i,
    /ResizeObserver loop/i,
    /Non-Error promise rejection captured/i,
    /script error/i               // en fejl fra et andet domæne; vi får intet at vide
  ];

  function erHverdag(besked) {
    return HVERDAG.some(m => m.test(besked || ''));
  }

  /* Et aftryk, der er stabilt nok til at genkende den samme fejl, og løst
     nok til ikke at ændre sig, fordi et tal er anderledes. */
  function aftryk(besked, fil, linje) {
    return String(besked || '').slice(0, 120) + '|' + (fil || '') + '|' + (linje || '');
  }

  /* Sentrys envelope-format, skrevet i hånden af samme grund som i
     `meld.ts`: det er ét HTTP-kald, og SDK'en vejer mere end den løser. */
  function endepunkt(dsn) {
    try {
      const u = new URL(dsn);
      const projekt = u.pathname.replace(/^\/+/, '');
      if (!u.username || !projekt) return null;
      return u.protocol + '//' + u.host + '/api/' + projekt + '/envelope/'
           + '?sentry_key=' + u.username + '&sentry_version=7';
    } catch (e) { return null; }
  }

  function id() {
    const b = new Uint8Array(16);
    (vindue.crypto || {}).getRandomValues ? vindue.crypto.getRandomValues(b)
      : b.forEach((_, i) => { b[i] = Math.floor(Math.random() * 256); });
    return [].map.call(b, x => ('0' + x.toString(16)).slice(-2)).join('');
  }

  /* ---------- selve meldingen ---------- */
  function meld(fejl, sammenhæng) {
    const besked = (fejl && (fejl.message || fejl.toString())) || String(fejl || 'ukendt fejl');
    const fil = (sammenhæng && sammenhæng.fil) || '';
    const linje = (sammenhæng && sammenhæng.linje) || '';

    /* Konsollen FØRST og altid. Den er det eneste, der virker for en
       udvikler, der sidder med telefonen i hånden — og den virker, uanset
       om Sentry er sat op. */
    try { console.error('[arytmi]', besked, sammenhæng || {}); } catch (e) {}

    if (erHverdag(besked)) return false;
    if (sendt >= MAKS_PR_SESSION) return false;

    const nøgle = aftryk(besked, fil, linje);
    const nu = Date.now();
    const sidst = sete.get(nøgle);
    if (sidst && nu - sidst < GLEM_EFTER_MS) return false;
    sete.set(nøgle, nu);

    const url = endepunkt(denAktiveDSN());
    if (!url) return false;          // ingen DSN: vi har gjort vores i konsollen

    let skærm = '';
    try { skærm = opsætning.skærm() || ''; } catch (e) {}

    const hoved = JSON.stringify({ event_id: id(), sent_at: new Date().toISOString() });
    const type = JSON.stringify({ type: 'event' });
    const krop = JSON.stringify({
      event_id: id(),
      timestamp: nu / 1000,
      platform: 'javascript',
      level: 'error',
      environment: MILJOE,
      release: opsætning.udgave || undefined,
      /* `tags` er det, man filtrerer på i Sentry. Skærmen er det ENESTE,
         der for alvor gør en fejlmelding brugbar her: "den virker ikke"
         bliver til "skærmDestination kaster, når stedet mangler lat". */
      tags: { skaerm: skærm || 'ukendt' },
      extra: {
        fil: fil || undefined,
        linje: linje || undefined,
        /* Sporet er vores egen kode. Det kan indeholde funktionsnavne og
           filnavne — aldrig værdier. */
        spor: (fejl && fejl.stack) ? String(fejl.stack).slice(0, 4000) : undefined,
        hvor: (sammenhæng && sammenhæng.hvor) || undefined
      },
      exception: {
        values: [{
          type: (fejl && fejl.name) || 'Error',
          value: besked.slice(0, 500)
        }]
      }
    });

    try {
      /* `keepalive` gør, at meldingen når frem, selvom siden lukkes i
         samme øjeblik — og det er tit præcis dét, der sker, når noget går
         galt. Svaret interesserer os ikke: en fejl i fejlmeldingen må
         aldrig blive til en ny fejl. */
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-sentry-envelope' },
        body: hoved + '\n' + type + '\n' + krop,
        keepalive: true,
        mode: 'cors'
      }).catch(function () {});
      sendt++;
      return true;
    } catch (e) { return false; }
  }

  /* ---------- installationen ---------- */
  let installeret = false;

  function start(valg) {
    if (valg) opsætning = Object.assign({}, opsætning, valg);
    if (installeret) return;

    /* ⚠️ IKKE ALLE STEDER HAR ET VINDUE AT LYTTE PÅ. Under Node — altså i
       prøverne — er `vindue` bare `globalThis`, og den har ingen
       `addEventListener`. Uden den her linje kastede `start()` dér, og en
       fil, hvis eneste opgave er at fange fejl, må ikke selv være den, der
       kaster. Det er nøjagtig den samme lektie som `root` 17/9.

       `meld()` virker uanset. Det er kun den AUTOMATISKE opfangning, der
       kræver et vindue. */
    if (typeof vindue.addEventListener !== 'function') return;
    installeret = true;

    vindue.addEventListener('error', function (e) {
      /* Et <img> eller et <script>, der ikke kunne hentes, kommer også her
         — men uden `error`-objekt. Det er hverdag på en dårlig linje. */
      if (!e || !e.error) return;
      meld(e.error, { fil: e.filename, linje: e.lineno, hvor: 'window.error' });
    });

    vindue.addEventListener('unhandledrejection', function (e) {
      const grund = e && (e.reason !== undefined ? e.reason : e);
      meld(grund, { hvor: 'unhandledrejection' });
    });
  }

  /* Til prøver og til den, der vil vide, om der er en DSN. */
  function tilstand() {
    return { harDSN: !!endepunkt(denAktiveDSN()), sendt: sendt, installeret: installeret };
  }

  /* Kun til prøverne: glem hvad vi har set, så to prøver ikke smitter.
     DSN'en fra `start()` ryddes MED. Ellers ville én prøve, der satte en
     falsk DSN, smitte af på hver eneste prøve efter den — og rækkefølgen i
     filen ville pludselig betyde noget, uden at nogen havde sagt det.
     Linjen i koden røres ikke; den er Kennets. */
  function nulstil() { sendt = 0; sete.clear(); opsætning.dsn = ''; }

  return { start: start, meld: meld, tilstand: tilstand, nulstil: nulstil };
});
