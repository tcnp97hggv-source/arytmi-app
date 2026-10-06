/* =============================================================
   geo.js — fra registrets koordinater til kortets
   =============================================================

   HVORFOR DEN FINDES
   ------------------
   DAWA lukker **1. oktober 2026 kl. 10**, og afløseren svarer i et andet
   koordinatsystem. Det er hele grunden til, at denne fil findes.

   DAWA gav breddegrad og længdegrad direkte — `x` var længdegrad, `y` var
   breddegrad, og de kunne lægges lige ind på kortet. Adressevælgeren, som
   overtager, svarer i stedet med:

       "geometri": { "crs": { "name": "EPSG:25832" },
                     "coordinates": [703373.59, 6163054.98] }

   Det er **UTM zone 32N** — meter nord og øst for et nulpunkt, ikke grader.
   Tallene ligner ingenting, man kan sætte på et kort, og de kan ikke
   skaleres om. De skal projiceres tilbage.

   ⚠️ DET ER IKKE NOGET, MAN KAN GÆTTE SIG TIL. 703373 er ikke 70,3 grader
   og heller ikke 7,03. Bruger man tallene, som de er, lander stedet i
   Atlanterhavet — og gør man det i den rigtige rækkefølge, lander det i
   Guineabugten, hvor nul møder nul. Der er ingen advarsel undervejs.

   HVAD DEN GØR
   ------------
   `utmTilGrader(x, y)` er den omvendte transverse Mercator (Snyders
   serie), regnet på WGS84-ellipsoiden med UTM zone 32's tal:

       centralmeridian  9° øst        målestok k0  0,9996
       falsk øst   500.000 m          falsk nord   0 (nordlig halvkugle)

   Det er ren matematik. Intet netværk, ingen nøgler, ingen tabeller.

   HVOR NØJAGTIG
   -------------
   Prøvet mod DAWA's EGNE svar for **400 adresser** fordelt over hele
   landet — Skagen, Rønne, Tønder, Esbjerg — den 17/9 2026, mens DAWA
   stadig svarede i begge systemer. **Største afvigelse: 5,6 cm**, og den
   er DAWA's egen afrunding til otte decimaler.

   Rønne er den, der presser den: 14,7° øst er næsten seks grader fra
   centralmeridianen, og serien bliver upræcis, jo længere man kommer ud.
   Den holder. Danmark ligger helt inden for det, zone 32 kan bære.

   ⚠️ DEN GÆLDER KUN ZONE 32 OG KUN NORD FOR ÆKVATOR. Det er nok til
   Danmark, og appen skal ikke andre steder hen. Kommer den det en dag,
   skal zonen ind som et argument — ikke som et gæt.

   Prøverne ligger i `test/geo.test.js` med faste punkter, så filen kan
   kontrolleres, længe efter at DAWA er lukket og ikke kan spørges mere.

   ⚠️ DENNE FIL HAR EN TVILLING. `supabase/functions/_shared/utm.ts` er den
   samme matematik i TypeScript, fordi bagrummet slår adresser op gennem en
   Edge-funktion og appen gør det direkte. Retter du den ene, så ret den
   anden — og kør begge prøver. */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ArytmiGeo = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  /* WGS84-ellipsoiden og UTM zone 32N. Tallene er standard og skal ikke
     røres — de er ikke justeringsskruer, de ER koordinatsystemet. */
  const a = 6378137;                    // storakse, meter
  const f = 1 / 298.257223563;          // fladtrykning
  const k0 = 0.9996;                    // målestoksfaktor på centralmeridianen
  const FALSK_ØST = 500000;             // så østkoordinater aldrig bliver negative
  const LON0 = 9 * Math.PI / 180;       // zone 32's centralmeridian

  const e2 = f * (2 - f);               // første excentricitet i anden
  const ep2 = e2 / (1 - e2);            // anden excentricitet i anden

  /* x er ØST i meter, y er NORD i meter. Adressevælgeren kalder dem
     `koordinater.x` og `koordinater.y`, og rækkefølgen i `geometri.
     coordinates` er den samme: [øst, nord].

     Returnerer { lat, lon } i grader — i DEN rækkefølge, fordi det er den,
     resten af appen bruger. Kan tallene ikke bruges, returneres null i
     stedet for noget, der ligner et sted. */
  /* Rimelighedsgrænserne. Danmark med rigelig margen: Rønne ligger ved
     865.000 øst, Esbjerg ved 466.000, Gedser ved 6.040.000 nord og Skagen
     ved 6.402.000.

     ⚠️ DE HER FIRE TAL ER IKKE PYNT, og de er heller ikke smagsdommeri.
     Uden dem regner funktionen glad videre på nul og på ombyttede tal:

         utmTilGrader('', '')          ->  0° N, 4,5° Ø  — Guineabugten
         utmTilGrader(6163054, 703373) ->  et sted i Rusland

     Begge dele ligner et sted. Ingen af dem SER forkerte ud i to talfelter
     med seks decimaler, og et sted, man skal køre hen til, er lige præcis
     dér, hvor ingen opdager det i tide. Falder tallene uden for, er noget
     gået galt længere oppe, og så skal der komme null. */
  const ØST_MIN = 100000, ØST_MAKS = 1000000;
  const NORD_MIN = 5800000, NORD_MAKS = 6600000;

  function utmTilGrader(x, y) {
    /* Tom tekst bliver til 0 gennem Number(), og 0 er et gyldigt tal.
       Derfor sorteres tomt fra, FØR der regnes. */
    if (x === null || x === undefined || String(x).trim() === '') return null;
    if (y === null || y === undefined || String(y).trim() === '') return null;
    x = Number(x); y = Number(y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (x < ØST_MIN || x > ØST_MAKS) return null;
    if (y < NORD_MIN || y > NORD_MAKS) return null;

    /* Fodpunktsbredden: den bredde, hvis meridianbue er lige så lang som
       den nordlige koordinat. Herfra rettes der ud mod øst. */
    const M = y / k0;
    const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));
    const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

    const bred = mu
      + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu)
      + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu)
      + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu)
      + (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu);

    const s = Math.sin(bred);
    const C = ep2 * Math.pow(Math.cos(bred), 2);
    const T = Math.pow(Math.tan(bred), 2);
    const N = a / Math.sqrt(1 - e2 * s * s);              // tværkrumningsradius
    const R = a * (1 - e2) / Math.pow(1 - e2 * s * s, 1.5); // meridiankrumningsradius
    const D = (x - FALSK_ØST) / (N * k0);

    const lat = bred - (N * Math.tan(bred) / R) * (
        D * D / 2
      - (5 + 3 * T + 10 * C - 4 * C * C - 9 * ep2) * Math.pow(D, 4) / 24
      + (61 + 90 * T + 298 * C + 45 * T * T - 252 * ep2 - 3 * C * C) * Math.pow(D, 6) / 720);

    const lon = LON0 + (
        D
      - (1 + 2 * T + C) * Math.pow(D, 3) / 6
      + (5 - 2 * C + 28 * T - 3 * C * C + 8 * ep2 + 24 * T * T) * Math.pow(D, 5) / 120
      ) / Math.cos(bred);

    const grader = { lat: lat * 180 / Math.PI, lon: lon * 180 / Math.PI };
    if (!Number.isFinite(grader.lat) || !Number.isFinite(grader.lon)) return null;
    return grader;
  }

  /* Adressevælgerens svar pakket ud ét sted. Punktet ligger samme sted i
     et husnummer-svar og i et adresse-svar (adressen peger på sit eget
     husnummer), og begge former kommer forbi her.

     ⚠️ `adgangspunktet` er indkørslen, ikke bygningens midte. Det er
     præcis det, man vil have, når nogen skal KØRE derhen. */
  function punktFraSvar(svar) {
    const h = svar && (svar.husnummer || (svar.adresse && svar.adresse.husnummer));
    const k = h && h.adgangspunkt && h.adgangspunkt.koordinater;
    if (!k) return null;
    return utmTilGrader(k.x, k.y);
  }

  return { utmTilGrader: utmTilGrader, punktFraSvar: punktFraSvar };
});
