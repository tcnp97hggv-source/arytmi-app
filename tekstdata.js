/* =============================================================
   LISTERNE SOM TEKSTNØGLER (KN 5/10 2026)
   =============================================================

   "Vi kan ikke rette i tekster eller lister i de forskellige faser." Og:
   "Lav også lige en funktion så vi kan tilføje ting til de faste lister."

   Listerne i app.js — madscenarierne, bilen, pakkelisten, hunden, snacks,
   morgenmad, sektionerne — er data, ikke t()-kald. De blev skrevet sådan,
   fordi de har id'er, ikoner og flag ved siden af teksten. At skrive 300
   tekster om i hånden ville gøre listerne ulæselige, og den næste, der
   tilføjer et punkt, ville glemme det.

   I STEDET: hver tekst i listen FÅR en nøgle, udledt af listens navn og
   punktets id — `mad.scenarie.takeaway.brug.takeaway_pizzaskaerer.tekst`.
   Reglen står HER og kun her. Appen bruger den til at lægge t() ind bag
   hver tekst (så editoren kan finde og rette den), og hent-noegler.mjs
   bruger den til at skrive nøglerne i admin/noegler.json. To steder, der
   skal sige det samme, læser fra det samme sted.

   NYE PUNKTER er også tekstnøgler: `pakke.punkter.ny_solcreme.tekst`.
   Står den i tabellen med en tekst, får listen et punkt mere. Ingen ny
   tabel, ingen migration — de udgives med alt andet.

   SKJULTE PUNKTER: `<punkt>.skjult` = 'ja' tager et fast punkt ud af
   listen. Nulstilles nøglen, er det tilbage.

   Filen rører ikke DOM'en og kender ikke appen. Ren data ind, nøgler ud.
   ============================================================= */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArytmiTekstdata = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  /* Listernes navn i app.js og præfikset for deres nøgler. Første led er
     skærmen i bagrummet (se SKAERME i hent-noegler.mjs). */
  const LISTER = [
    ['BIL_TYPER',             'bilen.typer'],
    ['BILEN_GRUPPER',         'bilen.grupper'],
    ['HUND_PUNKTER',          'pakke.hund'],
    ['PAKKE_PUNKTER',         'pakke.punkter'],
    ['MAD_VALG',              'mad.valg'],
    ['MAD_SCENARIE_DETALJER', 'mad.scenarie'],
    ['SNACK_VALG',            'mad.snacks'],
    ['MORGEN_VALG',           'mad.morgen'],
    ['SEKTIONER',             'sektion.liste'],
    ['FASER',                 'sektion.faser'],
    ['TUR_FASER',             'sektion.turfaser'],
    ['VEN_EJERE',             'gaest.ejere'],
    ['RADIUS_TEKST',          'hvorlangt.radius']
  ];

  /* Kun de felter, der er TEKST. `id`, `ikon`, `farve`, `nr` og `åben` er
     kode — retter man dem, holder appen op med at virke. */
  const TEKSTFELTER = new Set(['navn', 'under', 'tip', 'brød', 'tekst', 'tagline', 'intro', 'sådanGørVi',
    'lilleEkstra', 'efter', 'brugIntro', 'brugTitel', 'spørg', 'forklar', 'etiket', 'kort', 'åbenTekst']);

  /* Lister, hvis punkter IKKE kan tilføjes: et madscenarie er mere end en
     linje (det har en hel side bag sig), og sektioner, faser og ejere er
     appens skelet. */
  const LUKKEDE = new Set(['mad.valg', 'bilen.typer', 'bilen.grupper', 'sektion.liste', 'sektion.turfaser', 'gaest.ejere']);

  /* Et led i en nøgle: små bogstaver, tal og understreg — hent-noegler.mjs'
     mønster kræver det. æ/ø/å skrives ud, alt andet bliver til _. */
  function led(s) {
    return String(s).toLowerCase()
      .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'x';
  }

  /* Går listen igennem og kalder
       vedTekst(nøgle, faldbak, holder, felt)  for hver tekst
       vedListe(sti, liste, tekstfelt)          for hver liste af punkter
     `holder[felt]` er teksten — så kalderen kan lægge noget ind bag den. */
  function gennemgå(data, præfiks, vedTekst, vedListe) {
    const tekst = vedTekst || function () {};
    const liste = vedListe || function () {};
    const strenge = a => Array.isArray(a) && a.length && a.every(e => typeof e === 'string');
    function gå(x, sti) {
      if (Array.isArray(x)) {
        const punkter = x.length && x.every(e => e && typeof e === 'object' && typeof e.id === 'string');
        if (punkter) {
          const felt = x.every(e => typeof e.tekst === 'string') ? 'tekst' : x.every(e => typeof e.navn === 'string') ? 'navn' : null;
          if (felt && !LUKKEDE.has(sti)) liste(sti, x, felt);
        }
        x.forEach((e, i) => { if (e && typeof e === 'object') gå(e, sti + '.' + (e.id ? led(e.id) : String(i + 1))); });
        return;
      }
      if (!x || typeof x !== 'object') return;
      for (const k of Object.keys(x)) {
        const v = x[k];
        if (typeof v === 'string') { if (TEKSTFELTER.has(k)) tekst(sti + '.' + led(k), v, x, k); }
        else if (strenge(v)) { if (TEKSTFELTER.has(k)) v.forEach((e, i) => tekst(sti + '.' + led(k) + '.' + (i + 1), e, v, i)); }
        else if (v && typeof v === 'object') gå(v, sti + '.' + led(k));
      }
    }
    if (strenge(data)) data.forEach((e, i) => tekst(præfiks + '.' + (i + 1), e, data, i));
    else gå(data, præfiks);
  }

  /* Et nyt punkts nøgle. `ny_` foran, så det aldrig kan ramme et fast id. */
  function nytPunktNøgle(sti, felt, tekst) {
    return sti + '.ny_' + led(tekst).slice(0, 30) + '.' + felt;
  }

  return { LISTER, TEKSTFELTER, LUKKEDE, led, gennemgå, nytPunktNøgle };
});
