/* =============================================================
   ARYTMI v4 — Fra idé til afsted
   Forbered tur → 6 sektioner → af sted → anmeld.
   Prototype: mail/notifikationer/vejr simuleres, solnedgang er ægte.
   ============================================================= */

/* v5 er nu nøglen. v4 læses stadig, hvis v5 ikke findes, og den GAMLE nøgle
   slettes aldrig: går noget galt i migrationen, står den forrige tilstand der
   stadig. Et par kilobyte mod en tabt tur er ikke et svært valg. */
const GEM    = 'arytmi-v5';
const GEM_V4 = 'arytmi-v4';

/* Datalaget bor i model.js og skal være indlæst FØR app.js — se index.html.
   Fejlen kastes her, uden for indlæs()'s try/catch. Fangede vi den derinde,
   ville appen starte på en frisk tilstand og se ud, som om brugerens ture
   aldrig havde eksisteret. Hellere en tom skærm og en fejl i konsollen end
   en app, der lyver om, at der ikke var noget. */
if(typeof ArytmiModel === 'undefined'){
  throw new Error('model.js er ikke indlæst. index.html skal hente den før app.js.');
}
const M = ArytmiModel;

/* ---------- ikoner ---------- */
const IKONER = {
  hjem:   '<path d="M4.5 11.5 12 4.5l7.5 7v7.3a1.2 1.2 0 0 1-1.2 1.2H14v-5.5h-4V20H5.7a1.2 1.2 0 0 1-1.2-1.2Z"/>',
  /* Blyanten er kladdens maerke (4A). Samme streg som resten: 24x24,
     kun konturer, ingen fyld - saa den arver farven fra det, den staar i. */
  blyant: '<path d="M4.8 19.2 5.4 15l9-9a2 2 0 0 1 2.8 0l.8.8a2 2 0 0 1 0 2.8l-9 9Z"/><path d="M13.2 7.6 16.4 10.8" opacity=".55"/>',
  bog:    '<path d="M12 6.5C10 5 7.2 4.8 5 5.6V18c2.2-.8 5-.6 7 .9 2-1.5 4.8-1.7 7-.9V5.6c-2.2-.8-5-.6-7 .9Z"/><path d="M12 6.5V19" opacity=".55"/>',
  person: '<circle cx="12" cy="8.2" r="3.7"/><path d="M4.8 19.5c.8-3.9 3.8-6 7.2-6s6.4 2.1 7.2 6"/>',
  bil:    '<path d="M4 15.5v-2.2c0-.8.4-1.5 1.1-1.9l1.4-2.9A2 2 0 0 1 8.3 7.4h5.9c.7 0 1.4.4 1.8 1l2 2.9 1.5.6c.5.3.9.9.9 1.5v2.1a1 1 0 0 1-1 1h-1"/><circle cx="8" cy="16.4" r="1.8"/><circle cx="16.4" cy="16.4" r="1.8"/><path d="M9.8 16.4h4.8"/>',
  måne:   '<path d="M19 13.5A7.5 7.5 0 0 1 10.5 5 7.5 7.5 0 1 0 19 13.5Z"/>',
  sol:    '<circle cx="12" cy="12" r="4"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18"/>',
  blad:   '<path d="M6 18C6 10 10.5 5.5 19 5c.5 8.5-4 13-12 13"/><path d="M6 18c2.5-5 6-8.5 10-10.5" opacity=".55"/>',
  nål:    '<path d="M12 20.5s6.5-5.7 6.5-10.5a6.5 6.5 0 1 0-13 0c0 4.8 6.5 10.5 6.5 10.5Z"/><circle cx="12" cy="9.8" r="2.3"/>',
  kop:    '<path d="M5.5 9h11v6a4.5 4.5 0 0 1-4.5 4.5H10A4.5 4.5 0 0 1 5.5 15Z"/><path d="M16.5 10.5h1.3a2.2 2.2 0 0 1 0 4.4h-1.5"/><path d="M8.5 5.5c0 1-1 1.2-1 2.2M12 5.5c0 1-1 1.2-1 2.2" opacity=".6"/>',
  gnist:  '<path d="M12 4c.6 3.8 2.5 5.9 6.5 6.5-4 .6-5.9 2.7-6.5 6.5-.6-3.8-2.5-5.9-6.5-6.5C9.5 9.9 11.4 7.8 12 4Z"/>',
  hjerte: '<path d="M12 19.5S4.5 14.8 4.5 9.6A4 4 0 0 1 12 7.5a4 4 0 0 1 7.5 2.1c0 5.2-7.5 9.9-7.5 9.9Z"/>',
  /* Pulsen som ikon (14/8). Hjertet sad fem steder i brugerfladen — på
     "Anmeld turen", på "Denne arytme er for mig" og i tre kvitteringer — og
     dér blev det romantisk frem for brandbærende. Hjertet hører til i logoet.
     Pulsen er samme greb, men den er JERES: det er EKG_KURVE, tegnet om til
     24-boksen, så den passer sammen med resten af stregikonerne.
     'hjerte' står stadig i listen — den bruges af tælleren i hero'en. */
  puls:   '<path d="M2 12h5l1.5-3.5L10 15.5 11.5 5 13 16.5 14.5 10 16 12h6"/>',
  pil:    '<path d="M5 12h13m-5.5-5.5L18 12l-5.5 5.5"/>',
  info:   '<circle cx="12" cy="12" r="8.3"/><path d="M12 11.2v5.3" stroke-linecap="round"/><circle cx="12" cy="7.7" r="1" fill="currentColor" stroke="none"/>',
  tilbage:'<path d="M19 12H6m5.5 5.5L6 12l5.5-5.5"/>',
  plus:   '<path d="M12 5.5v13M5.5 12h13"/>',
  tjek:   '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  kryds:  '<path d="m7 7 10 10M17 7 7 17"/>',
  skrald: '<path d="M5.5 7h13M10 7V5.5a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 14 5.5V7"/><path d="M7 7v11.5A1.5 1.5 0 0 0 8.5 20h7a1.5 1.5 0 0 0 1.5-1.5V7"/><path d="M10.5 10.5v6M13.5 10.5v6" opacity=".5"/>',
  lås:    '<rect x="6" y="10.5" width="12" height="9" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  gave:   '<rect x="4.5" y="10" width="15" height="10" rx="1.5"/><path d="M12 10v10M4.5 13.5h15" opacity=".5"/><path d="M12 10V7.8M12 7.8c-1.2-3.6-6-3.3-5 .2h5Zm0 0c1.2-3.6 6-3.3 5 .2h-5Z"/>',
  klokke: '<path d="M12 4.5a5.5 5.5 0 0 1 5.5 5.5c0 4 1.5 5.2 2 5.8H4.5c.5-.6 2-1.8 2-5.8A5.5 5.5 0 0 1 12 4.5Z"/><path d="M10 18.8a2 2 0 0 0 4 0"/>',
  mail:   '<rect x="4" y="6" width="16" height="12.5" rx="2.5"/><path d="m5 8 7 5.5L19 8"/>',
  kort:   '<path d="m9 5-4.5 2v12L9 17l6 2 4.5-2V5L15 7Z"/><path d="M9 5v12M15 7v12" opacity=".5"/>',
  vind:   '<path d="M4 9.5h9.5a2.5 2.5 0 1 0-2.4-3.2M4 14h13a2.6 2.6 0 1 1-2.5 3.3" opacity=".9"/>',
  sne:    '<path d="M12 4v16M5.1 8l13.8 8M18.9 8 5.1 16" stroke-width="1.4"/>',
  telt:   '<path d="M12 5 3.5 19h17Z"/><path d="M12 11.5 8.5 19h7Z" opacity=".55"/>',
  stjerne:'<path d="m12 4 2.1 4.9 5.3.5-4 3.6 1.2 5.2L12 15.4 7.4 18.2l1.2-5.2-4-3.6 5.3-.5Z"/>',
  /* Et toilet set fra siden: cisterne, skål og fod (KN 5/10 — det gamle lignede
     et vinglas). */
  /* Et hundehoved med hængeører (KN 5/10: "Kan vi få et hunde ikon her?"). */
  hund:   '<path d="M8.2 8.6C8.6 6.4 10.1 5 12 5s3.4 1.4 3.8 3.6l.2 5.6a4 4 0 0 1-8 0Z"/><path d="M8.3 7.6 5.6 6.5c-.8-.3-1.6.3-1.5 1.2l.5 4.2c.1.9 1.1 1.3 1.8.8L8 11.6M15.7 7.6l2.7-1.1c.8-.3 1.6.3 1.5 1.2l-.5 4.2c-.1.9-1.1 1.3-1.8.8L16 11.6"/><circle cx="10.3" cy="10.4" r=".7" fill="currentColor" stroke="none"/><circle cx="13.7" cy="10.4" r=".7" fill="currentColor" stroke="none"/><path d="M11 14.4h2l-1 1.1Z" fill="currentColor"/>',
  toilet: '<rect x="5" y="3.5" width="4.5" height="7" rx="1"/><path d="M5 10.5h14a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6Z"/><path d="M9.5 16.3 8.8 20h6.4l-.7-3.7"/>',
  kurv:   '<path d="m5 9 2-4.5h10L19 9M5 9h14l-1.3 9.4a1.5 1.5 0 0 1-1.5 1.3H7.8a1.5 1.5 0 0 1-1.5-1.3Z"/><path d="M10 12.5v3.5M14 12.5v3.5" opacity=".6"/>',
  gaffel: '<path d="M7.5 4.5v5.2a2 2 0 0 0 2 2v7.8M9.5 4.5v5M11.5 4.5v5.2M16.5 4.5c-1.7.8-2.5 2.4-2.5 4.5v3h2.5v7.5"/>',
  croissant:'<path d="M5 14c1.5-4.5 5-8 9.5-8 2.6 0 4.5 1.6 4.5 4 0 4.5-4 8.5-9 9.5-2.8.5-5-.8-5-3 0-1 .4-1.9 1.3-2.7"/><path d="M9.5 17.5 7 20M15.5 14.5 18 17" opacity=".6"/>',
  gps:    '<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21"/>',
  lyn:    '<path d="M13 3.5 5.5 13.5H11L10 20.5 18.5 10H13Z"/>',
  vand:   '<path d="M3 8.5c2-2 3.5-2 5.5 0s3.5 2 5.5 0 3.5-2 5.5 0M3 13.5c2-2 3.5-2 5.5 0s3.5 2 5.5 0 3.5-2 5.5 0M3 18.5c2-2 3.5-2 5.5 0s3.5 2 5.5 0 3.5-2 5.5 0"/>',
  skov:   '<path d="M8 4 3.5 12h9ZM8 8.5 4.5 14h7ZM8 14v6"/><path d="M16.5 5.5 13 12h7ZM16.5 14v6" opacity=".85"/>',
  folk:   '<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3.3 2.9-5 5.5-5s4.9 1.7 5.5 5"/><circle cx="17" cy="8.5" r="2.4" opacity=".7"/><path d="M15 13.6c2 .2 3.6 1.7 4.1 4.4" opacity=".7"/>',
  solop:  '<circle cx="12" cy="15" r="3.4"/><path d="M12 6v3M6.5 15H4M20 15h-2.5M7.4 10.4 6 9M18 9l-1.4 1.4M3 19.5h18M8.5 5.5 12 2l3.5 3.5" opacity=".9"/>',
  ur:     '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>',
  ned:    '<path d="M6 9.5 12 15l6-5.5"/>',
  kalender:'<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  /* Telefon og deling (KN 6/9). Invitationer sendes som SMS, og destinationen
     deles med bilen — to greb der ikke fandtes, da ikonlisten blev lavet. */
  telefon:'<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M10.5 18h3" stroke-linecap="round"/>',
  del:    '<circle cx="18" cy="6" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="m8.3 10.8 7.4-3.6M8.3 13.2l7.4 3.6" opacity=".75"/>',
  /* Installationsguiden (K22, 6/10). De to knapper, hun skal finde i SIN
     browser — derfor ligner de telefonens egne: Safaris del-knap (boks med
     pil op) og Chromes tre prikker. Ikke 'del' ovenfor, som er vores egen. */
  iosdel: '<path d="M8.5 9.5H7a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 17 9.5h-1.5"/><path d="M12 14.5V3.5M8.7 6.8 12 3.5l3.3 3.3"/>',
  prikker:'<circle cx="12" cy="5.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="18.5" r="1.3" fill="currentColor" stroke="none"/>',
  /* Værktøjskassen (KN 6/9). 'sol' fandtes, men vejr på en tur er sjældent
     bare sol — derfor sol OG sky. De tre andre er nye former, tegnet i samme
     24-boks og med samme stregtykkelse som resten. */
  /* ---- de fire værktøjsikoner, tegnet om 11/9 ----
     Kennet om de gamle: "grimme og ikke særlig levende". De var generiske —
     vateret var to cirkler i hinanden og lignede en kamerablænder mere end
     et vaterpas, og tommestokken var et skråt rektangel. Nu er hver af dem
     det redskab, den hedder: en foldetommestok med sine led, et vaterpas med
     libelle og boble, en lygte der lyser OP.

     Delene har klassenavne, så de kan bevæge sig ganske lidt — se .vk-ikon
     i app.css. Klasserne gør ingenting de steder, hvor ikonet bare står
     stille (fx inde på værktøjsskærmene). */
  vejr:   '<g class="ik-sol"><circle cx="8.8" cy="8.4" r="3.1"/><path d="M8.8 2.7v1.6M3.1 8.4h1.6M4.8 4.4l1.1 1.1M12.8 4.4l-1.1 1.1M4.8 12.4l1.1-1.1" opacity=".8"/></g><path d="M10.2 20.6h6.9a2.9 2.9 0 0 0 .3-5.8 3.9 3.9 0 0 0-7.2-1.1 2.8 2.8 0 0 0 0 6.9Z"/>',
  lygte:  '<path d="M10.4 11.2h3.2l1.3 2.6H9.1z"/><path d="M9.9 13.8h4.2v6.9a1.1 1.1 0 0 1-1.1 1.1h-2a1.1 1.1 0 0 1-1.1-1.1z"/><path d="M9.9 16.2h4.2" opacity=".45"/><path class="ik-straale" d="M12 8.4V5.9M8.3 9.5 6.8 7.7M15.7 9.5l1.5-1.8" opacity=".9"/>',
  /* En diagonal målestok med streger — ikke et kurvediagram (første forsøg
     11/9 var en zigzag med led, og den lignede en graf). Skrå med vilje:
     vateret nedenfor er også en vandret bjælke, og de to må ikke ligne
     hinanden på en 26 px høj streg. */
  lineal: '<g transform="rotate(-34 12 12)"><rect x="1.9" y="9.3" width="20.2" height="5.5" rx="1.5"/><path d="M6.7 9.3v2.3M11.5 9.3v3.1M16.3 9.3v2.3" opacity=".55"/></g>',
  vater:  '<rect x="2.7" y="8.7" width="18.6" height="6.6" rx="1.9"/><path d="M9.7 8.7v6.6M14.3 8.7v6.6" opacity=".45"/><circle class="ik-boble" cx="12" cy="12" r="1.5"/>'
};
function ik(navn, kls){ return `<svg class="ik ${kls||''}" viewBox="0 0 24 24">${IKONER[navn]||''}</svg>`; }

/* ---------- brand ---------- */
/* Her lå en test-indlæsning af logo.png (469 KB), der satte et flag ingen læste
   og udløste en ekstra fuld gentegning efter første paint. Fjernet 13/8 —
   ordmærket kommer fra brand-pakken via ordmærke() nedenfor. */
const EKG_KURVE = 'M0 14 H34 L40 7 L46 19 L52 2 L58 21 L63 10 L67 14 H140';
function ekgSVG(farve){
  return `<svg class="ekg" viewBox="0 0 140 22" preserveAspectRatio="none">
    <path d="${EKG_KURVE}"
      fill="none" stroke="${farve||'var(--rav-lys)'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
/* Samme kurve som i logoet, men beskåret om selve udslaget (x 18→84), så den
   fylder cirklen på hovedknappen. Ingen nye streger — kun et andet udsnit.

   ⚠️ FARVEN STÅR I CSS'EN, IKKE HER, og det er en rettelse fra 17/9.

   Der stod `stroke="var(--gran)"`. Det så rigtigt ud — bark på en creme
   cirkel — og det var det ikke:

       :root          --gran: #3a3227   mørk bark
       mørk kontekst  --gran: #ECEAE3   creme        (app.css linje 177, 195)

   `--gran` betyder altså ikke "bark". Den betyder "primærfarven HER", og
   forsiden er mørk. Knappens cirkel er derimod lys, uanset hvad der er
   omkring den — så pulsen bad om den mørke kontekts primærfarve og fik
   creme. **Creme streg på en creme cirkel.**

   Det var hele grunden til, at Kennet skrev "sinusrytmen skal være
   tydeligere". Den var ikke tynd. Den var næsten væk.

   Farven på en LYS flade inde i en mørk kontekst er `--paa-lys` — den
   samme, som ordet i knappen og pillen på loggen allerede bruger. */
function pulsIKnap(){
  return `<svg class="rk-puls" viewBox="18 0 66 22">
    <path d="${EKG_KURVE}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
/* EN PULS, DER SLÅR (KN 28/9: "pulsstregen skal komme efter teksten og
   lave rytme som en animation — fjern bare pilen, hjerterytmen erstatter
   den"). To lag: en svag streg, der altid står der, så knappen kan læses
   uden bevægelse, og et lyst spor, der tegner slaget hen over den og
   falmer. Egen kurve, ikke EKG_KURVE: den løber 140 enheder, og kun et
   udsnit ses — et spor, der tegner hele kurven, ville bruge det meste af
   tiden uden for billedet. pathLength=100 gør animationen uafhængig af
   kurvens længde. */
const PULS_KNAP = 'M0 11 H14 L18 6 L22 16 L26 1 L30 21 L34 8 L37 11 H52';
function pulsLevende(){
  return `<svg class="sp-puls" viewBox="0 0 52 22" aria-hidden="true">
    <path class="sp-puls-bund" d="${PULS_KNAP}" pathLength="100"/>
    <path class="sp-puls-spor" d="${PULS_KNAP}" pathLength="100"/>
  </svg>`;
}
/* VORES EGEN HJERTERYTME (OD 4/10: "Læg vores egen hjerterytme på").
   Pulsen fra logoet — ikke en kurve tegnet efter den. Den ægte logofil
   bruges som CSS-maske og beskæres til pulsen alene (.logo-puls i app.css),
   så den følger tekstfarven og intet er gentegnet. */
function logoPuls(kls){ return `<span class="logo-puls ${kls||''}" aria-hidden="true"></span>`; }
/* Logoet — det nye (27/9), stablet: navnet øverst, pulsen under. Creme på
   mørk flade, Deep Brown på lys. SVG, auto-vektoriseret (potrace) af de
   leverede PNG'er og beskåret som dem — intet tegnet i hånden; se
   brand/arytmi_logo_2026/LÆS-MIG.md. PNG'erne ligger der stadig. */
function ordmærke(lys, medSlogan){
  const fil = lys
    ? 'brand/arytmi_logo_2026/arytmi_creme.svg'
    : 'brand/arytmi_logo_2026/arytmi_brun.svg';
  return `<span class="brand-lockup"><img class="logo-svg" src="${fil}" alt="${esc(t('faelles.logoalt','ARYTMI'))}">${medSlogan?`<span class="brand-tag">${t('faelles.slogan','vælg mindre, oplev mere')}</span>`:''}</span>`;
}
function logoSVG(lys){ return ordmærke(lys, false); }

/* =============================================================
   DATA
   ============================================================= */

/* -- byer til søgning (kort-koordinater i 210×244-viewBox) -- */
/* ⚠️ HER STOD `BYER` — femogtyve byer, skrevet i hånden med appens
   omtrentlige x/y. Den er væk 17/9 og afløst af `byer.js`: 605 byer med
   RIGTIGE lat/lon, høstet fra DAWA fjorten dage før DAWA lukkede.

   Kennet skrev "odder" i feltet og fik "Byen er ikke i prototypens liste
   endnu". Det var ikke en fejl i koden — Odder var bare ikke en af de
   femogtyve. Det er den slags grænse, man ikke kan se, før man rammer
   den, og så ligner den, at appen er i stykker.

   Sidegevinsten er større end selve listen: en by havde før KUN x/y, og
   x/y er en tegning, ikke en position. Nu har den lat/lon, og så kan
   solnedgangen regnes ud af en by, ikke kun af en adresse. */

/* -- Testede destinationer (Køreklar basispakke). t1 er format-eksemplet;
      t2-t19 er fra rekognosceringsturen 31/7-2/8 2026 (kilde:
      recon/arytmi-recon-2026-08-02-19-28.json). klar:false = "måske". -- */
const TESTEDE = [
  /* Ingen x/y her: de udledes af lat/lon længere nede (se geoTilXY-blokken) */
  { id:'t1', navn:'Vesterhavet — Hvide Sande Sydstrand', lat:55.905, lon:8.117, klar:true,
    ønsker:{ lys:'solnedgang', natur:'vand', stemning:'isoleret' },
    ord:'Vandkanten',
    kort:'Klitrækken syd for slusen. P-plads 40 m fra vandkanten.',
    beskrivelse:'Kør helt ud, hvor vejen ender. I parkerer med fronten mod vest, og solen går ned lige dér, hvor I sidder. Klitterne giver læ, og lyden af havet følger jer hele natten. Testet af os i både sommerstille og oktoberblæst — bilen står roligt begge dele.',
    faciliteter:{
      toilet:'Offentligt toilet ved slusen, 600 m (åbent hele døgnet)',
      handel:'SuperBrugsen Hvide Sande, 1,2 km (8–20)',
      aftensmad:'Fiskehuset ved havnen — stjerneskud og fiskefrikadeller (11–19:30)',
      morgen:'Hvide Sande Bageri, 900 m — åbner 6:30, kaffen er klar fra start' } },
  { id:'t2', navn:'Fruering Kirke', lat:56.03310, lon:9.99222, klar:false,
    ønsker:{ lys:'solnedgang', natur:'land', stemning:'livligt' },
    ord:'Udsigtsstop',
    kort:'Kirkeparkering højt i landskabet — flot at holde ind, men ikke at sove.',
    beskrivelse:'Vi kørte herop for udsigtens skyld, og den skuffer ikke: markerne folder sig ud under jer, og kirken står som et fikspunkt i det hele. Men vi vil være ærlige — det er ikke et sted at overnatte. Det er en kirkes parkeringsplads, og den følelse forsvinder ikke, selvom I holder stille. Tag den som et stop på vejen, spis jeres madpakke, og kør videre til et sted, hvor I kan lukke øjnene med god samvittighed.',
    billeder:['billeder/t2-fruering-kirke-1.jpg','billeder/t2-fruering-kirke-2.jpg','billeder/t2-fruering-kirke-3.jpg','billeder/t2-fruering-kirke-4.jpg'],
    faciliteter:{
      toilet:'',
      handel:'',
      aftensmad:'',
      morgen:'' } },
  { id:'t3', navn:'Rasteplads Mossøbrå', lat:56.03144, lon:9.83892, klar:true,
    ønsker:{ lys:'solnedgang', natur:'vand', stemning:'isoleret' },
    ord:'Skjult',
    kort:'Rasteplads med Mossø gemt lige om hjørnet — og ingen skilte, der siger nej.',
    beskrivelse:'Fra bilen ser det ud som en helt almindelig rasteplads, og det er nok grunden til, at der er så roligt. Gå de få meter ned mod vandet, og pludselig ligger Mossø der. Vi kunne ikke finde et eneste skilt mod overnatning, og pladsen er stor nok til, at I ikke ligger oven i nogen. Det her er sådan et sted, man kører forbi hundrede gange uden at opdage.',
    billeder:['billeder/t3-rasteplads-mossbra-1.jpg','billeder/t3-rasteplads-mossbra-2.jpg','billeder/t3-rasteplads-mossbra-3.jpg','billeder/t3-rasteplads-mossbra-4.jpg'],
    faciliteter:{
      toilet:'',
      handel:'',
      aftensmad:'',
      morgen:'' } },
  { id:'t4', navn:'Vædebro', lat:56.04586, lon:9.85238, klar:true,
    ønsker:{ lys:'solnedgang', natur:'vand', stemning:'isoleret' },
    ord:'Legeplads',
    kort:'Ved broen over Mossø — strandstemning, legeplads og plads til at trække vejret.',
    beskrivelse:'Parkeringspladsen ligger lige over for broen, og der er noget strandagtigt over stedet, selvom I er langt fra havet. Der er en legeplads, hvis I har børn med, og borde nok til at man kan spise en madpakke uden at have nogen i nakken. Vi holdt her en aften og blev overraskede over, hvor fredeligt der var, når trafikken over broen døde ud.',
    billeder:['billeder/t4-vdebro-1.jpg','billeder/t4-vdebro-2.jpg','billeder/t4-vdebro-3.jpg','billeder/t4-vdebro-4.jpg','billeder/t4-vdebro-5.jpg','billeder/t4-vdebro-6.jpg'],
    faciliteter:{
      toilet:'',
      handel:'',
      aftensmad:'',
      morgen:'' } },
  { id:'t5', navn:'Parkering Q høfterne', lat:56.47620, lon:8.12473, klar:true,
    ønsker:{ lys:'solnedgang', natur:'vand', stemning:'isoleret' },
    ord:'Bad',
    kort:'Vesterhavet i fuld bredde — og et rigtigt toilet med bad 40 skridt væk.',
    beskrivelse:'Det her er en af de udsigter, der får jer til at blive siddende i bilen lidt for længe, før I går ud. Havet fylder hele forruden. Der holder både autocampere og andre biler, så I er ikke alene — men brændingen er så høj, at I ikke hører dem. Vi havde regnet med, at naboerne ville ødelægge det. Det gjorde de ikke.',
    billeder:['billeder/t5-parkering-q-hfterne-1.jpg','billeder/t5-parkering-q-hfterne-2.jpg','billeder/t5-parkering-q-hfterne-3.jpg'],
    faciliteter:{
      toilet:'Toilet med bad på selve pladsen',
      handel:'Købmand ca. 400 m væk',
      aftensmad:'',
      morgen:'Købmanden 400 m væk har det, I skal bruge til morgenkaffen' } },
  { id:'t6', navn:'Hygum Bakke', lat:56.58306, lon:8.20271, klar:true,
    ønsker:{ lys:'solnedgang', natur:'land', stemning:'isoleret' },
    ord:'Panorama',
    kort:'Panorama til begge sider — vand den ene vej, land den anden.',
    beskrivelse:'Der er et udsigtspunkt, man kan gå op på, og derfra kan I se både vandet og landet i samme drej af hovedet. Det er den slags sted, hvor man bliver stående længere, end man havde tænkt. Til gengæld er der ingenting herude — intet toilet, ingen kiosk, intet. Byerne ligger tæt nok på, at I kan hente det, I mangler, men gør det, inden I kører op.',
    faciliteter:{
      toilet:'Nej — intet toilet på stedet',
      handel:'Byerne tæt på — handl ind, inden I kører op',
      aftensmad:'',
      morgen:'' } },
  { id:'t7', navn:'Aggerstien ved de sorte huse', lat:56.78753, lon:8.23201, klar:true,
    ønsker:{ lys:'solnedgang', natur:'vand', stemning:'isoleret' },
    ord:'Bunkere',
    kort:'Bunkere, klit og Vesterhav — et lille spot, men et af turens smukkeste.',
    beskrivelse:'Bunkerne ligger halvt begravet i sandet, og bag dem tager havet over. Der er en lille parkeringsplads, og det er vigtigt at ramme den rigtigt: I må ikke holde helt nede ved kysten, men I må gerne stille bilen ved det lille p-skilt. Gør det, så har I hele udsigten uden at træde nogen over tæerne. Pladsen er lille, så kommer I sent på en sommerdag, kan den være taget.',
    billeder:['billeder/t7-aggerstien-ved-de-sorte-huse-1.jpg','billeder/t7-aggerstien-ved-de-sorte-huse-2.jpg','billeder/t7-aggerstien-ved-de-sorte-huse-3.jpg'],
    faciliteter:{
      toilet:'Nej',
      handel:'Ca. 500 m væk',
      aftensmad:'Spisesteder ved havnen',
      morgen:'Der ligger caféer rundt omkring, hvis I vil have kaffen ude' } },
  { id:'t8', navn:'Hanstholm Fyr', lat:57.11339, lon:8.58986, klar:true,
    ønsker:{ lys:'solnedgang', natur:'vand', stemning:'livligt' },
    ord:'Fyret',
    kort:'Danmarks nordvestligste hjørne — fyret, klinten og havet hele vejen rundt.',
    beskrivelse:'Af alle de steder, vi så på turen, er det her det, vi kom længst væk fra og alligevel snakkede mest om bagefter. Fyret står som et vartegn, og landskabet falder væk mod havet. Der er højt til himlen på den måde, hvor man automatisk sænker stemmen. Vi noterede ikke meget om praktikken, da vi var her — så tjek selv skiltningen på stedet, inden I bliver natten over.',
    billeder:['billeder/t8-hanstholm-fyr-1.jpg','billeder/t8-hanstholm-fyr-2.jpg','billeder/t8-hanstholm-fyr-3.jpg','billeder/t8-hanstholm-fyr-4.jpg','billeder/t8-hanstholm-fyr-5.jpg','billeder/t8-hanstholm-fyr-6.jpg'],
    faciliteter:{
      toilet:'',
      handel:'',
      aftensmad:'',
      morgen:'' } },
  { id:'t9', navn:'Rødhus Strand', lat:57.21650, lon:9.52284, klar:true,
    ønsker:{ lys:'solnedgang', natur:'vand', stemning:'livligt' },
    ord:'På stranden',
    kort:'Kør bilen helt ned på stranden og find jeres eget hjørne af Vesterhavet.',
    beskrivelse:'Her kører I helt ned på sandet, og så handler det bare om at finde et sted, hvor der er langt til den næste bil. Det er der som regel. Stranden er så bred, at selv en travl dag ikke føles trængt. På vej derned passerer I en lille kiosk, der bager brød hver morgen — læg mærke til den, for det er den, der redder jeres morgenmad, når I vågner med sand mellem tæerne.',
    billeder:['billeder/t9-rdhus-strand-1.jpg','billeder/t9-rdhus-strand-2.jpg','billeder/t9-rdhus-strand-3.jpg','billeder/t9-rdhus-strand-4.jpg'],
    faciliteter:{
      toilet:'Ja',
      handel:'Lille kiosk på vejen ned til stranden',
      aftensmad:'',
      morgen:'Kiosken på vejen ned bager friskt brød hver morgen' } },
  { id:'t10', navn:'Sallingsundbroen', lat:56.75225, lon:8.83706, klar:true,
    ord:'Broen',
    kort:'Stop ved Sallingsundbroen — vandet på begge sider og broen som kulisse.',
    beskrivelse:'Broen spænder over sundet, og lyset over vandet er noget for sig, når dagen er ved at være slut. Vi holdt kort ind her på vej mod Mors og tog et par billeder. Ærligt: vi nåede ikke at undersøge stedet ordentligt, så se det som et smukt stop mere end som en færdig anbefaling — tjek skiltningen, inden I slår jer ned for natten.',
    billeder:['billeder/t10-sallingsund-broen-1.jpg','billeder/t10-sallingsund-broen-2.jpg'],
    faciliteter:{
      toilet:'',
      handel:'',
      aftensmad:'',
      morgen:'' } },
  { id:'t11', navn:'Dollerup Bakker', lat:56.39136, lon:9.32344, klar:true,
    ønsker:{ lys:'', natur:'land', stemning:'isoleret' },
    ord:'Vejstøj',
    kort:'En lille gryde i Dollerup Bakker — smukt, men vejen kan høres.',
    beskrivelse:'Pladsen ligger som en skål i landskabet med bakkerne omkring sig, og stierne herfra er nogle af de flotteste i området. Vi vil ikke pakke det ind: man kan høre vejen. Ikke voldsomt, men den er der. Er I til at falde i søvn med lidt baggrundsstøj, får I til gengæld et af de smukkeste stykker natur i Midtjylland lige uden for bilen.',
    billeder:['billeder/t11-dollerup-bakker-1.jpg','billeder/t11-dollerup-bakker-2.jpg','billeder/t11-dollerup-bakker-3.jpg','billeder/t11-dollerup-bakker-4.jpg'],
    faciliteter:{
      toilet:'Nej',
      handel:'',
      aftensmad:'',
      morgen:'' } },
  { id:'t12', navn:'Parkeringsplads Dollerup Bakker', lat:56.37398, lon:9.32465, klar:true,
    ønsker:{ lys:'', natur:'land', stemning:'livligt' },
    ord:'Rummelig',
    kort:'Rummelig plads ved bakkerne — hold nederst mod skoven, så er I i fred.',
    beskrivelse:'Ved første øjekast ligger pladsen tæt på vejen, og det gør den også. Men kør helt ned i den nederste ende ud mod skoven, så ændrer stedet karakter: træerne lukker om jer, og vejen bliver til en fjern lyd. Der kan holde andre biler, så regn ikke med at have pladsen for jer selv. Til gengæld har I hele Dollerup Bakker med sletter og bakkedrag lige uden for døren.',
    billeder:['billeder/t12-parkeringsplads-dollerup-bakker-1.jpg','billeder/t12-parkeringsplads-dollerup-bakker-2.jpg','billeder/t12-parkeringsplads-dollerup-bakker-3.jpg'],
    faciliteter:{
      toilet:'',
      handel:'Ishus tæt på pladsen',
      aftensmad:'',
      morgen:'' } },
  { id:'t13', navn:'Parkering ved ishuset Dollerup Bakker', lat:56.37103, lon:9.32004, klar:true,
    ord:'To biler',
    kort:'Plads til to biler ved ishuset — og så søen lige der.',
    beskrivelse:'Det er et af de spots, man håber, der er ledigt. Der er plads til højst to biler, søen ligger lige foran, og ishuset er nabo. Netop derfor er det populært, og vi så det være optaget flere gange i løbet af dagen. Kommer I midt på eftermiddagen i højsæsonen, så hav en plan B — men rammer I det tomt, er det svært at gøre bedre.',
    billeder:['billeder/t13-parkering-ved-ishuset-dollerup-bakker-1.jpg','billeder/t13-parkering-ved-ishuset-dollerup-bakker-2.jpg','billeder/t13-parkering-ved-ishuset-dollerup-bakker-3.jpg','billeder/t13-parkering-ved-ishuset-dollerup-bakker-4.jpg'],
    faciliteter:{
      toilet:'',
      handel:'Ishuset ligger lige ved pladsen',
      aftensmad:'',
      morgen:'' } },
  { id:'t14', navn:'P-plads ved Dollerup Bakker 3', lat:56.36780, lon:9.32971, klar:true,
    ønsker:{ lys:'', natur:'land', stemning:'isoleret' },
    ord:'Hule',
    kort:'En hule mellem træerne, med glimt af søen når løvet er væk.',
    beskrivelse:'Der er noget hemmeligt over den her plads. Man kan nærmest kravle ind i skovkanten, og mellem stammerne dukker søen op i små glimt. Om foråret og efteråret, når der ikke er blade på træerne, er udsigten bedst. Der er stier nok til en ordentlig gåtur og flere steder at sætte sig med maden. Toilet ligger ca. 200 m derfra, hvilket er en luksus herude.',
    billeder:['billeder/t14-p-plads-dollerup-bakker-3-1.jpg','billeder/t14-p-plads-dollerup-bakker-3-2.jpg','billeder/t14-p-plads-dollerup-bakker-3-3.jpg','billeder/t14-p-plads-dollerup-bakker-3-4.jpg','billeder/t14-p-plads-dollerup-bakker-3-5.jpg'],
    faciliteter:{
      toilet:'Toilet ca. 200 m fra pladsen',
      handel:'',
      aftensmad:'',
      morgen:'' } },
  { id:'t15', navn:'Hald Sø 2', lat:56.36644, lon:9.33187, klar:true,
    ønsker:{ lys:'', natur:'vand', stemning:'livligt' },
    ord:'Åben udsigt',
    kort:'Åben udsigt over Hald Sø — flere mennesker, men også mere smukt.',
    beskrivelse:'Her får I søen serveret uden forhindringer. Det er lysere og mere åbent end de andre pladser i området, og prisen for det er, at der kommer flere forbi, og at vejen er tættere på. Vi synes, det er værd at betale. Toilettet ligger lige ved, hvilket gør morgenen betydeligt nemmere.',
    billeder:['billeder/t15-halds-2-1.jpg','billeder/t15-halds-2-2.jpg','billeder/t15-halds-2-3.jpg'],
    faciliteter:{
      toilet:'Toilet lige ved pladsen',
      handel:'',
      aftensmad:'',
      morgen:'' } },
  { id:'t16', navn:'Hinge', lat:56.26642, lon:9.52250, klar:true,
    ord:'Stien',
    kort:'En parkeringslomme, der ikke ligner noget — indtil I går ned ad stien.',
    beskrivelse:'Vær forberedt: fra bilen er udsigten ikke meget bevendt. I holder inde i en lille lomme, og det er det. Men går I halvtreds meter ned ad stien, åbner det hele sig op over søen, og så forstår I, hvorfor vi tog stedet med. Der er også mountainbikespor herfra, hvis I har cyklerne med. Roligt sted at sove, beskedent sted at vågne — medmindre I lige tager den gåtur igen.',
    billeder:['billeder/t16-hinge-1.jpg','billeder/t16-hinge-2.jpg'],
    faciliteter:{
      toilet:'Nej',
      handel:'',
      aftensmad:'',
      morgen:'' } },
  { id:'t17', navn:'Parkeringsplads ved Sminge Sø', lat:56.21605, lon:9.66709, klar:true,
    ønsker:{ lys:'', natur:'vand', stemning:'livligt' },
    ord:'Kanoer',
    kort:'Ved Sminge Sø, hvor kanoerne lægger til — smukt, men del pladsen pænt.',
    beskrivelse:'Det her er et friluftssted mere end en parkeringsplads. Der kommer folk med kanoer, og der er shelters med træstubbe omkring. Campér ikke inde på selve shelterområdet — det er ikke jeres. Men I må gerne holde tæt ved kanten ned mod søen, og derfra er det virkelig smukt. Kommer I med respekt for dem, der har booket shelteren, er der plads til jer begge.',
    billeder:['billeder/t17-parkeringsplads-ved-sminge-s-1.jpg','billeder/t17-parkeringsplads-ved-sminge-s-2.jpg','billeder/t17-parkeringsplads-ved-sminge-s-3.jpg'],
    faciliteter:{
      toilet:'',
      handel:'',
      aftensmad:'Svostrup Kro ligger tæt på',
      morgen:'' } },
  { id:'t18', navn:'P-plads ved Anebjerg Skov, Virringvej', lat:56.03860, lon:10.00922, klar:false,
    ønsker:{ lys:'', natur:'land', stemning:'isoleret' },
    ord:'Skovro',
    kort:'Stille skovplads uden udsigt — men med en rigtig god sti.',
    beskrivelse:'Lad os være ærlige om, hvad det her er: en velfungerende p-plads i skovkanten. Der er ingen udsigt, og vejen ligger tæt på. Til gengæld er der stille, og stien ind i Anebjerg Skov er god. Det er et sted, man vælger, fordi det er praktisk og roligt — ikke fordi man vil vågne til noget storslået. Derfor har vi heller ikke sat vores stempel på det endnu.',
    billeder:['billeder/t18-p-plads-anebjerg-skov-virringvej-1.jpg','billeder/t18-p-plads-anebjerg-skov-virringvej-2.jpg','billeder/t18-p-plads-anebjerg-skov-virringvej-3.jpg','billeder/t18-p-plads-anebjerg-skov-virringvej-4.jpg','billeder/t18-p-plads-anebjerg-skov-virringvej-5.jpg'],
    faciliteter:{
      toilet:'Nej',
      handel:'',
      aftensmad:'',
      morgen:'' } },
  { id:'t19', navn:'Vestermølle', lat:56.02866, lon:9.95814, klar:true,
    ønsker:{ lys:'solnedgang', natur:'vand', stemning:'livligt' },
    ord:'Byen tæt på',
    kort:'Skanderborg Sø for enden af pladsen, museet som nabo og byen inden for rækkevidde.',
    beskrivelse:'Vestermølle er sådan en perle, hvor det hele bare er der: udsigt over Skanderborg Sø, det gamle møllemiljø og museet ved siden af, og byen tæt nok på, at I kan gå efter aftensmad. Det er ikke det mest øde sted på listen — men det er et af de nemmeste at holde af. Godt sted at slutte en tur, hvor I har sovet i vildmarken et par nætter.',
    billeder:['billeder/t19-vestermlle-1.jpg','billeder/t19-vestermlle-2.jpg','billeder/t19-vestermlle-3.jpg','billeder/t19-vestermlle-4.jpg','billeder/t19-vestermlle-5.jpg','billeder/t19-vestermlle-6.jpg'],
    faciliteter:{
      toilet:'Ja',
      handel:'Ja — byen ligger tæt på',
      aftensmad:'Ja — flere muligheder i Skanderborg',
      morgen:'' } }
];

/* De nitten, som de staar i KODEN — taget her, før noget bundt eller nogen
   kladde har rørt dem. Den bruges ét sted: når "vis kladder" slås FRA
   igen, og listen skal bygges forfra.

   Det lyder som et bælte for meget, men den første udgave 13/9 var forkert
   på den stille måde: uden et gemt bundt fjernede den kun MÆRKET, og så
   blev kladden stående i forslagene som om den var udgivet. Et sted, der
   ser rigtigt ud og ikke er det, er værre end et, der er mærket. */
const TESTEDE_KODE = JSON.parse(JSON.stringify(TESTEDE));

/* -- Bilen: først hvilken bil, så det nødvendige, så det man kan investere i.
   Emnerne folder teksten ud ved tryk, så siden ikke bliver en mur.
   Brødteksterne er UDKAST og mærket som sådan i visningen — OD skriver dem. -- */
const BIL_TYPER = [
  { id:'el',    navn:'Elbil',     under:'Varme fra batteriet og ladestop undervejs.' },
  { id:'andet', navn:'Anden bil', under:'Benzin, diesel eller hybrid — strømmen skal med hjemmefra.' }
];
const BILEN_GRUPPER = [
  /* Tre trin, ikke tre overskrifter på én side (OD 30/8). Rækkefølgen er
     rækkefølgen i flowet: bilen → det lækre → hygge.
     Info-ikonet vises kun på punkter med en brød-tekst — sengetøjet har
     bevidst ingen (OD 30/8: "fjern informations ikonerne ud for madras,
     dyner, puder og lagen"), for der er ikke noget at forklare. */
  /* ÅBEN gruppe (KN 6/9) — ligesom "Evt. hygge". Biler er ikke ens, og der
     mangler altid noget, listen ikke kender. Det man skriver, huskes til næste
     tur (s.egneTing.need) og lander på pakkelisten under "Det praktiske til
     bilen", fordi bilPunkt() giver det gruppen 'need'. */
  { id:'need', navn:'Udstyr til bilen', under:'Det, der skal med, for at natten overhovedet fungerer.',
    åben:'need', åbenTekst:'Hvad mangler I ellers?', punkter:[
    { id:'strøm', navn:'Strøm', ikon:'lyn', huske:true, tip:'Tilføj opladning til huskeliste',
      brød:'Strøm er det, der afgør, om natten bliver behagelig. Kør hjemmefra med rigeligt på batteriet, og regn med at natten koster lidt. Har I ikke en elbil, skal strømmen med hjemmefra — en powerbank eller en lille station rækker langt til lys og telefoner.' },
    /* Camp Mode er ude (OD 30/8) — det var et Tesla-ord for noget, alle biler
       gør på hver sin måde. Varme/ventilation er den samme oplysning på dansk,
       og den kan pakkes/planlægges som alt andet på listen. */
    { id:'varme', navn:'Varme/ventilation til natten', ikon:'bil', huske:true,
      brød:'Find ud af, hvordan bilen holder varmen og luften kørende, mens den står låst — i en Tesla hedder det Camp Mode. Prøv det hjemme i indkørslen inden turen; det er ærgerligt at stå på en mørk p-plads og lede i menuerne første gang.' },
    /* Sengetøjet flyttet op i need to have (OD 13/8). Det er ikke udstyr, man
       investerer i, hvis man bliver bidt — det er forskellen på at sove og
       at ligge vågen. */
    { id:'madras', navn:'Madras', ikon:'telt', huske:true },
    { id:'dyner',  navn:'Dyner',  ikon:'måne', huske:true },
    { id:'puder',  navn:'Puder',  ikon:'måne', huske:true },
    { id:'lagen',  navn:'Lagen',  ikon:'telt', huske:true }
  ]},
  { id:'nice', navn:'Udstyr, der er lækkert, men ikke nødvendigt', under:'Udstyr, I kan investere i, hvis I bliver bidt af arytmer.', punkter:[
    { id:'afskærmning', navn:'Afskærmning',       ikon:'måne', huske:true,
      brød:'Afskærmning i ruderne giver mørke at sove i og en fornemmelse af at være for sig selv. Det er den ting, folk oftest anskaffer efter første tur.' },
    { id:'nivellering', navn:'Nivelleringsblokke', ikon:'bil',  huske:true,
      brød:'De færreste p-pladser er i vater. Et par blokke under hjulene retter bilen op, så I ikke ligger og glider mod fodenden hele natten.' },
    { id:'myggenet',    navn:'Myggenet',          ikon:'blad', huske:true,
      brød:'Myggenet i vinduerne betyder, at I kan have en rude på klem hele natten. Ved vand og skov er det forskellen på frisk luft og en time med en summende gæst.' },
    { id:'oplader',     navn:'Oplader',           ikon:'lyn',  huske:true, tip:'Til mobil, computer o.l.',
      brød:'Ledninger til telefoner og det, I ellers har med. Tjek, at de passer til bilens udtag og ikke kun til en stikkontakt.' },
    { id:'bord',        navn:'Bord',              ikon:'kurv', huske:true,
      brød:'Et lille klapbord gør forskellen på at spise i skødet og at spise ved et bord. Det fylder mindre, end man tror.' },
    { id:'stole',       navn:'Stole',             ikon:'kurv', huske:true,
      brød:'To campingstole, så I kan sidde ude og ikke kun i bilen. Særligt værd at have med, hvor der ikke er bord-bænkesæt.' },
    { id:'paraply',     navn:'Paraply',           ikon:'vind', huske:true,
      brød:'Til den slags regn, der kommer skråt. En stor paraply gør, at man kan lave kaffe uden for bilen alligevel.' },
    { id:'køler',       navn:'Køler',             ikon:'sne',  huske:true,
      brød:'Køletaske eller kompressorkøler. Er den med, behøver I ikke handle undervejs — og maden holder til dagen efter.' },
    /* OD 21/9: "Tænd køler skal på listen" — altså køleskabet i bilen. Det er
       en HANDLING på afgangsdagen og ikke noget, man pakker, så den står for
       sig selv ved siden af køleren frem for at være en linje i dens tekst.
       `huske:true` sætter den på huskelisten, hvor den hører hjemme. */
    { id:'tændkøler',   navn:'Tænd køleskabet',   ikon:'sne',  huske:true,
      tip:'Inden I kører hjemmefra',
      brød:'Et køleskab skal have tid til at blive koldt. Tænd det, før I pakker maden ind — så er det kølet ned, når I kører.' }
  ]},
  /* "Evt. hygge" er en ÅBEN gruppe (OD 13/8): forslagene er bare forslag, og
     man skriver selv til. Det man skriver, huskes til næste tur —
     se s.egneTing.hygge. */
  { id:'hygge', navn:'Evt. hygge', under:'Det, der gør turen til jeres. Skriv selv til — appen husker det til næste gang.',
    åben:'hygge', åbenTekst:'Hvad hygger I med?', punkter:[
    { id:'spil',      navn:'Spil',            ikon:'stjerne', huske:true, brød:'Kort, terninger eller et lille brætspil til aftenen.' },
    { id:'pynt',      navn:'Pynt',            ikon:'gnist',   huske:true, brød:'Det, der gør bilen til et sted og ikke bare en bil.' },
    { id:'belysning', navn:'Belysning',       ikon:'sol',     huske:true, tip:'LED-stearinlys, lyskæde på batteri, myggelys o.l.',
      brød:'Lyskæde eller en lille lampe. Bilens kabinelys er sjældent hyggeligt.' },
    { id:'aktivitet', navn:'Aktivitet',       ikon:'blad',    huske:true, brød:'Bog, fiskestang, kikkert, badminton — det, I havde tænkt jer at lave.' },
    { id:'skærmholder',navn:'Holder til skærm',ikon:'bil',    huske:true, brød:'Så I kan se film fra sengen, uden at nogen skal holde skærmen.' }
  ]}
];
const BILEN_ALLE = BILEN_GRUPPER.flatMap(g=>g.punkter);

/* Hunden (OD 13/8). Egen foldbar rubrik på Personligt, så den ikke fylder for
   dem, der ikke har hund med. Punkterne tæller først med i pakkelisten, når
   man har slået rubrikken til — se pakkePunkter(). */
const HUND_PUNKTER = [
  { id:'hund-gaasnor',  tekst:'Gåsnor' },
  { id:'hund-langsnor', tekst:'Lang snor' },
  { id:'hund-mad',      tekst:'Hundemad' },
  { id:'hund-vand',     tekst:'Vand og skål' },
  { id:'hund-seng',     tekst:'Hundeseng eller tæppe' },
  { id:'hund-poser',    tekst:'Hundeposer' }
];

/* -- Pakke: personlige ting. De tre nederste er OD's tilføjelser 11/8 --
   Oplader, pas og klipklapper kom til 24/9 (KN). ⚠️ Nye punkter gør et
   Personligt, der var afkrydset færdigt, ufærdigt igen — det er rigtigt:
   laderen er ikke pakket, bare fordi listen var kortere i går. */
const PAKKE_PUNKTER = [
  { id:'nattøj',  tekst:'Nattøj' },
  { id:'badetøj', tekst:'Badetøj eller lignende — afhængigt af stedet' },
  { id:'toilettaske', tekst:'En lille toilettaske med det basale' },
  { id:'varmtøj', tekst:'Varm trøje eller jakke til om aftenen' },
  { id:'ekstratøj', tekst:'Ekstra tøj til dagen efter' },
  { id:'klipklapper', tekst:'Klipklapper' },
  { id:'oplader', tekst:'Oplader til mobilen' },
  { id:'pas',     tekst:'Pas' },
  { id:'personligt', tekst:'Personlige ting — medicin, yndlingste eller lignende' }
];

/* -- Mad/drikke: madscenarier (erstatter de gamle enkelt-retter 27/8) --
   Flowet er nu: Madscenarier → Snacks og drikkevarer → (Morgenmad, kun
   flerdages-ture) → færdig. Mellemsiden (den gamle "hub" med Tidsplan/Mad/
   Drikke) og de tre udstyrs-trin er slettet 30/8 efter Olivias gennemspilning:
   udstyret bor nu i det enkelte scenaries "Det skal I bruge". */
const MAD_VALG = [
  { id:'tapas',    tekst:'Tapas/deleretter' },
  { id:'takeaway', tekst:'Take Away' },
  { id:'picnic',   tekst:'Kold picnic (hjemmelavet)' },
  { id:'sammen',   tekst:'Lav-det-sammen' },
  { id:'ude',      tekst:'Vi spiser ude/på vejen' }
];
/* Uddybende indhold pr. madscenarie — alle fem har tekst fra Kennet nu (27/8).
   Felterne er alle valgfrie ud over nr/tagline/intro/brug/sådanGørVi/lilleEkstra:
   brugIntro (linje under selve overskriften), brugTitel (erstatter "Det skal I
   bruge", fx på 05), tip (tip-boks lige efter introteksten) og efter ("Efter
   måltidet" — udelades helt, hvis scenariet ikke har en).
   Rækkefølgen på siden er fast (OD 30/8): intro → tip → Sådan gør vi → Det
   lille ekstra → Efter måltidet → "Det skal I bruge" NEDERST. Det gamle
   tipForan-felt er væk — der er kun én tip-placering nu.
   Item-id'erne i brug[] er navngivet med scenarie-præfiks (fx 'tapas-glas' vs
   'picnic-glas'), så to valgte scenarier med samme udstyrsnavn ikke deler
   afkrydsning på pakkelisten. Salt/peber, dyppelse og køle/varmetaske går igen
   i alle fem — de kom ind, da udstyrs-trinnene blev sløjfet (OD 30/8). */
const MAD_SCENARIE_DETALJER = {
  tapas: {
    nr: '01',
    tagline: 'Tapas er næsten skabt til en arytme — og vores favorit',
    intro: [
      'Små retter, godt med dip, lidt vin og god tid.',
      'Det fungerer klart bedst, når I kan have det hele inden for rækkevidde, så begræns udvalget, og sørg for, at det kan ligge på højst to fade, tallerkener eller beholdere.'
    ],
    brug: [
      /* De tre første er MAD, ikke grej (OD 31/8) — de er mærket handle:true og
         lander derfor på handlelisten i stedet for i køkkenet. De står øverst,
         fordi maden er det, man beslutter først. */
      { id:'tapas-retter', tekst:'Tapasretter', tip:'Vi anbefaler 4–6 forskellige', handle:true },
      { id:'tapas-dip',    tekst:'Dip',         tip:'til brødet og retterne',        handle:true },
      { id:'tapas-brød',   tekst:'Brød',                                             handle:true },
      { id:'tapas-tallerkener-anret', tekst:'Tallerkener', tip:'eller små skåle til anretning' },
      { id:'tapas-tallerkener-spise', tekst:'Tallerkener', tip:'til at spise af' },
      { id:'tapas-bestik',            tekst:'Bestik' },
      { id:'tapas-glas',              tekst:'Glas', tip:'måske både vin- og vandglas' },
      { id:'tapas-lille-kniv',        tekst:'Lille kniv' },
      { id:'tapas-lille-skærebræt',   tekst:'Lille skærebræt' },
      { id:'tapas-servietter',        tekst:'Servietter' },
      { id:'tapas-affaldspose',       tekst:'Affaldspose' },
      { id:'tapas-vådservietter',     tekst:'Vådservietter' },
      { id:'tapas-salt-peber',        tekst:'Salt/peber' },
      { id:'tapas-dyppelse',          tekst:'Dyppelse', tip:'Skal I bruge ketchup, sennep, mayonnaise eller remoulade?' },
      { id:'tapas-køletaske',         tekst:'Køle/varmetaske' }
    ],
    sådanGørVi: 'Lav én samlet spiseplads i stedet for at have mad og emballage liggende rundt omkring. En bakke eller et skærebræt fungerer godt som fælles "bord". I bilen kan man ligge eller halvligge — eller sidde på forsæderne eller i bagagerummet.',
    /* Tesla-tippet er ude (KN 4/9). Det talte til én bilmodel i stedet for til
       måltidet — og madscenarierne skal kunne læses af alle, uanset bil. */
    tip: 'Sørg for, at I begge kan nå maden og har alt det praktiske inden for rækkevidde, før I sætter jer til rette.',
    lilleEkstra: [
      'Tag kun det frem, I skal bruge. Resten bliver i bilen.',
      'Og glem ikke en god flaskeåbner (eller køb med skruelåg), hvis der skal vin på bordet.'
    ],
    efter: 'Vi tørrer tingene af med vådservietterne og lægger dem tilbage i tasken. Så kan de ryge direkte i opvaskeren, når vi kommer hjem.'
  },
  takeaway: {
    nr: '02',
    tagline: 'Køb det, I har lyst til. Vi hjælper med resten.',
    intro: [
      'Pizza, burger, sushi, sandwich eller noget helt femte. Takeaway er nemt — lige indtil emballagen, saucerne og drikkevarerne skal have plads.'
    ],
    brug: [
      { id:'takeaway-tallerkener',   tekst:'Tallerkener', tip:'eller underlag' },
      { id:'takeaway-bestik',        tekst:'Evt. bestik/spisepinde' },
      { id:'takeaway-servietter',    tekst:'Servietter' },
      { id:'takeaway-glas',          tekst:'Glas', tip:'måske både vin- og vandglas' },
      { id:'takeaway-affaldspose',   tekst:'Affaldspose' },
      { id:'takeaway-vådservietter', tekst:'Vådservietter' },
      { id:'takeaway-køletaske',     tekst:'Køle/varmetaske' },
      { id:'takeaway-salt-peber',    tekst:'Salt/peber' },
      { id:'takeaway-dyppelse',      tekst:'Dyppelse', tip:'Skal I bruge ketchup, sennep, mayonnaise eller remoulade?' },
      { id:'takeaway-pizzaskærer',   tekst:'Pizzaskærer', tip:'Eller bed om at få den skåret ud.' }
    ],
    sådanGørVi: [
      'Find jeres spiseplads, før I åbner maden.',
      'Brug bagagerummet, et bord eller en anden fast flade som fælles spiseplads. Find affaldsposen frem med det samme, så emballagen er af vejen.'
    ],
    /* Tesla-tippet er ude (KN 4/9) — samme grund som i tapas. Scenariet har
       ingen tip-boks nu; feltet er valgfrit, og siden springer den over. */
    lilleEkstra: [
      'Har I køletasker, fungerer de lige så godt til at holde maden varm.',
      'Og tag altid et par ekstra servietter med. Altid.'
    ]
  },
  picnic: {
    nr: '03',
    tagline: 'Når maden bare skal åbnes og nydes',
    intro: [
      'Salater, sandwiches, tærte, frugt, ost, charcuteri eller det, I allerede har i køleskabet.',
      'Det gode ved kold picnic er, at I ikke skal lave mad, når I ankommer — det hele er pakket hjemmefra. Så kan I bruge tiden på hinanden.'
    ],
    brug: [
      { id:'picnic-tallerkener',   tekst:'Tallerkener' },
      { id:'picnic-bestik',        tekst:'Bestik' },
      { id:'picnic-glas',          tekst:'Glas', tip:'måske både vand- og vinglas' },
      { id:'picnic-servietter',    tekst:'Servietter' },
      { id:'picnic-lille-kniv',    tekst:'Lille kniv' },
      { id:'picnic-skærebræt',     tekst:'Skærebræt' },
      { id:'picnic-underlag',      tekst:'Underlag/tæppe' },
      { id:'picnic-affaldspose',   tekst:'Affaldspose' },
      { id:'picnic-vådservietter', tekst:'Vådservietter' },
      { id:'picnic-salt-peber',    tekst:'Salt/peber' },
      { id:'picnic-dyppelse',      tekst:'Dyppelse', tip:'Skal I bruge ketchup, sennep, mayonnaise eller remoulade?' },
      { id:'picnic-køletaske',     tekst:'Køle/varmetaske' }
    ],
    sådanGørVi: [
      'Pak maden, så den kan komme direkte fra køletasken til spisepladsen.',
      'Skal I sidde udenfor, og er der ingen bænk i nærheden, så tænk over underlaget. Skal I spise i bilen, så lav en fast flade til maden, og sørg for en god siddeplads med støtte i ryggen.'
    ],
    lilleEkstra: [
      'Pak maden i få større beholdere frem for mange små.',
      'Det gør både transporten, spisningen og oprydningen lettere.'
    ],
    efter: 'Vi tørrer tingene af med vådservietterne og lægger dem tilbage i tasken. Så kan de ryge direkte i opvaskeren, når vi kommer hjem.'
  },
  sammen: {
    nr: '04',
    tagline: 'Når maden er en del af oplevelsen',
    intro: [
      'Her er det ikke bare maden, der er målet. Det er også det, I laver sammen.',
      'Suppe, gryderetter, bøffer, pasta, hotdogs… listen med muligheder er lang.'
    ],
    tip: 'Mad, der skal laves på stedet, kræver plads. Vælg en destination med bord-bænkesæt, eller tag bord og stole med sammen med grill eller gasblus. Husk, at det tæller som camping — vælg derfor en destination, hvor camping er tilladt.',
    brugIntro: 'Det afhænger af retten, men tænk især på:',
    brug: [
      { id:'sammen-køkkenredskaber', tekst:'Køkkenredskaber' },
      { id:'sammen-grill',           tekst:'Grill/gasblus' },
      { id:'sammen-skærebræt',       tekst:'Skærebræt' },
      { id:'sammen-knive',           tekst:'Knive' },
      { id:'sammen-tallerkener',     tekst:'Tallerkener' },
      { id:'sammen-bestik',          tekst:'Bestik' },
      { id:'sammen-glas',            tekst:'Glas', tip:'vand- og/eller vinglas' },
      { id:'sammen-servietter',      tekst:'Servietter' },
      { id:'sammen-affaldspose',     tekst:'Affaldspose' },
      { id:'sammen-vådservietter',   tekst:'Vådservietter' },
      { id:'sammen-salt-peber',      tekst:'Salt/peber' },
      { id:'sammen-dyppelse',        tekst:'Dyppelse', tip:'Skal I bruge ketchup, sennep, mayonnaise eller remoulade?' },
      { id:'sammen-køletaske',       tekst:'Køle/varmetaske' }
    ],
    sådanGørVi: [
      'Vælg noget, der kan tilberedes uden at kræve et helt køkken.',
      'Lav en lille arbejdsplads, hvor én kan gøre klar, mens den anden laver noget andet. Tag evt. en parasol eller paraply med, hvis det regner.'
    ],
    lilleEkstra: [
      'Jo mere kompliceret maden er, jo mere skal I tænke over, hvor den skal laves.',
      'Madlavning er hyggeligt. At opdage, at man mangler en ske, når gryden allerede koger, er mindre hyggeligt.',
      'Obs: Har I alligevel gasblusset med, kan det også give en god morgenmad.'
    ]
  },
  ude: {
    nr: '05',
    tagline: 'Nogle gange er det bedste måltid det, andre har lavet.',
    intro: [
      'I behøver ikke have mad med for at få glæde af Arytmi. Måske finder I en lille restaurant, en café eller noget lækkert på vejen.'
    ],
    brugTitel: 'Det skal I stadig overveje',
    brug: [
      { id:'ude-vand',        tekst:'Vand', tip:'til turen' },
      { id:'ude-snacks',      tekst:'Snacks' },
      { id:'ude-kaffe-te',    tekst:'Kaffe/te' },
      { id:'ude-drikkevarer', tekst:'Evt. drikkevarer til senere' },
      { id:'ude-morgenmad',   tekst:'Morgenmad', tip:'til dagen efter' },
      /* Kun køle/varmetasken går igen her. Salt/peber og dyppelse hører til de
         fire scenarier, hvor man selv anretter maden — på "vi spiser ude" er
         listen "det I stadig skal overveje" (drikkevarer, morgenmad), og dér
         ville en remoulade-linje være støj. Sig til, hvis den skal med alligevel. */
      { id:'ude-køletaske',   tekst:'Køle/varmetaske' }
    ],
    sådanGørVi: [
      'Skal I spise ude, så husk at bestille bord.',
      'Indimellem finder vi først et sted at overnatte i nærheden og tager en taxa til spisestedet, hvis der er for langt at gå. Så slipper I for "hvem kører?"-samtalen og kan nyde det hele i fulde drag.'
    ],
    lilleEkstra: [
      'Tænk ét måltid frem.',
      'Hvis I spiser ude om aftenen, hvad skal I så have til morgenkaffen?'
    ]
  }
};
/* ÉN liste (OD 30/8). Var to grupper — "Til turen" og "Til aftenen" — men de
   blev slået sammen: det er alligevel én indkøbstur. "Snacks" og "Evt. sødt
   eller salt" er samtidig lagt sammen til ét punkt, og "Evt. drinks/vin/øl"
   hedder nu Drikkevarer. De gamle DRIKKE_VALG-id'er (glas, åbner …) er
   BEVARET uændret her, så afkrydsninger på gemte ture overlever — se
   migrationen i indlæs(), der flytter f.drikkeValg over i f.snackValg. */
const SNACK_VALG = [
  { id:'vand',        tekst:'Vand' },
  { id:'snacks',      tekst:'Snacks', tip:'Sødt eller salt' },
  { id:'kaffe-te',    tekst:'Kaffe/te' },
  { id:'drinks',      tekst:'Drikkevarer', tip:'Vin, øl, sodavand, danskvand o.l.' },
  /* Alt efter drikkevarerne er GREJ, ikke indkøb (OD 31/8). Det står under sin
     egen overskrift, fordi det typisk allerede er dækket af et madscenarie —
     har man ikke valgt et, er det her, man opdager, at glassene mangler. */
  { id:'glas',        tekst:'Glas',                              del:2 },
  { id:'åbner',       tekst:'Åbner',                             del:2 },
  { id:'servietter',  tekst:'Servietter',                        del:2 },
  { id:'skål',        tekst:'Skål eller tallerken, der står godt', del:2 },
  { id:'køletaske',   tekst:'Evt. køletaske',                    del:2 }
];
/* Morgenmad-trinnets faste liste (KN 27/8) — kun for flerdages-ture. Man
   vælger selv, hvad der er relevant, og kan skrive egne punkter til (se
   s.egneTing.morgen), som huskes på tværs af ture ligesom pakke/hygge/hund. */
const MORGEN_VALG = [
  { id:'kaffe-te',    tekst:'Kaffe/te', tip:'eller andet morgenritual' },
  { id:'kopper',      tekst:'Kopper' },
  { id:'ske',         tekst:'Ske' },
  { id:'vand',        tekst:'Vand' },
  { id:'morgenmad',   tekst:'Morgenmad' },
  { id:'mælk-sukker', tekst:'Mælk, sukker eller lignende' },
  { id:'bestik',      tekst:'Bestik' },
  { id:'varme',       tekst:'Evt. noget at varme vand/mad i' }
];
/* FORPLEJNING_UDSTYR (Service og spisegrej · Køl og varme · Oprydning) er
   slettet 30/8 efter Olivias gennemspilning. De tre trin lå efter Snacks og
   spurgte om udstyr løsrevet fra det, man rent faktisk skulle spise. Nu står
   udstyret dér, hvor beslutningen træffes: i det enkelte madscenaries
   "Det skal I bruge". Salt/peber, dyppelse og køle/varmetaske er flyttet med
   over i alle scenarier, pizzaskæreren kun til Take Away. Resten (termokande,
   opvaskemiddel, viskestykke …) er bevidst ikke båret over — spørg OD, hvis
   noget af det skal tilbage. Ligger i git-historikken. */

/* =============================================================
   STATE
   ============================================================= */
function friskState(){
  return {
    version:M.STATE_VERSION,   // en frisk tilstand er allerede på nyeste form
    onboarded:false,
    /* partner (KN 6/9): den faste rejsemakker, man deler HELE appen med — ikke
       en gæst på én tur. Derfor bor hun i profilen og ikke i turen.
       status: null (ingen) · 'sendt' (SMS afsted, venter) · 'aktiv' (accepteret) */
    /* Telefonnummeret er identiteten (beslutning 4, fastholdt 7/9). Her står
       kun visningen af det — selve login'et ejes af auth.js og Supabase.
       Der stod før en hårdkodet `email:'kennet@justsecure.dk'` og en
       `kode:''` i klartekst. Begge er væk; v6-migrationen rydder dem hos dem,
       der allerede har dem liggende. */
    /* tema (KN 11/9): 'døgn' = hele appen følger lyset på turens sted, som
       forsidens landskab gør. 'lys' = appen står i dagens flade hele døgnet.
       Feltet læses ALTID gennem temaValg(), som falder tilbage på 'døgn' —
       så gamle tilstande uden feltet virker uden en migration. */
    profil:{ email:'', telefon:'', navn:'', fødselsdag:'', notifikationer:true,
             tema:'døgn', partner:{ navn:'', telefon:'', status:null } },
    /* ---- flere ture ad gangen (31/8, OD) ----
       Før var der ÉN tur: s.forberedelse. Nu ligger de kommende ture i
       s.arytmer, og s.aktivId peger på den, man arbejder på lige nu.
       s.forberedelse findes stadig — som en accessor (se klargørState), der
       slår op i arytmer. Det er med vilje: 131 steder i appen læser
       s.forberedelse, og de skal ikke alle sammen røres for at kunne have to
       ture i kalenderen. Afholdte ture ligger fortsat i s.ture; de har en
       anden form (score, kommentar, minde) og er ikke ture, man planlægger.
       En arytme = et forberedelse-objekt + et id. */
    arytmer:[],          // kommende ture — [{id, ...nyForberedelse()}]
    aktivId:null,        // hvilken af dem s.forberedelse peger på
    /* ---- egne punkter, på tværs af ture (14/8, OD) ----
       "Appen skal huske de punkter man selv tilføjer listerne, så de ligger
       der til næste gang." Derfor bor de HER og ikke i s.forberedelse, som
       nulstilles, når turen er gemt (før: hver gang man kørte af sted). Selve
       afkrydsningen er stadig turens — det er tingene, der huskes, ikke om
       de var pakket sidste gang.
       Faste lister: pakke (Personligt), hygge (Bilens nice-to-have), hund
       og morgen (Morgenmad-trinnets egne punkter, 27/8). Dertil én liste pr.
       madscenarie ('mad-tapas', 'mad-takeaway' …) fra "Jeg vil også
       medbringe…" (OD 30/8) — de er pr. scenarie og ikke fælles, så en
       pizzaskærer skrevet under Take Away ikke dukker op under Tapas. */
    egneTing:tommeEgneTing(),
    ture:[]              // {sted,dato,score:{destination,app,hygge},kommentar,minde,plan}
  };
}
/* Ét sted at bestemme, hvilke egne-lister der findes — brugt både af
   friskState(), migrationen og tilføjEgetPunkt(). */
function egneListeNavne(){
  return ['pakke','hygge','need','hund','morgen', ...MAD_VALG.map(m=>'mad-'+m.id)];
}
function tommeEgneTing(){
  const ud = {};
  egneListeNavne().forEach(k=>{ ud[k] = []; });
  return ud;
}
let s = klargørState(indlæs());
/* Skriv den migrerede tilstand ned MED DET SAMME.
   Uden denne linje lever v5 kun i hukommelsen, indtil brugeren tilfældigvis
   ændrer noget. Lukkede de appen inden da, ville næste opstart læse v4 igen
   og give de samme punkter helt nye id'er — og id'er, der skifter ved hver
   opstart, er ikke stabile id'er. Hele pointen med migrationen ville være
   væk, og to telefoner ville aldrig kunne enes om, hvad "det punkt" er. */
if(!localStorage.getItem(GEM)) gem();

/* Nettet under appen startes FOERST — foer tokenet laeses, foer udbakken,
   foer noget tegnes. En fejl i opstarten er praecis den, der er svaerest at
   finde bagefter, og den ville slippe forbi, hvis nettet blev spaendt ud
   bagefter. Uden en DSN melder den ingenting og skriver kun i konsollen;
   selve opfangningen virker uanset. Se fejl.js. */
if(typeof ArytmiFejl !== "undefined"){
  ArytmiFejl.start({
    /* Hvilken skaerm stod hun paa? Det er det ENESTE, der for alvor goer en
       fejlmelding brugbar: "den virker ikke" bliver til "det sker paa
       destinationsskaermen". Laeses ved fejlen, ikke ved opstart. */
    skærm: () => (typeof aktivSkærm !== 'undefined' ? aktivSkærm : ''),
    udgave: (document.querySelector('script[src*="app.js"]') || {}).src?.split('?v=')[1] || ''
  });
}

/* Aktiveringstokenet fra ordrebekraeftelsens link laeses EN gang ved opstart,
   foer noget tegnes. Det staar i adressens fragment og har derfor aldrig
   vaeret forbi en server — hverken vores eller nogen andens. */
let akToken = (typeof ArytmiAuth !== "undefined") ? ArytmiAuth.tokenFraAdressen() : null;

/* Udbakken startes, saa snart tilstanden staar. Den ventes IKKE paa: appen
   skal tegne med det samme og ikke paa et netvaerk. Er der ingen klient —
   navigationstesten, en bruger uden login, en telefon uden daekning — gaar
   start() bare tilbage med false og goer intet. */
if(typeof ArytmiSync !== "undefined"){
  ArytmiSync.start({
    tilstand: () => s,
    gemLokalt: () => localStorage.setItem(GEM, JSON.stringify(s)),
    tegnIgen: () => { try{ tegn(); }catch(e){} },
    /* "Hun har delt en tur med dig" (KN 16/9), trin 1 af to.
       Udbakken siger til, naar en tur er FREMMED nu og ikke var det foer —
       altsaa i det oejeblik rejsemakkeren traykker Del. Beskeden lander i
       tilstanden og bliver vist paa forsiden af `deltVarsel()`.

       ⚠️ DET HER ER IKKE EN NOTIFIKATION. Det virker, mens appen er aaben,
       og kun der. Telefonen i lommen lyser ikke op — det kraever trin 2,
       som staar i backend-planen under fase 3 og ikke er besluttet endnu.
       Bland ikke de to sammen: den her er gratis og virker i dag. */
    nyDeltTur: ids => {
      if(!Array.isArray(s.deltVarsel)) s.deltVarsel = [];
      ids.forEach(id => { if(s.deltVarsel.indexOf(id) === -1) s.deltVarsel.push(id); });
    }
  });
}

/* TRÆK NED FOR AT OPDATERE (KN 28/9: "de fleste apps, der kan man trække
   ned, så opdaterer den — det skal vores vel også?").

   Det er en rigtig opdatering, ikke en pynt: først sendes det, der venter i
   udbakken, så hentes det, rejsemakkeren har lavet (ArytmiSync.skub/hent).
   Realtime klarer det meste af sig selv, men et træk er det, man gør, når
   man TVIVLER — og så skal svaret komme fra serveren, ikke fra hukommelsen.

   HVORFOR HER OG IKKE I index.html: skelettet er et skelet (AGENTS.md).
   Indikatoren er appens eget element; den laves én gang her og lægges ved
   siden af #indhold, så den overlever, at indholdet tegnes om.

   Kun når skærmen står helt i toppen, kun lodret (et vandret træk i en
   billedstribe eller på afstandsskyderen er ikke et træk ned), og kun med
   en finger. Lytterne er passive: de bremser aldrig selve rulningen. */
const TRÆK_TÆRSKEL = 72;   // så langt skal man trække, før det tæller
const TRÆK_MAKS = 112;     // længere end det følger indikatoren ikke med
let trækAktiv = false, trækStart = null, trækAfstand = 0, trækOpdaterer = false;

function trækIndikator(){
  let el = $('træk-opdater');
  if(el) return el;
  const ramme = $('indhold'); if(!ramme || !ramme.parentNode) return null;
  el = document.createElement('div');
  el.id = 'træk-opdater';
  el.className = 'træk-opdater';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="træk-ring">' + ik('puls') + '</span>';
  ramme.parentNode.insertBefore(el, ramme);
  return el;
}

function trækVis(afstand, glid){
  const ramme = $('indhold'), el = trækIndikator();
  if(!ramme || !el) return;
  ramme.style.transition = el.style.transition = glid ? '' : 'none';
  /* Indholdet følger fingeren halvt så langt — det giver den bløde modstand,
     man kender fra telefonens egne lister. */
  ramme.style.transform = afstand ? 'translateY(' + Math.round(afstand * .5) + 'px)' : '';
  el.style.setProperty('--træk', Math.round(afstand) + 'px');
  el.style.setProperty('--træk-andel', Math.min(1, afstand / TRÆK_TÆRSKEL).toFixed(3));
  el.classList.toggle('klar', afstand >= TRÆK_TÆRSKEL);
}

async function trækOpdater(){
  const el = trækIndikator();
  trækOpdaterer = true;
  if(el) el.classList.add('opdaterer');
  trækVis(TRÆK_TÆRSKEL * .8, true);
  const start = Date.now();
  let fejl = false;
  try{
    if(window.ArytmiSync){
      if(ArytmiSync.skub) await ArytmiSync.skub();
      if(ArytmiSync.hent) await ArytmiSync.hent();
    }
  }catch(e){ fejl = true; }
  /* Et svar på 80 ms ser ud som om, der intet skete. Indikatoren får lov at
     slå et par slag, så man når at se, at der blev hentet. */
  const ro = 650 - (Date.now() - start);
  if(ro > 0) await new Promise(r => setTimeout(r, ro));
  /* Tegnes om uden skift (se tegn()): står man på en nedtælling, skal
     tallene også passe NU. Intet blinker — det er samme visning. */
  tegn();
  if(el) el.classList.remove('opdaterer');
  trækOpdaterer = false;
  trækVis(0, true);
  if(fejl || (typeof navigator !== 'undefined' && navigator.onLine === false)){
    flash(t('faelles.ingenforbindelse','Ingen forbindelse lige nu. Det, du har lavet, venter og sendes, når der er net.'), 'info');
  }
}

/* Sættes op nederst i filen, efter første tegn(): `$` er en const længere
   nede, og et kald herfra ville ramme den, før den findes. */
function trækForAtOpdatere(){
  const ramme = $('indhold');
  if(!ramme || ramme.dataset.træk) return;
  ramme.dataset.træk = '1';
  ramme.addEventListener('touchstart', e => {
    if(trækOpdaterer || e.touches.length !== 1 || ramme.scrollTop > 0) { trækStart = null; return; }
    if(e.target.closest && e.target.closest('input,textarea,select,.sted-række,.foto-stribe,.sg-spor')) { trækStart = null; return; }
    trækStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    trækAktiv = false; trækAfstand = 0;
  }, { passive: true });
  ramme.addEventListener('touchmove', e => {
    if(!trækStart || trækOpdaterer) return;
    const dx = e.touches[0].clientX - trækStart.x, dy = e.touches[0].clientY - trækStart.y;
    if(!trækAktiv){
      /* Retningen afgøres på de første 8 px. Vandret eller opad er ikke et
         træk ned — så slipper vi det helt for resten af berøringen. */
      if(Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if(dy <= 0 || Math.abs(dx) > Math.abs(dy) || ramme.scrollTop > 0){ trækStart = null; return; }
      trækAktiv = true;
    }
    /* Modstanden vokser, jo længere man trækker. */
    trækAfstand = Math.min(TRÆK_MAKS, dy * .6);
    trækVis(trækAfstand, false);
  }, { passive: true });
  const slip = () => {
    if(!trækStart){ return; }
    trækStart = null;
    if(!trækAktiv) return;
    trækAktiv = false;
    if(trækAfstand >= TRÆK_TÆRSKEL) trækOpdater();
    else trækVis(0, true);
    trækAfstand = 0;
  };
  ramme.addEventListener('touchend', slip, { passive: true });
  ramme.addEventListener('touchcancel', slip, { passive: true });
}

function indlæs(){
  try{
    const gemt = localStorage.getItem(GEM) || localStorage.getItem(GEM_V4);
    if(gemt){
      const g = JSON.parse(gemt);
      // beskeder er slået til fra start — gamle gemte tilstande havde intet valg
      if(g.profil && g.profil.notifikationer == null) g.profil.notifikationer = true;
      /* migration 6/9: den faste partner. Gamle gemte tilstande har ingen —
         uden dette felt ville profilskærmen kaste på første tegning. */
      if(g.profil && !g.profil.partner) g.profil.partner = { navn:'', telefon:'', status:null };
      /* migration 14/8: egne punkter flyttet ud af turen og op i staten, så de
         overlever, at man kører af sted. Dem, der ligger i en igangværende
         forberedelse, tages med op — ellers ville folk miste det, de allerede
         havde skrevet, i selve den opdatering, der skulle bevare det. */
      /* migration 31/8: "God tur"-tilstanden findes ikke længere. En tur, der
         var i gang, ER afholdt — den lægges i loggen som en uanmeldt tur, så
         den ikke forsvinder lydløst sammen med tilstanden. */
      if(g.påTur){
        g.ture = g.ture || [];
        g.ture.unshift({ sted:g.påTur.sted||'Jeres sted', dato:g.påTur.startet,
                         score:null, kommentar:'', minde:'', plan:g.påTur.plan||null });
        delete g.påTur;
      }
      if(!g.egneTing) g.egneTing = tommeEgneTing();
      egneListeNavne().forEach(k=>{ if(!Array.isArray(g.egneTing[k])) g.egneTing[k] = []; });
      if(g.forberedelse && Array.isArray(g.forberedelse.egnePunkter) && g.forberedelse.egnePunkter.length){
        const kendte = new Set(g.egneTing.pakke.map(p=>p.tekst));
        g.forberedelse.egnePunkter.forEach(p=>{ if(!kendte.has(p.tekst)) g.egneTing.pakke.push(p); });
        g.forberedelse.egnePunkter = [];
      }
      // migration: ældre gemte ture kender ikke Forplejningens nye valglister
      if(g.forberedelse){
        const f = g.forberedelse;
        if(!f.snackValg) f.snackValg = [];
        if(!f.morgenValg) f.morgenValg = [];
        /* migration 30/8: Snacks og Drikkevarer er én liste nu. De gamle
           drikke-id'er er bevaret uændret i SNACK_VALG, så det er nok at
           flytte dem over — ellers tabte en gemt tur sine drikkevarer
           lydløst, og forplejningKlar() ville flippe til "ikke klar". */
        if(Array.isArray(f.drikkeValg) && f.drikkeValg.length){
          f.snackValg = [...new Set([...f.snackValg, ...f.drikkeValg])];
        }
        delete f.drikkeValg;
        /* migration 30/8: udstyrs-trinnene er væk, og scenariernes egne
           punkter kan nu vælges enkeltvis (f.brugValg). Havde man allerede
           valgt et scenarie, var HELE dets brug-liste med — så det er den
           tilstand, vi genskaber. Ellers ville pakkelisten tømmes for folk
           midt i en tur. */
        if(!f.brugValg) f.brugValg = [];
        /* migration 31/8: punkterne er nu forvalgt, når man åbner et scenarie.
           Scenarier, der allerede ligger på turen, regnes som forvalgte — ellers
           ville et bevidst fravalg blive fyldt op igen ved næste tegning. */
        if(!f.brugSet) f.brugSet = [...(f.madValg||[])];
        (f.madValg||[]).forEach(id=>{
          const d = MAD_SCENARIE_DETALJER[id]; if(!d) return;
          if(!d.brug.some(p=>f.brugValg.includes(p.id))){
            d.brug.forEach(p=>f.brugValg.push(p.id));
          }
        });
        delete f.udstyrValg;
        // migration 11/8: Bilen fik biltype + huskeliste, og afgangsdagen sin
        // egen tjekliste. (egnePunkter er flyttet op i s.egneTing 14/8 — se
        // migrationen ovenfor; feltet skal ikke genskabes her.)
        if(f.bilType === undefined) f.bilType = null;
        if(!f.bilHuske) f.bilHuske = [];
        if(!f.klarTjek) f.klarTjek = [];
        delete f.egnePunkter; delete f.egetUdkast;
        if(f.hundMed === undefined) f.hundMed = false;
        /* migration 30/8: måltidsplanen (tidsplanen) er slettet — se
           kommentaren over MAD_VALG. Felterne ryddes, så de ikke ligger og
           fylder i gemt state. */
        /* returtid er tilbage 31/8 som et valgfrit klokkeslæt på hjemkomsten —
           den må IKKE slettes her længere, ellers ryger feltet ved hver
           indlæsning. Måltidsplanens egne felter er stadig væk. */
        delete f.måltidFra; delete f.egneMåltider;
        if(f.afgangstid === undefined) f.afgangstid = '16:00';
        if(f.returtid === undefined) f.returtid = '13:00';
        /* Camp Mode udgik 30/8, og bilTjek havde ingen andre punkter. En tur,
           der HAVDE krydset Camp Mode af, har været bilen igennem — den
           regnes derfor som færdig, så punktet ikke pludselig bliver rødt. */
        if(!f.set) f.set = {};
        if(f.set.bilen === undefined) f.set.bilen = !!(f.bilTjek||[]).includes('camp');
        delete f.bilTjek;
      }
      /* v5 til allersidst: de defensive tjek ovenfor kan nå at lave nye ture
         og nye punkter, og de skal også have et stabilt id. Migrationen er
         idempotent — er `version` allerede 5, gør den ingenting. */
      return M.migrerTilV5(g);
    }
    // migration: tag gamle ture med over fra v2/v3
    const v2 = localStorage.getItem('klar-app-v2');
    if(v2){
      const g = JSON.parse(v2);
      const ny = friskState();
      ny.ture = (g.ture||[]).map(t=>({
        sted:t.sted, dato:t.dato,
        score:{ destination:t.placering||0, app:0, hygge:t.komfort||0 },
        kommentar:t.huske||t.virkede||''
      }));
      return M.migrerTilV5(ny);
    }
  }catch(e){}
  return friskState();
}
/* Den ene linje, sync.js får (planen, Fase 1). Rækkefølgen er hele pointen:
   localStorage FØRST, og gemningen er færdig i samme sekund. Udbakken kan
   ikke få den til at vente og kan ikke få den til at fejle — sync.js kaster
   ikke, og uden en klient gør den ingenting. */
function gem(){
  localStorage.setItem(GEM, JSON.stringify(s));
  if(typeof ArytmiSync !== "undefined") ArytmiSync.efterGem();
  planlægBeskeder();   // "Din arytme er nu afholdt" — gør intet uden for den pakkede app
  planlægOfflineBilleder();   // turens billeder på telefonen — kun på hjemmeskærmen (K22)
}

/* =============================================================
   FLERE TURE — s.forberedelse som opslag i s.arytmer
   =============================================================
   Kontrakten er uændret for resten af appen: s.forberedelse er turen, man
   arbejder på, eller null. Det nye er, at den ikke ejer turen længere.

   Tildeling:
     s.forberedelse = nyForberedelse()  → ny tur, lagt i arytmer, gjort aktiv
     s.forberedelse = null              → SLIP den aktive tur (den bliver
                                          liggende som kommende tur)
   Skal en tur væk for altid, er det sletTur(id) — aldrig "= null". Det er
   grunden til, at de to ting har hvert sit navn: før betød "= null" begge
   dele, og med flere ture ville det stille og roligt tømme kalenderen. */
/* Samme generator som alt andet siden 0.6. Den havde før sin egen udgave med
   fire tilfældige tegn — nok i praksis, men ikke noget at have to udgaver af,
   når to enheder snart skal skrive i den samme kalender. */
function nytTurId(){
  return M.nytId('a');
}
function klargørState(g){
  if(!Array.isArray(g.arytmer)) g.arytmer = [];
  if(g.aktivId === undefined) g.aktivId = null;
  /* Migration 31/8: den ene gemte tur bliver til arytme nr. 1. Den skal ind,
     FØR accessoren sættes på — ellers skriver vi ind i vores egen setter
     midt i indlæsningen. */
  const gammel = Object.prototype.hasOwnProperty.call(g,'forberedelse') ? g.forberedelse : null;
  delete g.forberedelse;
  if(gammel && typeof gammel === 'object'){
    if(!gammel.id) gammel.id = nytTurId();
    if(!g.arytmer.some(a=>a.id===gammel.id)) g.arytmer.push(gammel);
    if(!g.aktivId) g.aktivId = gammel.id;
  }
  g.arytmer.forEach(a=>{ if(!a.id) a.id = nytTurId(); });
  if(g.aktivId && !g.arytmer.some(a=>a.id===g.aktivId)) g.aktivId = null;

  /* FORMEN PÅ HVER ARYTME (21/9). Her, og ikke inde i indlæs(): den her
     funktion er den ENE tragt, alle veje ind går igennem — en gemt
     tilstand, en migreret gammel, og en frisk. Og den kører EFTER
     migrationerne i indlæs(), hvilket `brugSet` er afhængig af; se
     LISTEFELTER i model.js.

     Uden linjen kastede forsiden på en arytme, der var kommet ned fra
     serveren: `fraRaekker` gav rækkens `data` videre råt, og
     `tjeklisteData` læste `f.pakkeTjek.length` på et felt, der ikke var
     der. Rettet begge steder — her for det, der allerede ligger på
     telefonen, og i `fraRaekker` for det, der kommer ind. */
  g.arytmer.forEach(M.sikrForberedelse);
  Object.defineProperty(g, 'forberedelse', {
    enumerable:false,        // må ikke serialiseres — turen bor i arytmer
    configurable:true,
    get(){ return g.arytmer.find(a=>a.id===g.aktivId) || null; },
    set(v){
      if(v == null){ g.aktivId = null; return; }
      if(!v.id) v.id = nytTurId();
      if(!g.arytmer.some(a=>a.id===v.id)) g.arytmer.push(v);
      g.aktivId = v.id;
    }
  });
  return g;
}
/* Den næstkommende tur: den med den første dato fra i dag og frem. Ture uden
   dato ligger bagest — de er kladder, ikke aftaler. Er alle datoer passeret,
   vises den nyeste alligevel, så forsiden ikke bliver tom, mens man stadig er
   i gang med turen. */
function næsteArytme(){
  if(!s.arytmer.length) return null;
  const iDag = new Date().toISOString().slice(0,10);
  const medDato = s.arytmer.filter(a=>a.dato).sort((a,b)=>a.dato<b.dato?-1:1);
  return medDato.find(a=>a.dato >= iDag) || medDato[medDato.length-1] || s.arytmer[0];
}
/* Peger aktivId ikke på noget, falder appen tilbage på den næstkommende tur.
   Det er dét, der gør, at forsiden viser næste tur, når man har gemt den, man
   sad med (OD 31/8: "Headeren skal stadig vise den næstkommende tur"). */
function sikrAktivTur(){
  if(s.aktivId && s.arytmer.some(a=>a.id===s.aktivId)) return;
  const n = næsteArytme();
  s.aktivId = n ? n.id : null;
}
function vælgTur(id){
  if(!s.arytmer.some(a=>a.id===id)) return;
  s.aktivId = id; gem(); nulstilHistorik();
  // Afgangskortet hører til den tur, man stod på — ikke den næste (KN 6/9)
  startTurÅben = false;
}
/* ---------- hvis er hvad (fase 3, 11/9) ----------

   Fra migration 0012 kan en fast rejsemakkers rækker komme med ned. De
   ligger i de samme lister som ens egne, og indtil nu stod der ingen
   steder, hvis de var.

   `s.fremmed` sættes af sync.js ved hver hentning og synkroniseres
   ALDRIG tilbage — den er serverens svar på "hvad kom med ned", ikke
   noget brugeren ejer. Er feltet der ikke (en gammel tilstand, eller en
   telefon der aldrig har hentet), er alt ens eget. Det er den rigtige vej
   rundt: appen opfører sig som før i stedet for pludselig at kalde alt
   fremmed. */
function fremmedRække(tabel, id){
  return !!(s.fremmed && s.fremmed[tabel] && s.fremmed[tabel][id]);
}
function partnerNavn(){
  const pa = s.profil && s.profil.partner;
  return (pa && pa.status === 'aktiv' && pa.navn) ? pa.navn : 'Din rejsemakker';
}
/* Mærkatet genbruger .ejer-mærkat.deres fra gæstefunktionen. Kun det
   FREMMEDE mærkes: ens egne ture skal ikke bære en etiket for at være
   normale. */
function deresMærkat(tabel, id){
  if(!fremmedRække(tabel, id)) return '';
  return `<span class="ejer-mærkat deres">${esc(partnerNavn().split(' ')[0])}</span>`;
}

/* Fjerner turen for altid. Bruges både når en kladde smides væk, når man
   annullerer, og når man kører af sted (så er den ikke længere kommende).

   RØRER IKKE EN REJSEMAKKERS TUR. Politikken siger "kun ejeren sletter",
   og RLS FILTRERER — den afviser ikke. Serveren ville altså slette nul
   rækker og svare pænt, udbakken ville tømmes, og turen ville stå der
   igen efter næste hentning. Det ser ud som en fejl i appen. Bedre at
   sige nej her, hvor vi ved hvorfor. Returnerer, om turen faktisk gik. */
function sletTur(id){
  if(fremmedRække('ture', id)) return false;
  const i = s.arytmer.findIndex(a=>a.id===id);
  if(i<0) return false;
  s.arytmer.splice(i,1);
  if(s.aktivId === id) s.aktivId = null;
  gem();
  return true;
}
/* ---------- hjælpere ---------- */
const $ = id => document.getElementById(id);
/* esc() — den ENE vej fra data til HTML.
   ⚠️ RETTET 18/9, og fejlen er værd at kende, for den så ud som om den virkede.

   Den gamle udgave var `d.textContent = t; return d.innerHTML`. Den escaper
   & < > — det er alt, serialiseringen af en tekstnode gør. Den escaper IKKE
   " og '. Kommentaren nedenfor lovede, at esc() var nok i et attribut. Det
   var den ikke: `" onfocus="..."` bryder ud af value="..." uden at bruge et
   eneste < eller >. Og esc() sidder ~25 steder i et "-afgrænset attribut:
   mail, navn, adressesøgning, gæstens navn og telefon, partnerens nummer.

   De fleste af dem er selv-XSS. Ét er ikke: destinationsnavnet i et
   aria-label (se sletaria længere nede) kan komme fra adresseregistrets
   svar og følger med turen over til rejsemakkeren. rens() i sync.js fjerner
   < og >, men ikke anførselstegn — så den vej gik udenom begge værn.

   Derfor gøres det nu i hånden og i den rigtige rækkefølge: & FØRST, ellers
   escaper man sine egne escapes om igen.

   `t || ''` er bevaret fra den gamle udgave med vilje: 0 og false blev til
   tom streng dér, og en sikkerhedsrettelse skal ikke samtidig ændre, hvad
   der står på skærmen. */
function esc(t){
  return String(t || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* =============================================================
   TEKSTLAGET — t()
   =============================================================
   Fase 4B, trin 1. Kravet er, at ENHVER tekst i appen skal kunne rettes,
   uden at der udgives en ny app-version. Det begynder her.

   FALDBAKKEN ER TEKSTEN, DER STÅR I KODEN — og det er hele trygheden ved
   det her greb:

       t('hvorfra.spm', 'Hvor starter I fra?')

   Er bundtet ikke hentet endnu, er nøglen aldrig blevet udgivet, eller er
   den slettet igen, så står der præcis det, der stod før. Der findes ingen
   tilstand, hvor en skærm bliver tom, fordi serveren var langsom eller
   nogen kom til at rydde en række. Appen virker uden netværk, uden bundt
   og uden database — som den altid har gjort.

   PLADSHOLDERE skrives med tuborgparenteser:

       t('hvorlangt.fra', 'kørsel fra {sted}', {sted: f.startNavn})

   VÆRDIERNE ESCAPES, teksten gør ikke. Forskellen er med vilje:
     · Værdier kommer tit fra brugeren selv — et stednavn, en rejsemakkers
       navn. De skal ALDRIG kunne blive til HTML.
     · Teksten skrives af en administrator gennem admin-fladen og er prosa.
       Escapede vi den, kunne der ikke stå « og — uden at det så forkert ud.
   Skal en tekst ind i et HTML-ATTRIBUT, så pak den ind: esc(t(...)).
   Attributter tåler ikke et anførselstegn, uanset hvem der skrev det —
   og esc() håndterer dem faktisk siden 18/9. Indtil da gjorde den ikke,
   og det er værd at læse begrundelsen over esc(), før nogen "forenkler"
   den tilbage til textContent/innerHTML igen.

   NØGLERNE er `skærm.element`, små bogstaver, kun ASCII. Samme regel som
   kolonnenavnene i databasen, og af samme grund.

   Bundtet lægges ind med `saetTekster()`, når udgivelsen findes. Indtil da
   er TEKSTER tom, og alt kører på faldbakkerne. */
const TEKSTER = Object.create(null);

/* EDITOR-TILSTANDEN (5/10). For en kunde er begge null, og t() gør
   præcis det samme som før. For en admin med editoren slået til er
   RED_TEKSTER arbejdsbordet (indhold_tekst, også det ikke-udgivne), og
   RED_SETE husker hver nøgle, skærmen har brugt — så "Ret tekst" kan finde
   den tekst, hun trykker på. Se redaktør-afsnittet længere nede. */
let RED_TEKSTER = null;
let RED_SETE = null;
/* Listerne som tekstnøgler (5/10) — sættes, når listerne er defineret
   længere nede. Står HER, fordi saetIndhold() kører ved indlæsning, før
   linjen dernede er nået; en `let` dér ville kaste. */
let TEKSTLISTER = null, TEKSTLISTE_KODE = null;

function t(noegle, faldbak, vaerdier){
  const udgivet = TEKSTER[noegle];
  let tekst = (typeof udgivet === 'string' && udgivet !== '') ? udgivet : faldbak;
  if(RED_TEKSTER && RED_TEKSTER[noegle]){
    const r = RED_TEKSTER[noegle].tekst;
    tekst = (typeof r === 'string' && r !== '') ? r : faldbak;
  }
  const rå = tekst;
  if(vaerdier){
    for(const navn in vaerdier){
      tekst = tekst.split('{'+navn+'}').join(esc(String(vaerdier[navn] ?? '')));
    }
  }
  if(RED_SETE) RED_SETE.set(noegle, { faldbak, rå, vist: tekst });
  return tekst;
}

/* Lægger et udgivet bundt ind. Kaldes, når bundtet er hentet — og kan
   kaldes igen, når en ny version kommer, uden at appen skal genstarte.
   Kun strenge tages imod: en nøgle, der ved et uheld er blevet et tal
   eller et objekt, skal falde tilbage til koden frem for at vise
   "[object Object]" på en skærm. */
function saetTekster(bundt){
  if(!bundt || typeof bundt !== 'object') return 0;
  let lagt = 0;
  for(const noegle in bundt){
    if(typeof bundt[noegle] === 'string'){ TEKSTER[noegle] = bundt[noegle]; lagt++; }
  }
  return lagt;
}

/* ---------- TURENE FRA BUNDTET ----------

   `TESTEDE` ovenfor er FALDBAKKEN, præcis som teksten i `t()`. Bundtet
   lægger sig ovenpå: en række med et kendt id retter den tur, en række
   med et nyt id kommer til, og en tur, der ikke er i bundtet, er taget ud
   i bagrummet og forsvinder herfra.

   Ingen bundt, intet net, ingen database → de nitten står der stadig.
   **Der findes ingen tilstand, hvor appen ikke har nogen steder at køre
   hen.**

   FELTERNE SKRIVES ÉT AD GANGEN og ikke med Object.assign. To grunde, og
   den anden er den vigtige:

     · Bundtet bruger databasens navne (`fac_toilet`), appen sine egne
       (`faciliteter.toilet`). Oversættelsen skal stå ét sted.
     · Et Object.assign ville lade HVAD SOM HELST i bundtet lande på
       objektet — også `x` og `y`, som udledes af lat/lon længere nede og
       aldrig må sættes udefra. En tur ville stå på listen og ét andet
       sted på kortet, og ingen ville kunne se hvorfor. */
function turFraBundt(r, gammel){
  const t = gammel || { id: r.id };
  t.navn        = String(r.navn || '');
  t.ord         = String(r.ord || '');
  t.kort        = String(r.kort || '');
  t.beskrivelse = String(r.beskrivelse || '');
  t.faciliteter = {
    toilet:    String(r.fac_toilet || ''),
    handel:    String(r.fac_handel || ''),
    aftensmad: String(r.fac_aftensmad || ''),
    morgen:    String(r.fac_morgen || '')
  };
  t.lat  = (typeof r.lat === 'number') ? r.lat : null;
  t.lon  = (typeof r.lon === 'number') ? r.lon : null;
  t.klar = !!r.klar;
  t.billeder = Array.isArray(r.billeder) ? r.billeder.slice() : [];

  /* Jeres egen vurdering (KN 24/9, 0041). Stjernerne kun, når de er sat og
     giver mening: et sted uden vurdering har ingen stjerner, ikke nul. */
  t.anbefalet = !!r.anbefalet;
  const n = Number(r.stjerner);
  t.stjerner = (Number.isInteger(n) && n >= 1 && n <= 5) ? n : null;
  // Fluebenet fra bagrummet (KN 24/9, 0042). Uden flueben siges intet.
  t.godTilBørn = !!r.god_til_boern;
  // Adressen til GPS'en (KN 5/10, 0047). Tom = ikke skrevet; så står kun tallene.
  t.adresse = String(r.adresse || '');

  /* Ønskerne kun, hvis der ER nogen. Et sted uden ønsker er ikke
     kategoriseret, og `ønskePasser()` læser det som "begge" på lys og
     natur (KN 24/9) — så objektet behøver ikke findes for at det virker. */
  if(r.oe_lys || r.oe_natur || r.oe_stemning){
    t.ønsker = { lys:String(r.oe_lys||''), natur:String(r.oe_natur||''), stemning:String(r.oe_stemning||'') };
  } else {
    delete t.ønsker;
  }
  return t;
}

/* Lægger bundtets ture ind. Returnerer antallet — 0 betyder "rør ikke
   noget", og det er med vilje: et tomt bundt skal ikke kunne tømme
   kortet. Serveren afviser også at udgive nul ture, men appen skal ikke
   stå og regne med, at den anden ende opfører sig ordentligt. */
function saetTure(liste){
  if(!Array.isArray(liste) || !liste.length) return 0;

  const beholdt = [];
  for(const r of liste){
    if(!r || typeof r.id !== 'string' || !r.id) continue;
    if(r.lat == null || r.lon == null) continue;   // kan ikke placeres på kortet
    beholdt.push(turFraBundt(r, TESTEDE.find(x => x.id === r.id)));
  }
  if(!beholdt.length) return 0;

  TESTEDE.length = 0;
  TESTEDE.push(...beholdt);

  /* x/y udledes forfra — også for de nye. Uden det ligger en tilføjet tur
     uden for kortet og bliver aldrig fundet af værtsKort(). */
  TESTEDE.forEach(t=>{
    if(t.lat==null || t.lon==null) return;
    const xy = geoTilXY(t.lat, t.lon);
    t.x = xy.x; t.y = xy.y;
  });
  return beholdt.length;
}

/* ---------- KLADDERNE (fase 4A) ----------

   En kladde er en tur i databasen med `synlig = false`. Den er IKKE i det
   udgivne bundt — det er hele meningen — så en almindelig kunde kan aldrig
   se den. En administrator kan, og planen siger hvorfor:

     "Forhåndsvisningen er appen selv. Ingen separat forhåndsvisnings-
      flade, ingen 'sådan ser det nok ud'. Du ser det, brugeren vil se,
      på den telefon brugeren har."

   Rækkerne hentes LIVE, ikke fra bundtet, og de lægges ovenpå — præcis
   som bundtet lægger sig oven på `TESTEDE`. Tre lag, og hvert af dem kan
   falde væk uden at det under ryger med:

     koden (TESTEDE)  ->  det udgivne bundt  ->  kladderne, kun for admin

   DE SYNLIGE RÆKKER FLETTES OGSÅ. Det ser ud som en overflødighed — de
   står jo i bundtet — men det er den anden halvdel af det samme løfte: har
   OD rettet en beskrivelse og ikke udgivet endnu, skal hun kunne se
   rettelsen i appen. Ellers ville "vis kladder" kun vise nye steder og
   ikke nye ord. */
let KLADDE_RAEKKER = null;   // sidste svar fra databasen. null = vi ved det ikke.

function erAdmin(){ return !!(s.profil && s.profil.rolle === 'admin'); }
/* Editor-tilstanden viser altid kladderne (5/10) — den afløste kontakten. */
function kladderØnskes(){ return !!(s.profil && (s.profil.viskladder || s.profil.editor)); }

/* Lægger de hentede rækker oven på TESTEDE. Kaldes både når rækkerne
   kommer hjem, og hver gang et bundt har skrevet TESTEDE om — ellers
   ville næste hentning af bundtet tørre kladderne af igen. */
function anvendKladder(){
  if(!KLADDE_RAEKKER || !kladderØnskes() || !erAdmin()) return 0;
  let n = 0;
  for(const r of KLADDE_RAEKKER){
    if(!r || typeof r.id !== 'string' || !r.id) continue;
    if(r.lat == null || r.lon == null) continue;   // kan ikke placeres på kortet
    const gammel = TESTEDE.find(x => x.id === r.id);
    const t = turFraBundt(r, gammel);
    /* Mærket sidder på turen, ikke i en liste ved siden af. Så kan enhver
       skærm, der tegner en tur, sige det højt uden at slå op. */
    t.kladde = (r.synlig === false);
    if(t.kladde) n++;
    const xy = geoTilXY(t.lat, t.lon);
    t.x = xy.x; t.y = xy.y;
    if(!gammel) TESTEDE.push(t);
  }
  return n;
}

/* Tager kladderne UD igen uden at hente noget. Bruges når kontakten slås
   fra: det udgivne bundt er stadig i hukommelsen, og det er dét, en kunde
   ser — så vi bygger listen forfra fra det, i stedet for at gætte hvilke
   felter en kladde nåede at overskrive. */
function fjernKladder(){
  KLADDE_RAEKKER = null;

  /* Forfra fra koden, og så det udgivne bundt ovenpå — nøjagtig den stak,
     en kunde ser. Ikke "fjern det, jeg kan huske at have tilføjet": en
     kladde kan også have OVERSKREVET felter på et sted, der findes i
     forvejen, og de skal også tilbage. */
  TESTEDE.length = 0;
  TESTEDE.push(...JSON.parse(JSON.stringify(TESTEDE_KODE)));
  TESTEDE.forEach(t => {
    if(t.lat==null || t.lon==null) return;
    const xy = geoTilXY(t.lat, t.lon);
    t.x = xy.x; t.y = xy.y;
  });

  /* INDHOLD_GEMT erklæres længere nede i filen. Den læses først, når det
     her KALDES, og da er hele filen kørt igennem — derfor er den const
     ikke i vejen. */
  let gemt = null;
  try{ gemt = JSON.parse(localStorage.getItem(INDHOLD_GEMT) || 'null'); }catch(e){}
  if(gemt) saetIndhold(gemt);
}

async function opdaterKladder(){
  if(!erAdmin() || !kladderØnskes()){ return 0; }
  if(!window.ArytmiSync || !ArytmiSync.hentKladder) return 0;
  const raekker = await ArytmiSync.hentKladder();
  if(raekker == null) return 0;          // null = vi ved det ikke. Rør intet.
  KLADDE_RAEKKER = raekker;
  return anvendKladder();
}

/* Ét bundt ind. `udgave` står i filen, så formen ikke skal gættes.
   Udgave 1 var et fladt kort af tekster og nåede aldrig ud til en telefon
   — den håndteres alligevel, fordi en fil, der ligger i Storage, kan blive
   hentet længe efter, nogen troede den var væk. */
function saetIndhold(bundt){
  if(!bundt || typeof bundt !== 'object') return { tekster:0, ture:0 };
  if(bundt.udgave >= 2 || bundt.tekster || bundt.ture){
    const ud = { tekster: saetTekster(bundt.tekster), ture: saetTure(bundt.ture) };
    anvendListeTekster();   // tilføjede/skjulte listepunkter følger bundtet (5/10)
    /* Bundtet har lige skrevet TESTEDE om. Kladderne skal ovenpå igen,
       ellers forsvandt de i det øjeblik, en ny udgivelse blev hentet. */
    anvendKladder();
    return ud;
  }
  return { tekster: saetTekster(bundt), ture: 0 };
}

/* ---------- HENTNINGEN ----------

   Bundtet ligger som en almindelig, offentlig JSON-fil i Storage. Ikke bag
   et login, ikke gennem PostgREST: indholdet SKAL kunne hentes af en, der
   ikke er logget ind endnu, for den allerførste skærm, en ny kunde ser, er
   login-skærmen.

   TRE TING ER VALGT MED VILJE:

   1. DET GEMTE BUNDT LÆGGES IND FØRST, og det sker synkront. En bil på vej
      mod Mols har ikke net, og appen må ikke vente på en forespørgsel, der
      alligevel ikke kommer igennem. Er der intet gemt, står faldbakkerne i
      koden — teksterne OG de nitten ture.

   2. HENTNINGEN BLOKERER INTET. Den løber ved siden af, og lykkes den med
      noget NYT, tegnes skærmen om. Lykkes den ikke, sker der ingenting.
      Det er hele håndteringen, og det er nok: en fejl her betyder, at
      kunden ser det, der står i koden. Det er ikke en fejltilstand, det er
      udgangspunktet.

   3. DER TEGNES KUN OM, HVIS NOGET FAKTISK ÆNDREDE SIG. Ellers ville hver
      eneste appstart give et gratis gentegn — og på en skærm midt i en
      indtastning ville det være synligt.

   Filen svares med 60 sekunders cache fra Storage. Det er langt nok til, at
   appen ikke henter den ved hvert skærmskift, og kort nok til, at en
   rettelse er ude, mens den, der lavede den, stadig sidder og kigger. */
const INDHOLD_GEMT = 'arytmi-indhold';
const INDHOLD_URL = 'https://vxleyvtumbwtkejoiaev.supabase.co'
                  + '/storage/v1/object/public/indhold/tekster/seneste.json';

(function hentIndholdet(){
  let gammelt = '';
  try{
    gammelt = localStorage.getItem(INDHOLD_GEMT) || '';
    if(gammelt) saetIndhold(JSON.parse(gammelt));
  }catch(e){ /* ulæseligt gemt bundt: det, der står i koden, gælder */ }

  if(typeof fetch !== 'function') return;

  fetch(INDHOLD_URL, { cache: 'no-cache' })
    .then(r => r.ok ? r.text() : null)
    .then(raat => {
      if(!raat || raat === gammelt) return;
      const lagt = saetIndhold(JSON.parse(raat));
      if(!lagt.tekster && !lagt.ture) return;
      try{ localStorage.setItem(INDHOLD_GEMT, raat); }catch(e){}
      /* Skærmen kan nå at blive tegnet, før filen er hentet. Findes tegn()
         ikke endnu, er vi stadig i indlæsningen, og den tegner selv bagefter. */
      if(typeof tegn === 'function') tegn();
    })
    .catch(() => { /* intet net, eller intet udgivet endnu. Begge dele er fine. */ });
})();
function flash(tekst, ikon){
  const f = $('flash');
  f.innerHTML = ik(ikon||'gnist') + `<span>${tekst}</span>`;
  f.classList.add('vis');
  clearTimeout(f._t); f._t = setTimeout(()=>f.classList.remove('vis'), 3000);
}
/* Egen bekræftelsesboks — window.confirm() kan blive blokeret i indlejrede
   previews (fx iframes/webviews), og ser under alle omstændigheder ikke ud
   som resten af appen. */
function bekræft(spørgsmål, handling){
  const gammel = document.getElementById('bekræft-modal');
  if(gammel) gammel.remove();
  const div = document.createElement('div');
  div.id = 'bekræft-modal';
  div.className = 'modal-bag';
  div.innerHTML = `
    <div class="modal-kort">
      <p>${spørgsmål}</p>
      <div class="modal-knapper">
        <button class="knap kontur bred" id="bekræft-nej">${t('faelles.fortryd','Fortryd')}</button>
        <button class="knap primær bred" id="bekræft-ja">${t('faelles.jagoerdet','Ja, gør det')}</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  div.addEventListener('click', e=>{ if(e.target===div) div.remove(); });
  document.getElementById('bekræft-nej').onclick = () => div.remove();
  document.getElementById('bekræft-ja').onclick = () => { div.remove(); handling(); };
}
/* Informativ pop-up med kun én knap — til beskeder der ikke kræver et valg,
   fx "invitation sendt". Samme visuelle sprog som bekræft(), men uden Fortryd. */
function infoModal(tekst, knapTekst){
  const gammel = document.getElementById('info-modal');
  if(gammel) gammel.remove();
  const div = document.createElement('div');
  div.id = 'info-modal';
  div.className = 'modal-bag';
  div.innerHTML = `
    <div class="modal-kort">
      <p>${tekst}</p>
      <div class="modal-knapper">
        <button class="knap primær bred" id="info-modal-luk">${knapTekst||'Okay'}</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  div.addEventListener('click', e=>{ if(e.target===div) div.remove(); });
  document.getElementById('info-modal-luk').onclick = () => div.remove();
}
/* Modal med to veje videre (OD 31/8). infoModal har én knap og siger "det her
   skete"; den her spørger "hvad vil du så?". Sekundær til venstre, primær til
   højre — samme rækkefølge som bekræft(), så knapperne står, hvor de plejer.
   Bemærk: pop-uppernes "Til overblik" bliver stående, selvom den faste
   Til overblik-knap er fjernet fra siderne (E2). Det er to forskellige ting —
   den ene var en genvej, der fulgte med overalt, den her er et svar på et
   spørgsmål, appen lige har stillet. */
function valgModal(tekst, valg){
  const gammel = document.getElementById('valg-modal');
  if(gammel) gammel.remove();
  const div = document.createElement('div');
  div.id = 'valg-modal';
  div.className = 'modal-bag';
  div.innerHTML = `
    <div class="modal-kort">
      <p>${tekst}</p>
      <div class="modal-knapper">
        ${valg.map((v,i)=>`<button class="knap ${v.primær?'primær':'kontur'} bred" data-i="${i}">${v.tekst}</button>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(div);
  div.addEventListener('click', e=>{
    if(e.target===div){ div.remove(); return; }
    const b = e.target.closest('button[data-i]');
    if(!b) return;
    div.remove();
    const v = valg[+b.dataset.i];
    if(v && v.aktion) v.aktion();
  });
}
/* Køb-knapperne linker senere til den rigtige salgsfunnel — i prototypen er det et stub. */
function gåTilKøb(){
  flash('Kommer snart — her lander I i købsflowet.', 'kurv');
}
const MDR = ['januar','februar','marts','april','maj','juni','juli','august','september','oktober','november','december'];
const DAGE = ['søndag','mandag','tirsdag','onsdag','torsdag','fredag','lørdag'];
function pænDato(iso){
  if(!iso) return '';
  const d = new Date(iso+'T12:00:00');
  return `${DAGE[d.getDay()]} d. ${d.getDate()}. ${MDR[d.getMonth()]}`;
}

/* ---------- geometri: kort ↔ geografi ---------- */
const GEO = { latTop:57.9, latBund:54.4, lonV:7.9, lonØ:12.9, b:210, h:244 };
function xyTilGeo(x,y){
  return { lat: GEO.latTop-(y/GEO.h)*(GEO.latTop-GEO.latBund),
           lon: GEO.lonV+(x/GEO.b)*(GEO.lonØ-GEO.lonV) };
}
function geoTilXY(lat,lon){
  const x = (lon-GEO.lonV)/(GEO.lonØ-GEO.lonV)*GEO.b;
  const y = (GEO.latTop-lat)/(GEO.latTop-GEO.latBund)*GEO.h;
  return { x: Math.max(8,Math.min(202,x)), y: Math.max(10,Math.min(236,y)) };
}
/* x/y for et testet sted skrives ALDRIG i hånden — det udledes her af lat/lon,
   så de to felter ikke kan komme ud af sync. Det gjorde de: t1 stod med x:44,
   som er Hvide Sandes plads på det gamle stiliserede kort (den gamle
   BYER-liste, væk 17/9 — se noten i toppen af filen), mens
   geoTilXY giver x≈9. De 35 enheders forskel er langt over grænsen på 16 i
   værtsKort(), så faciliteterne dukkede aldrig op, når man satte sin pin på
   det rigtige Hvide Sande. Alle testede steder har nu lat/lon, så x/y
   udledes for dem alle. */
TESTEDE.forEach(t=>{
  if(t.lat==null || t.lon==null) return;
  const xy = geoTilXY(t.lat, t.lon);
  t.x = xy.x; t.y = xy.y;
});

/* Fugleflugt i km mellem to {lat,lon} — bruges til at måle testede steder
   op mod den radius, brugeren valgte i trin 3. */
function afstandKm(a, b){
  const rad = Math.PI/180, R = 6371;
  const dLat = (b.lat-a.lat)*rad, dLon = (b.lon-a.lon)*rad;
  const h = Math.sin(dLat/2)**2 + Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
/* Geo for et testet sted — rigtige koordinater hvis vi har dem, ellers
   den omtrentlige omregning fra kortets x/y (gælder t2-t10, se status). */
function testetGeo(t){
  return (t.lat!=null && t.lon!=null) ? { lat:t.lat, lon:t.lon } : xyTilGeo(t.x, t.y);
}
function startGeo(){
  const f = s.forberedelse;
  if(!f || !f.startXY) return null;
  return xyTilGeo(f.startXY.x, f.startXY.y);
}
/* De nærmeste andre testede steder til ET GIVENT sted (ikke fra brugerens
   startpunkt) — en plan B, hvis stedet man kigger på er optaget, eller man
   bare ikke er til det. Ingen afstandsgrænse: selv et isoleret sted som
   Hvide Sande skal vise sin nærmeste nabo, bare ærligt mærket med km. */
function stederINærheden(t, antal=3){
  const geo = testetGeo(t);
  return TESTEDE.filter(x=>x.id!==t.id)
    .map(x=>({ t:x, km: afstandKm(geo, testetGeo(x)) }))
    .sort((a,b)=>a.km-b.km)
    .slice(0,antal);
}

/* ---------- ægte solnedgangsberegning (NOAA-forenklet) ---------- */
function solnedgang(lat, lon, dato){
  // Bevar den eksisterende kalder, inklusive afrunding til hele UTC-minutter.
  return soltid(lat, lon, dato);
}
function soltid(lat, lon, dato, opgang=false, zenit=90.833){
  const rad = Math.PI/180;
  const start = new Date(Date.UTC(dato.getFullYear(),0,0));
  const dag = Math.floor((Date.UTC(dato.getFullYear(),dato.getMonth(),dato.getDate()) - start.getTime())/86400000);
  const lngHour = lon/15;
  const t = dag + (((opgang?6:18)-lngHour)/24);
  const M = (0.9856*t) - 3.289;
  let L = M + (1.916*Math.sin(M*rad)) + (0.020*Math.sin(2*M*rad)) + 282.634;
  L = (L%360+360)%360;
  let RA = Math.atan(0.91764*Math.tan(L*rad))/rad;
  RA = (RA%360+360)%360;
  RA = (RA + (Math.floor(L/90)*90 - Math.floor(RA/90)*90))/15;
  const sinDec = 0.39782*Math.sin(L*rad);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.cos(zenit*rad)-(sinDec*Math.sin(lat*rad)))/(cosDec*Math.cos(lat*rad));
  if(cosH>1 || cosH<-1) return null;   // midnatssol/polarnat — ikke i DK
  const vinkel = Math.acos(cosH)/rad;
  const H = (opgang ? 360-vinkel : vinkel)/15;
  const T = H + RA - (0.06571*t) - 6.622;
  let UT = (T - lngHour)%24; if(UT<0) UT += 24;
  const res = new Date(Date.UTC(dato.getFullYear(),dato.getMonth(),dato.getDate()));
  res.setUTCMinutes(Math.round(UT*60));
  return res;
}
/* ---------- DØGNETS LYS PÅ HEROEN (KN 17/9) ----------

   "Ift. spørgsmålet om solopgang og nedgang synes jeg du skal finde en
   flot plads til det under datoen på heroscenen."

   Den stod før inde i "Den gode vært siger" — et kort med otte linjer,
   hvor de fire var hentet fra et ANDET sted op til 24 km væk, og to var
   opdigtet vejr. Kortet er væk. Solen er den ene linje, der var ægte hele
   vejen: den regnes ud af stedets rigtige lat/lon og turens dato, og den
   er også den eneste af de otte, man faktisk planlægger efter.

   Så den flytter derhen, hvor man kigger i forvejen — under datoen,
   sammen med stedet og nedtællingen. Tre linjer, der alle svarer på det
   samme: hvornår, hvor, og hvor lang tid er der lys.

   ⚠️ KRÆVER RIGTIGE lat/lon. Har destinationen kun x/y — en pin på
   kortet — er der ingen linje. Det er med vilje: et klokkeslæt, der er
   regnet på et omtrentligt punkt, ser lige så rigtigt ud som et, der ikke
   er, og solnedgangen er noget, folk kører efter. Siden byerne fik rigtige
   koordinater (`byer.js`), er det kun pinnen, der mangler dem. */
function solLinje(f){
  const dest = f && f.destination;
  if(!dest) return '';
  if(!Number.isFinite(dest.lat) || !Number.isFinite(dest.lon)) return '';
  /* Middag på turens dato. Beregnes tidspunktet ud fra "nu", skifter
     solnedgangen, alt efter hvornår på dagen man kigger — og så er det
     ikke turens solnedgang længere. */
  const dag = f.dato ? new Date(f.dato+'T12:00:00') : new Date();
  const op = soltid(dest.lat, dest.lon, dag, true);
  const ned = soltid(dest.lat, dest.lon, dag, false);
  if(!op || !ned) return '';
  const kl = d => d.toLocaleTimeString('da-DK',{hour:'2-digit',minute:'2-digit'});
  const timer = Math.round((ned - op)/3600000*10)/10;
  /* ⚠️ INGEN KASSE. Første udgave var en pille med ramme, baggrund og
     blur — og den var det eneste indrammede i en hero, der ellers kun er
     tekst på et landskab. Kennet så det med det samme: "nu bliver det
     hele ret rodet".

     Nu er linjen bygget som datoens lillesøster: samme størrelse, samme
     dæmpede farve, kun ikonet i kobber. Tanken er, at de tre linjer —
     sted, dato, lys — skal læses som ÉT svar på "hvornår og hvor", ikke
     som tre ting, der tilfældigvis står under hinanden.

     Tankestregen mellem tiderne er med vilje: "07.10 – 19.12" er et
     SPAND, og det er dét, man planlægger efter. "op" og "ned" var to ord,
     der forklarede noget, en streg siger bedre. */
  return `<div class="ned-sol">${ik('sol')}<span>${
    t('hjem.sollys','{op} – {ned}',{op:kl(op),ned:kl(ned)})
  }</span><span class="ned-sol-lys">${
    t('hjem.soltimer','{timer} timers lys',{timer:String(timer).replace('.',',')})
  }</span></div>`;
}
function årstid(dato=new Date()){
  const m = dato.getMonth();
  return m>=2&&m<=4 ? 'forår' : m>=5&&m<=7 ? 'sommer' : m>=8&&m<=10 ? 'efterår' : 'vinter';
}
/* ---------- årstiden i landskabet (13/8) ----------
   Landskabet kendte kun tidspunktet på dagen. Nu kender det også årstiden.

   VIGTIGT for vedligehold: det er bygget som en JUSTERING af de fem palletter,
   der allerede findes — ikke som nye palletter. Fire årstider × fem palletter
   ville være tyve håndholdte farvesæt, og så er der ingen, der holder dem ved lige.
   Her er der stadig fem sæt farver og fire tal at skrue på. */
const ÅRSTIDSSKIFT = {
  // mæt = mætning ganges, lys = lysstyrke lægges til, kulør = graders drejning
  vinter:  { mæt:.50, lys:+.035, kulør:+8 },   // kold og udvasket, lidt lysere
  forår:   { mæt:.95, lys:+.020, kulør:+10 },  // en anelse grønnere
  sommer:  { mæt:1.15, lys:0,    kulør:-3 },   // fyldigst — sådan ser appen ud i dag
  efterår: { mæt:1.20, lys:-.010, kulør:-10 }  // mod rav og kobber
};
function hexTilHsl(h){
  const r=parseInt(h.slice(1,3),16)/255, g=parseInt(h.slice(3,5),16)/255, b=parseInt(h.slice(5,7),16)/255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2;
  if(mx===mn) return [0,0,l];
  const d=mx-mn, s=l>.5 ? d/(2-mx-mn) : d/(mx+mn);
  const hh = mx===r ? ((g-b)/d+(g<b?6:0)) : mx===g ? ((b-r)/d+2) : ((r-g)/d+4);
  return [hh*60, s, l];
}
function hslTilHex(hu,s,l){
  hu=((hu%360)+360)%360; s=Math.min(1,Math.max(0,s)); l=Math.min(1,Math.max(0,l));
  const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((hu/60)%2-1)), m=l-c/2;
  const [r,g,b] = hu<60?[c,x,0]:hu<120?[x,c,0]:hu<180?[0,c,x]:hu<240?[0,x,c]:hu<300?[x,0,c]:[c,0,x];
  return '#'+[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');
}
function årstidsFarve(hex, skift){
  const [h,s,l] = hexTilHsl(hex);
  return hslTilHex(h + skift.kulør, s * skift.mæt, l + skift.lys);
}
function årstidsPalet(p, sæson){
  const skift = ÅRSTIDSSKIFT[sæson];
  if(!skift) return p;
  return {
    sky: p.sky.map(f=>årstidsFarve(f, skift)),
    sol: årstidsFarve(p.sol, { ...skift, mæt:Math.min(skift.mæt,1.05) }), // solen må ikke blive skinger
    b1: årstidsFarve(p.b1, skift), b2: årstidsFarve(p.b2, skift), b3: årstidsFarve(p.b3, skift)
  };
}
/* demo-vejr — deterministisk ud fra sted+dag, så det føles stabilt */
function demoVejr(x,y){
  const d = new Date();
  const seed = Math.abs(Math.round(x*7+y*13+d.getDate()*3)) % 10;
  const basis = [3,3,6,10,14,17,19,19,15,11,7,4][d.getMonth()];
  const temp = basis + (seed%5) - 1;
  const himmel = ['Skyfrit','Delvist skyfrit','Let skyet','Klart'][seed%4];
  const stjerneTime = 22 + (seed%2);
  return { temp, himmel, stjerneTime };
}

/* =============================================================
   FREMDRIFT — "5 ud af 16 mangler"
   ============================================================= */
function nyForberedelse(ekstra){
  return Object.assign({
    fase:1, spontan:false,
    // Standard: i dag kl. 15 — de fleste arytmer bliver til samme dag, og
    // eftermiddagen er det tidspunkt, man reelt kommer afsted på.
    /* Klokkeslæt er VALGFRIT, men forudindstillet (OD 31/8): kl. 16 på
       afgangsdagen, kl. 13 på hjemkomsten. Tømmer man feltet, står der
       ingenting på turplanen. */
    /* Hjem DAGEN EFTER (KN 5/10). Før stod hjemkomsten på samme dag kl. 13 —
       tre timer før afrejsen kl. 16. En arytme er en nat i bilen. */
    dato:new Date().toISOString().slice(0,10), afgangstid:'16:00',
    /* Ingen fast returDato: 'næste' regnes ud fra afrejsen (turDatoer), så
       hjemkomsten følger med, når afrejsen flyttes. En fast dato blev
       hængende og kunne lande FØR en senere afrejse. */
    retur:'næste', returDato:null, returtid:'13:00',
    startNavn:'', startXY:null, radius:2, oplevelser:{lys:null, natur:null, stemning:null},
    destination:null,
    /* brugValg (30/8): de enkelte ting fra et madscenaries "Det skal I bruge".
       Erstatter udstyrValg, som hørte til de slettede udstyrs-trin. */
    /* brugSet: hvilke scenarier der har fået deres punkter forvalgt (31/8).
       Uden den ville et scenarie, hvor man bevidst har fjernet alt, blive
       fyldt op igen, hver gang siden tegnes. */
    madValg:[], snackValg:[], morgenValg:[], brugValg:[], brugSet:[],
    invType:null, invModtager:'', invAfsender:'', invStatus:null,
    invForslag:[], invForslagFra:null, invEnigDato:null,
    /* ---- gæsten på DENNE tur (KN 6/9) ----
       En ven, der inviteres med på én arytme — til forskel fra profilens faste
       partner, der har adgang til alt. ven.status: 'afventer' (SMS sendt) →
       'accepteret'. venFordeling er et opslag punkt-id → 'min' | 'deres' |
       'fælles': hvem der har ansvaret for at pakke hvad. Punkter uden svar
       er 'min' — man pakker selv, indtil man aktivt giver noget videre. */
    ven:null, venFordeling:{},
    /* egnePunkter er væk fra turen (14/8) — egne punkter bor i s.egneTing og
       huskes på tværs af ture. hundMed er turens eget valg: hunden er ikke
       nødvendigvis med hver gang. Udstyr til bilen er forudvalgt (KN 27/8): man
       skal aktivt fjerne et punkt, hvis det ikke skal med — ikke aktivt
       tilføje det. De to andre bil-trin starter tomme (opt-in). */
    /* privat (KN 15/9, rettet samme dag): "turen man planlægger skal som
       udgangspunkt ikke deles pr automatik med partner - man skal aktivt
       dele den."

       Standarden er derfor LUKKET. Det er den rigtige vej for en
       indstilling om privatliv: den skal fejle lukket, ikke åbent. Glemmer
       nogen at sætte feltet — en gammel tur, en fremtidig kodesti — bliver
       resultatet "kun mig", ikke "delt med en anden".

       Databasen læser en MANGLENDE værdi på samme måde (0031), så de to
       ender er enige. Det er de nødt til: appen bestemmer, hvad der står i
       `data`, men det er politikken, der afgør, hvem der får rækken. */
    privat:true,
    bilType:null, bilHuske:BILEN_GRUPPER.find(g=>g.id==='need').punkter.filter(p=>p.huske).map(p=>p.id),
    hundMed:false, klarTjek:[], planlagt:false,
    pakkeTjek:[],
    set:{mad:false, bilen:false},
    startet:new Date().toISOString().slice(0,10)
  }, ekstra||{});
}
/* Fremdrift pr. fase: fase 1 = 2 planlægningspunkter, fase 2 = 12 ting at pakke */
function fremdrift(fase){
  const f = s.forberedelse;
  fase = fase || (f ? f.fase||1 : 1);
  if(fase===1){
    const total = SEKTIONER.filter(x=>x.fase===1).length; // 1 — kun destinationen
    if(!f) return { total, klaret:0, mangler:total, pct:0 };
    const klaret = SEKTIONER.filter(x=>x.fase===1 && sektionKlar(x.id)).length;
    return { total, klaret, mangler:total-klaret, pct:Math.round(klaret/total*100) };
  }
  // Fase 2: bilen tæller to svar (hvilken bil + at man har været listerne
  // igennem), pakkelisten tæller sine egne punkter inkl. dem brugeren selv
  // har skrevet.
  const pakkeTotal = pakkePunkter().length;
  const total = 2 + pakkeTotal;
  if(!f) return { total, klaret:0, mangler:total, pct:0 };
  const klaret = (f.bilType?1:0) + (f.set && f.set.bilen ? 1 : 0) + (f.pakkeTjek||[]).length;
  return { total, klaret, mangler:total-klaret, pct:Math.round(klaret/total*100) };
}
/* Bilen er klar, når man har svaret på hvilken bil det er, OG man har været
   de tre udstyrs-trin igennem. Selve punkterne på listerne er huskeliste, ikke
   krav — de må ikke kunne spærre for at komme videre (OD 11/8: punktet blev
   aldrig grønt, fordi det før krævede alle ni ting i Døsige Dølle-tasken).
   Var før bundet til Camp Mode-afkrydsningen; den udgik 30/8, så nu er det
   f.set.bilen, sat når man trykker Færdig på sidste trin — samme mønster som
   f.set.mad. */
function bilenKlar(f){ return !!(f && f.bilType && f.set && f.set.bilen); }
/* Pakkelisten er klar, når alle punkter — inkl. dem man selv har skrevet — er
   krydset af. Forplejningen tæller IKKE med her længere (OD 11/8); den ligger
   på pakkelisten under afgangsdagen. */
/* Egne punkter kommer nu fra s.egneTing (huskes på tværs af ture), ikke fra
   turen. Hunde-punkterne tæller kun med, når man har sagt, at hunden er med. */
function egne(liste){ return (s.egneTing && s.egneTing[liste]) || []; }
function hundMed(){ const f = s.forberedelse; return !!(f && f.hundMed); }
function pakkePunkter(){
  return [...PAKKE_PUNKTER, ...egne('pakke'),
    ...(hundMed() ? [...HUND_PUNKTER, ...egne('hund')] : [])];
}
function sektionKlar(id){
  const f = s.forberedelse; if(!f) return false;
  switch(id){
    case 'destination': return !!f.destination;
    /* 'invitation' er ikke længere en sektion — invErKlar() lever videre,
       men bruges nu kun af turplanen og invitationsskærmen selv. */
    case 'bilen': return bilenKlar(f);
    case 'pakke': return (f.pakkeTjek||[]).length >= pakkePunkter().length;
    default: return !!f.set[id];
  }
}
/* Guidet flow: hver fase er en RÆKKE af sider (destination→mad,
   siden bilen→pakke) i stedet for en oversigt med bokse — man bladrer ligesom i en bog. */
function sektionListe(fase){ return SEKTIONER.filter(x=>x.fase===fase); }
function sektionPos(id){
  const sek = SEKTIONER.find(x=>x.id===id);
  const liste = sektionListe(sek.fase);
  return { sek, liste, idx: liste.findIndex(x=>x.id===id) };
}
/* Hvor brugeren skal lande, når "Fortsæt planen"/"Afslut forberedelsen" trykkes hjemmefra */
function nutidigSektion(){
  if(!s.forberedelse) return sektionListe(1)[0].id;
  const liste = sektionListe(s.forberedelse.fase||1);
  const uafsluttet = liste.find(x=>!sektionKlar(x.id));
  return (uafsluttet || liste[liste.length-1]).id;
}
/* "Til overblik"-knappen er fjernet fra alle sider (OD 31/8). Den stod øverst
   på hvert trin i flowet og gjorde det samme som hus-ikonet i bundnavigationen,
   som ligger der hele tiden. To veje til samme sted, hvoraf den ene flyttede
   sig fra skærm til skærm. Vejen hjem er nu bundnavigationen — ét sted. */
/* Top af hver sektionsside: overskrift som et spørgsmål, og prikker der viser
   hvor i rækken man er. Ingen tilbage-pil her — Tilbage/Næste i bunden
   (sektionFod) er den ene, konsekvente vej at navigere frem og tilbage på. */
/* udenPrikker: Bilen har sine EGNE tre trin og tegner sin egen prikrække. Uden
   det her stod der to prikrækker lige over hinanden på "Er bilen klar?" — to
   fremdriftslinjer, der talte til hver sit 3-tal (sektion 2/3 og biltrin 1/3).
   Sektionsniveauet står allerede i etiketten som tekst; prikkerne på Bilen
   viser trinnet. Én linje, én betydning (KN 6/9). */
function sektionHeader(id, udenPrikker){
  const {sek, liste, idx} = sektionPos(id);
  const F = FASER[sek.fase];
  const prikker = liste.map((x,i)=>`<span class="sek-prik ${i===idx?'aktiv':''} ${sektionKlar(x.id)?'klaret':''}"></span>`).join('');
  return `<div class="trin-top">
    <div class="etiket-række"><div class="etiket">${F.navn} · ${idx+1}/${liste.length}</div></div>
    <h1 style="font-size:22px">${sek.spørg}</h1>
  </div>
  ${udenPrikker ? '' : `<div class="sek-prikker">${prikker}</div>`}`;
}
/* Bund af hver sektionsside: to ens småknapper — Tilbage og Næste — side om
   side, plus Annullér. Ensartet i hele flowet (ingen store "næste"-kort).
   Tilbage følger den ægte historik, ikke rækkefølgen: kommer man ind i
   Forplejningen fra tjeklisten på forsiden, går Tilbage til forsiden.
   næsteOverstyr bruges af Bilen (30/8), som har tre indre trin: dér skal
   Næste gå til næste TRIN, ikke til næste sektion. */
function sektionFod(id, næsteOverstyr){
  const {sek, liste, idx} = sektionPos(id);
  const fald = idx>0 ? liste[idx-1].id : (sek.fase===1 ? 'onsker' : 'hjem');
  const forrigeKnapSmal = `<button class="knap kontur lille fod-tilbage" onclick="tilbage('${fald}')" aria-label="${esc(t('faelles.tilbage','Tilbage'))}">${ik('tilbage')} <span class="fod-ord">${t('faelles.tilbage','Tilbage')}</span></button>`;

  const næste = idx<liste.length-1 ? liste[idx+1] : null;

  // "Næste" = næste sektion. Fase 1 slutter ikke i et valg, men på den rolige
  // afrunding ("En sund forstyrrelse") — den er ikke et punkt, man skal klare.
  // Planlægger man sammen, må man ikke snige sig forbi låsen via Næste-knappen —
  // samme spærring som på tjeklisten på forsiden.
  let næsteLabel, næsteAktion, næsteLåst = false;
  if(næsteOverstyr){ næsteLabel = 'Næste'; næsteAktion = næsteOverstyr; }
  else if(næste){
    næsteLåst = ['mad','bilen','pakke'].includes(næste.id) && afventerFællesPlan(s.forberedelse);
    næsteLabel = 'Næste';
    næsteAktion = næsteLåst ? 'venterPåBekræftelse()' : `gåTil('${næste.id}')`;
  }
  /* Fase 1's knap ("Destination valgt") er væk med destinationsskærmen
     28/9 — sektionFod() kaldes kun for fase 2's sektioner nu. */
  // Sidste trin i fase 2. Planlægger man i skjul, er pakkelisten det sidste,
  // der mangler, før overraskelsen kan sendes — så vejen går tilbage til
  // invitationen med mailen klar, ikke ud af turen (OD 11/8).
  else if(gaveKladde(s.forberedelse)){ næsteLabel = 'Videre til invitationen'; næsteAktion = 'tilInvitationMedMail()'; }
  // Sidste trin i hele planlægningen: "Afslut planlægning", ikke "Planen er
  // klar" (OD 31/8). Fase 1's afrunding hedder stadig det sidste — dér er
  // planen faktisk ikke klar, kun stedet.
  else {                 næsteLabel = 'Afslut planlægning';    næsteAktion = 'planenErKlar()'; }

  /* Står der bare "Næste", er de to knapper lige store — som på Bilens og
     Forplejningens indre trin (OD 5/10: "Er bilen klar?" skilte sig ud).
     Kun et langt ord ("Afslut planlægning") får den smalle Tilbage, ellers
     brækker det over to linjer ved 320 px. */
  const forrigeKnap = næsteLabel === 'Næste' ? forrigeKnapSmal.replace(' fod-tilbage','') : forrigeKnapSmal;
  const næsteKnap = `<button class="knap kontur lille${næsteLåst?' låst':''}" onclick="${næsteAktion}">${næsteLabel} ${ik(næsteLåst?'lås':'pil')}</button>`;

  return `<div style="margin-top:18px">
    <div class="fod-nav">${forrigeKnap}${næsteKnap}</div>
    ${annullérLinje()}
  </div>`;
}

/* =============================================================
   HERO-SCENEN (genbrugt fra v3)
   ============================================================= */
/* Scenen fra logoet, flyttet ned i landskabet: bilen set bagfra med
   åben bagklap, madras og de to der ligger og kigger ud. */
/* Bilen er ikke tegnet — det er den nye signaturbil (27/9) fra
   Fællesdrevet, auto-vektoriseret af originalens PNG og beskåret til
   selve bilen; se brand/arytmi_logo_2026/LÆS-MIG.md. Den gamle bil.png
   (klippet ud af det gamle logo) er afløst.

   Bilen følger lyset: `mørke` er sceneLys()' glidende mål (0 = dag,
   1 = nat), og bilen dæmpes glidende med det: lysstyrke .80 → .58,
   mætning .78 → .60, kontrast .96 → .92. "Mere afdæmpet" (Kennet 27/9) —
   den nye bil er mere mættet end den gamle, så den gamles tal (.86/.70)
   fik den til at springe ud af scenen. Altid farvebilen: mørketoner-
   udgaven blev prøvet om natten og fravalgt af Kennet 27/9.

   Om dagen falder der lys på bilen (Kennet 27/9): `dag` er, hvor meget af
   paletten der er klarDag (0 i aften og nat, så de er urørte). Den løfter
   lysstyrken og lægger solens farve på bilen fra solens side (øverst til
   højre, solen står ved x 320) — maskeret af bilens egen form, blandet med
   `screen`, så det kun lysner.

   Den gamle havde græs foran hjulene; den nye har ikke, så den står
   højere: scenens synlige bund er ~376 (målt i 375×812 og 320×700), og
   hjulene står på 370. Scenen beskæres i siderne på smalle skærme — i
   320×700 starter det synlige ved x 55 — så bilen står ved 58. */
function bilenMedParret(p, nat, mørke, dag, sfx){
  const h = 130, b = Math.round(h*1127/989);  // udsnittets forhold bevares
  /* BILEN STÅR TIL HØJRE OG ER SPEJLVENDT (KN 5/10). Hele scenen blev
     prøvet spejlet først, men så landede månen bag nedtællingens
     venstrestillede "I dag" — og vandet og solens spejling er bygget på
     solens side, så solen kan ikke flyttes alene. Derfor kun bilen: 58 fra
     højre kant, som den før stod 58 fra venstre (det synlige i 320×700 går
     til x 375). Spejlingen sker om bilens egen midte nedenfor. */
  const x = 430 - 58 - b, y = 370 - h;
  const m = Math.max(0, Math.min(1, mørke)), d = Math.max(0, Math.min(1, dag||0));
  const fil = 'brand/arytmi_logo_2026/signaturbil.svg';
  const solskin = d > 0 ? `
    <defs>
      <mask id="bil-form-${sfx}" style="mask-type:alpha">
        <image href="${fil}" x="${x}" y="${y}" width="${b}" height="${h}"/>
      </mask>
      <radialGradient id="bil-lys-${sfx}" gradientUnits="userSpaceOnUse"
        cx="${x+b*.05}" cy="${y-h*.1}" r="${b*1.1}">
        <stop offset="0" stop-color="${p.sol}" stop-opacity=".75"/>
        <stop offset=".55" stop-color="${p.sol}" stop-opacity=".25"/>
        <stop offset="1" stop-color="${p.sol}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect x="${x}" y="${y}" width="${b}" height="${h}" fill="url(#bil-lys-${sfx})"
      mask="url(#bil-form-${sfx})" opacity="${(.7*d).toFixed(2)}" style="mix-blend-mode:screen"/>` : '';
  /* Lyset ligger i bilens egne, spejlede koordinater: x+b*.05 ender
     øverst til HØJRE på skærmen, mod solen. */
  return `
  <g transform="matrix(-1 0 0 1 ${2*x+b} 0)">
    <ellipse cx="${x+b/2}" cy="${y+h-3}" rx="${b*0.46}" ry="5.5" fill="#000" opacity=".3"/>
    <image href="${fil}" x="${x}" y="${y}" width="${b}" height="${h}"
      style="filter:brightness(${(.80-.22*m+.14*d).toFixed(2)}) saturate(${(.78-.18*m+.06*d).toFixed(2)}) contrast(${(.96-.04*m).toFixed(2)})"/>${solskin}
    ${nat?`<circle cx="${x+b+6}" cy="${y+h-14}" r="2.8" fill="${p.sol}" opacity=".95"
      style="animation:blink 5s ease-in-out .6s infinite"/>`:''}
  </g>`;
}
function skærmHøjde(){
  return Math.max(600, Math.min(1200, Math.round(window.innerHeight||800)));
}

/* Solens rytme på turens dato, med urets lokale klokkeslæt. Afgangstid bruges
   ikke: forsiden skal stadig kunne følge hele døgnet. Uden tur bruges nu (11/9). */
function sceneTid(nu){
  const tur = typeof s !== 'undefined' && s ? s.forberedelse : null;
  const dele = tur && typeof tur.dato==='string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(tur.dato);
  if(!dele) return nu;
  const [,år,måned,dag] = dele.map(Number);
  const dato = new Date(år, måned-1, dag, nu.getHours(), nu.getMinutes(), nu.getSeconds());
  return dato.getFullYear()===år && dato.getMonth()===måned-1 && dato.getDate()===dag ? dato : nu;
}
function sceneGeo(){
  // Midt i Danmark, når destinationen eller dens koordinater endnu mangler.
  const reserve = {lat:56.0, lon:10.0};
  const tur = typeof s !== 'undefined' && s ? s.forberedelse : null;
  const dest = tur && tur.destination;
  if(!dest) return reserve;
  const steder = typeof TESTEDE !== 'undefined' && Array.isArray(TESTEDE) ? TESTEDE : [];
  const testet = dest.testetId && steder.find(t => t && t.id===dest.testetId);
  const gyldig = g => g && Number.isFinite(g.lat) && Number.isFinite(g.lon)
    && g.lat>=GEO.latBund && g.lat<=GEO.latTop && g.lon>=GEO.lonV && g.lon<=GEO.lonØ;
  if(gyldig(testet)) return {lat:testet.lat, lon:testet.lon};
  /* Egen destination (KN 13/9): en adresse har rigtige koordinater med fra
     registret. De vejer tungere end appens omtrentlige x/y — reglen fra
     AGENTS.md om rigtige lat/lon, når de kendes. */
  if(gyldig(dest)) return {lat:dest.lat, lon:dest.lon};
  if(!Number.isFinite(dest.x) || !Number.isFinite(dest.y)) return reserve;
  const geo = xyTilGeo(dest.x, dest.y);
  return gyldig(geo) ? geo : reserve;
}
function lysGlid(t, fra, til){
  const a = Math.max(0, Math.min(1, (t-fra)/(til-fra)));
  return a*a*(3-2*a);
}
function sceneLys(dato, geo){
  const op = soltid(geo.lat, geo.lon, dato, true);
  const ned = solnedgang(geo.lat, geo.lon, dato);
  // Borgerligt tusmørke: solcentret 6 grader under horisonten (zenit 96).
  const daggry = soltid(geo.lat, geo.lon, dato, true, 96);
  const mørkt = soltid(geo.lat, geo.lon, dato, false, 96);
  if(!op || !ned || !daggry || !mørkt){
    return {fra:'klarNat', til:'klarNat', andel:0, mørke:1, sol:0};
  }
  const t = dato.getTime(), morgen = +op, aften = +ned;
  // Den varme del af dagen varer højst 90 minutter, aldrig et fast klokkeslæt.
  const skulder = Math.min(90*60000, (aften-morgen)*.2);
  let fra='klarNat', til='klarNat', andel=0;
  if(t>=+daggry && t<morgen){
    til='klarMorgen'; andel=lysGlid(t, +daggry, morgen);
  }else if(t>=morgen && t<morgen+skulder){
    fra='klarMorgen'; til='klarDag'; andel=lysGlid(t, morgen, morgen+skulder);
  }else if(t>=morgen+skulder && t<aften-skulder){
    fra=til='klarDag';
  }else if(t>=aften-skulder && t<aften){
    fra='klarDag'; til='klar'; andel=lysGlid(t, aften-skulder, aften);
  }else if(t>=aften && t<+mørkt){
    fra='klar'; til='klarNat'; andel=lysGlid(t, aften, +mørkt);
  }
  // De samme kvantiserede værdier bruges i farver OG SVG-id'er.
  andel = Math.round(andel*100)/100;
  const mørke = (fra==='klarNat' ? 1-andel : 0) + (til==='klarNat' ? andel : 0);
  const sol = Math.round(100*lysGlid(t, morgen, morgen+20*60000)
    *(1-lysGlid(t, aften-20*60000, aften)))/100;
  return {fra, til, andel, mørke, sol};
}
function blandPalet(a, b, andel){
  const farve = (fra, til) => '#'+[1,3,5].map(i => {
    const x=parseInt(fra.slice(i,i+2),16), y=parseInt(til.slice(i,i+2),16);
    return Math.round(x+(y-x)*andel).toString(16).padStart(2,'0');
  }).join('');
  return {sky:a.sky.map((f,i)=>farve(f,b.sky[i])), sol:farve(a.sol,b.sol),
    b1:farve(a.b1,b.b1), b2:farve(a.b2,b.b2), b3:farve(a.b3,b.b3)};
}
function månefase(dato){
  // Nymåne 6/1 2000 18:14 UT, Fred Espenak, AstroPixels:
  // https://astropixels.com/ephemeris/phasescat/phases1901.html
  // Middelmåned, ikke en efemeride: den enkelte fase kan afvige med timer.
  const omløb = (dato.getTime()-Date.UTC(2000,0,6,18,14))/(86400000*29.530588853);
  const fase = (Math.round((((omløb%1)+1)%1)*10000)%10000)/10000;
  return {fase, belyst:(1-Math.cos(2*Math.PI*fase))/2};
}
function måneSti(fase, x=95, y=88, r=21){
  if(fase===0) return '';
  const cos = Math.cos(2*Math.PI*fase), højre = fase<=.5 ? 1 : 0;
  const rx = Math.abs(r*cos).toFixed(4);
  const indre = Math.abs(cos)<.00001 ? 'L '+x+' '+(y-r)
    : 'A '+rx+' '+r+' 0 0 '+(cos>=0 ? 1-højre : højre)+' '+x+' '+(y-r);
  // Første bue går på højre side ved tiltagende måne; den indre er terminatoren.
  return 'M '+x+' '+(y-r)+' A '+r+' '+r+' 0 0 '+højre+' '+x+' '+(y+r)+' '+indre+' Z';
}


/* Kystlandskabet har en åben vandflade og ujævne konturer, så dybden kommer
   fra formerne. Alle farver kommer fortsat fra den valgte palet (11/9). */
function kystlandskab(p, H, lo, sfx, genskin){
  return `
    <defs>
      <linearGradient id="kyst-vand-${sfx}" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="${p.sky[2]}" stop-opacity=".52"/>
        <stop offset="1" stop-color="${p.b2}" stop-opacity=".88"/>
      </linearGradient>
      <linearGradient id="kyst-bakke-${sfx}" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="${p.b1}"/><stop offset="1" stop-color="${p.b2}"/>
      </linearGradient>
    </defs>
    <path d="M0 249 C35 240 63 245 97 238 C134 229 155 232 186 240 C220 251 244 245 275 235 C304 225 336 228 368 219 C394 211 414 217 430 221 V368 H0 Z" fill="${p.b1}" opacity=".58"/>
    <path d="M0 259 C45 251 70 258 110 250 C140 243 163 249 188 255 C218 263 241 256 270 248 C301 239 329 245 362 238 C389 232 415 240 430 236 V368 H0 Z" fill="url(#kyst-bakke-${sfx})"/>
    <path d="M0 259 C45 251 70 258 110 250 C140 243 163 249 188 255 C218 263 241 256 270 248 C301 239 329 245 362 238 C389 232 415 240 430 236" fill="none" stroke="${p.sky[2]}" stroke-opacity=".18" stroke-width=".7"/>
    <path d="M143 271 C209 262 273 269 330 261 C367 256 401 259 430 253 V332 C376 329 324 325 267 312 C221 302 180 288 143 271Z" fill="url(#kyst-vand-${sfx})"/>
    <g fill="none" stroke="${p.sol}" stroke-linecap="round" opacity="${(.08+.34*genskin).toFixed(3)}">
      <path d="M298 269h23m7 0h10M289 274h35m7 0h20M303 279h31m10 0h20M280 285h36m9 0h18M295 291h54m11 0h16M312 299h26m8 0h22" stroke-width="1"/>
      <path d="M185 275h36m-1 8h38m105-9h32m-26 12h38M265 300h21m100 12h34" stroke-width=".55" opacity=".45"/>
    </g>
    <g opacity="${genskin.toFixed(3)}"><g class="vandspejl" fill="${p.sol}">
      <ellipse cx="320" cy="271" rx="13" ry=".7"/>
      <ellipse cx="322" cy="282" rx="21" ry=".7"/>
      <ellipse cx="334" cy="295" rx="26" ry=".7"/>
    </g></g>
    <path d="M0 278 C38 262 86 269 123 282 C164 296 177 305 219 311 C252 316 268 327 302 334 L430 343 V368 H0Z" fill="${p.b2}"/>
    <path d="M104 279 C145 291 167 307 213 314 C250 320 271 335 307 339" fill="none" stroke="${p.sky[2]}" stroke-opacity=".26" stroke-width="1.1"/>
    <g fill="${p.b2}">
      <path d="M347 251l4-9 4 9h-2l4 7h-12l4-7zM371 246l5-13 5 13h-2l5 9h-16l5-9zM394 247l3-7 3 7h-1l3 6h-10l3-6z"/>
    </g>
    <path d="M0 306 C50 292 85 306 122 305 C164 304 177 319 218 325 C274 334 300 349 352 350 C382 349 411 341 430 344 V${H-lo+20} H0 Z" fill="${p.b3}"/>
    <path d="M218 325 C258 332 287 343 318 347" fill="none" stroke="${p.sol}" stroke-opacity=".10" stroke-width=".8"/>
    <g fill="none" stroke="${p.b3}" stroke-linecap="round" stroke-width="1.3">
      <path d="M403 348q-5-14-2-26m2 26q3-14 9-20m-9 20q-11-11-13-20M420 346q-1-16 5-26m-5 26q-7-11-6-18"/>
    </g>`;
}

/* ---- heroScene — lys, månefase og kystlandskab (11/9) ---- */
/* ---------- SOL OG MÅNE SKAL STÅ SAMME STED (KN 17/9) ----------

   "Jeg vil også gerne have at både sol og måne er placeret samme sted i
   hero uanset om vi er på den ene eller den anden skærm."

   De gjorde de ikke. Målt: forsiden havde månen 134 px nede, planlægningen
   78 px. Og det er IKKE bare et tal, der skal rettes:

   Scenen tegnes i et lærred på 430 × H og vises med `preserveAspectRatio=
   "xMidYMid slice"` — altså skaleret op, til den DÆKKER boksen, og
   beskåret om midten. Falder H og boksens højde ikke sammen, bliver
   toppen skåret væk, og hvor meget afhænger af BÅDE lærredets højde,
   boksens højde og skærmens bredde.

       forside        lærred 430×812   boks 375×699
       planlægning    lærred 430×420   boks 375×355

   Et fast tal i koden kan derfor ikke holde: det ville passe på én
   telefonbredde og skride på den næste. X passede i forvejen (279 begge
   steder), fordi bredden er den, der bestemmer skalaen — det er kun
   højden, der skrider.

   Derfor MÅLES der efter tegningen, og himmellaget flyttes, så solen og
   månen lander HIMMEL_TOP px nede, uanset hvad. Se `ankrSky()`.

   ⚠️ Det er ikke efterbehandling i AGENTS.md's forstand. Reglen dér
   handler om at rette app.js' output UDEFRA. Det her er skærmens egen
   render-funktion, der kalder sin egen hjælper — samme mønster som
   `tegnForslagKort()` og `adresseTegnForslag()`. */
/* 134 er ikke valgt frit: det er dér, forsiden havde månen i forvejen, og
   det er forsidens udseende, resten skal rette sig efter. Den giver samtidig
   luft under hovedets streg, som ligger ca. 63 px nede. */
const HIMMEL_TOP = 134;  // solens/månens midte, målt fra toppen af det synlige
const HIMMEL_CY  = 88;   // sol/måne står på cy=88 i lærredets egne enheder

/* Flytter himmellaget, så sol og måne lander samme sted på skærmen —
   uanset lærredets højde, boksens højde og telefonens bredde.

   Regnestykket er `slice`-reglen læst baglæns:
     skala      = max(bredde/430, boksHøjde/H)   — den dækker begge veje
     beskåret   = (H*skala - boksHøjde)/2        — px klippet af i toppen
   Skal solen stå HIMMEL_TOP px nede, skal den i lærredets enheder ligge på
     (HIMMEL_TOP + beskåret) / skala
   og laget skal altså forskydes med det minus dens egen cy.

   Kaldes til sidst i de skærme, der har en hero. Gør intet, hvis der ikke
   er nogen — så en skærm uden scene ikke kaster. */
function ankrSky(rod){
  /* ⚠️ KUN forsiden og planlægningen — IKKE loggen.

     Loggens hero har årshjulet ("0 ture i år") stående i højre side,
     præcis dér hvor månen ville lande på den fælles plads. Den sad før
     højere oppe og fri af hjulet, og sådan skal den blive. To skærme, der
     SKAL ligne hinanden, er ikke det samme som alle skærme.

     Derfor `.hero` og `.ned-rejse`, ikke `svg.scene` i almindelighed. */
  const lag = (rod || document).querySelectorAll(
    '.hero svg.scene .sky-lag, .ned-rejse svg.scene .sky-lag');
  lag.forEach(g => {
    const svg = g.ownerSVGElement;
    if(!svg) return;
    const boks = svg.getBoundingClientRect();
    if(!boks.width || !boks.height) return;          // ikke vist endnu
    const H = Number(g.dataset.h) || 368;
    const skala = Math.max(boks.width/430, boks.height/H);
    const beskåret = (H*skala - boks.height)/2;
    const fald = (HIMMEL_TOP + beskåret)/skala - HIMMEL_CY;
    g.setAttribute('transform', 'translate(0 ' + fald.toFixed(1) + ')');
  });
}

function heroScene(variant, H){
  // H = lærredets højde. 368 = båndet på undersider, høj værdi = fuldskærms-forside.
  H = H || 368;
  const off = H - 368;
  const lo = Math.round(off*.72);     // landskabet ned — men horisonten skal stadig ses
  /* Udgangspunktet. `ankrSky()` retter det til det målte bagefter — men
     står tallet her, er scenen tegnet rigtigt allerede i første billede,
     så der ikke er et glimt, hvor månen hopper på plads. */
  const skyOff = Math.round(off*.16);
  /* PETROLEUM, IKKE OLIVEN (OD 4/10: "Jeg bryder mig virkelig ikke om det
     grønne filter … gerne over i vores farvetema … eller petroleum"; Kennet:
     petroleum i både dag- og aftentema). Himmel og bakker var oliven
     (#a7ac8c, #6d7350) og gav hele forsiden et grønt lag. Nu er de bygget
     på paletteens petrol #5f746f — lysere mod himlen, dybere mod forgrunden
     — og horisonten er stadig varm creme og sand. Morgenen følger med, så
     der ikke glider oliven ind ved solopgang. Natten er urørt (Deep Brown). */
  const paletter = {
    klar:       { sky:['#2f3b39','#5f746f','#d6b58f'], sol:'#efd2a6', b1:'#34403d', b2:'#2a3432', b3:'#1f2726' },
    klarMorgen: { sky:['#4b5b58','#8b9993','#e3cfae'], sol:'#f0dcb0', b1:'#45524f', b2:'#384341', b3:'#2a3331' },
    klarDag:    { sky:['#8ea39e','#c8d1ca','#f7efe4'], sol:'#fff7dd', b1:'#5f746f', b2:'#4c5f5b', b3:'#3a4a47' },
    klarNat:    { sky:['#2b2a24','#454138','#77705d'], sol:'#e8d5ae', b1:'#2a2620', b2:'#1f1c17', b3:'#151310' },
    tur:        { sky:['#191a20','#2b2c33','#4d4a48'], sol:'#e9ddc2', b1:'#1c1c20', b2:'#141417', b3:'#0d0d0f' }
  };
  const nat = variant==='tur';
  const nu = new Date(), dato = nat ? nu : sceneTid(nu);
  const sæson = årstid(dato);
  const lys = sceneLys(dato, sceneGeo());
  const fase = månefase(dato);
  const nøgle = nat ? 'tur' : lys.fra+'-'+lys.til+'-'+Math.round(lys.andel*100);
  let p = nat ? paletter.tur : blandPalet(paletter[lys.fra], paletter[lys.til], lys.andel);
  // Nymånen låner lidt af den eksisterende nattepalet; ingen sjette farvesamling.
  if(!nat) p = blandPalet(p, paletter.tur, .16*lys.mørke*(1-fase.belyst));
  p = årstidsPalet(p, sæson);
  const skumring = !nat && lys.mørke>0;
  const sfx = nøgle+'-'+sæson+'-'+H+(nat ? '' : '-m'+Math.round(fase.fase*10000)+'-kyst');   // unikke gradient-id'er pr. palet, årstid og lærredshøjde
  const himmelX = nat ? 95 : 320;                  // giver den venstrestillede forsidetekst luft; tur er uændret
  const blinkStjerner = `
    <g fill="#e9e3cf">
      ${[[60,38,1.5,0],[150,22,1.1,1.3],[240,45,1.4,.6],[330,20,1,2.1],[390,55,1.5,.9],[105,62,1,1.7],[290,70,1.1,.3],[200,52,1,2.5],[45,90,1.2,1.1],[370,110,1,.5]]
        .map(([x,y,r,d])=>`<circle cx="${x}" cy="${y}" r="${r}" style="animation:blink ${(3+d)}s ease-in-out ${d}s infinite"/>`).join('')}
    </g>`;
  const aurora = nat ? `
    <g style="animation:aurora 11s ease-in-out infinite" opacity=".3">
      <path d="M30 20 C80 55 120 30 170 68 C150 20 90 35 55 8 Z" fill="#b98a5e" filter="url(#blød-${sfx})"/>
      <path d="M120 10 C180 60 240 32 300 74 C270 18 200 40 150 4 Z" fill="#8a7a66" filter="url(#blød-${sfx})" opacity=".7"/>
    </g>` : '';
  const fugle = !nat ? `
    <g stroke="${p.b3}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55" style="animation:fugle 38s linear infinite">
      <path d="M0 0 q4 -4 8 0 q4 -4 8 0"/><path d="M22 10 q3.4 -3.4 6.8 0 q3.4 -3.4 6.8 0"/><path d="M-14 20 q3 -3 6 0 q3 -3 6 0"/>
    </g>` : '';
  const stjerneskud = (nat || lys.mørke>0) ? `
    <line class="stjerneskud" x1="150" y1="34" x2="178" y2="22" stroke="#e9e3cf" stroke-width="1.4" stroke-linecap="round" opacity="0"/>` : '';
  const ildfluer = skumring ? `
    <g fill="#e8c874">
      <circle class="ildflue" cx="72" cy="294" r="1.8"/>
      <circle class="ildflue" cx="120" cy="306" r="1.4" style="animation-delay:1.8s"/>
      <circle class="ildflue" cx="184" cy="298" r="1.6" style="animation-delay:3.4s"/>
    </g>` : '';
  // himlens farveskift følger horisonten, uanset lærredets højde
  const hf = (252+(nat ? off : lo))/H;
  const g1 = (hf*0.64).toFixed(3), g2 = hf.toFixed(3);
  const vigStop = (110/H).toFixed(3);
  return `
  <svg class="scene" viewBox="0 0 430 ${H}" preserveAspectRatio="xMidYMid slice">
    <defs>
      ${nat ? '' : `<clipPath id="måne-${sfx}"><path d="${måneSti(fase.fase, himmelX)}"/></clipPath>`}
      <linearGradient id="sky-${sfx}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${p.sky[0]}"/><stop offset="${g1}" stop-color="${p.sky[1]}"/><stop offset="${g2}" stop-color="${p.sky[2]}"/>
      </linearGradient>
      <radialGradient id="glød-${sfx}" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="${p.sol}" stop-opacity=".6"/><stop offset="1" stop-color="${p.sol}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="dis-${sfx}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f2efe6" stop-opacity="0"/><stop offset=".5" stop-color="#f2efe6" stop-opacity=".14"/><stop offset="1" stop-color="#f2efe6" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="vig-${sfx}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset="${vigStop}" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <filter id="blød-${sfx}"><feGaussianBlur stdDeviation="7"/></filter>
      <filter id="korn-${sfx}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0"/></filter>
    </defs>
    <rect width="430" height="${H}" fill="url(#sky-${sfx})"/>
    <g class="sky-lag" data-h="${H}" data-fald="${skyOff}" transform="translate(0 ${skyOff})">
      ${aurora}${nat ? blinkStjerner+stjerneskud : `<g opacity="${(lys.mørke*(1-.35*fase.belyst)).toFixed(3)}">${blinkStjerner}${stjerneskud}</g>`}
      ${nat ? `<circle cx="${himmelX}" cy="88" r="66" fill="url(#glød-${sfx})"/>` : `
      <circle cx="${himmelX}" cy="88" r="78" fill="url(#glød-${sfx})" opacity="${lys.sol}"/>
      <circle cx="${himmelX}" cy="88" r="66" fill="url(#glød-${sfx})" opacity="${((1-lys.sol)*fase.belyst*fase.belyst).toFixed(3)}"/>
      <g opacity="${lys.sol}"><g style="animation:svæv 7s ease-in-out infinite">
        <circle cx="${himmelX}" cy="88" r="24" fill="${p.sol}"/>
        <circle cx="${himmelX}" cy="88" r="31" fill="none" stroke="${p.sol}" stroke-width="1.2" opacity=".28"/>
      </g></g>`}
      ${nat ? `
      <g style="animation:svæv 7s ease-in-out infinite">
        <circle cx="${himmelX}" cy="88" r="21" fill="${p.sol}"/>
        <circle cx="${himmelX-8}" cy="82" r="4" fill="${p.sky[0]}" opacity=".3"/>
        <circle cx="${himmelX+6}" cy="94" r="2.6" fill="${p.sky[0]}" opacity=".26"/>
        <circle cx="${himmelX+1}" cy="79" r="2" fill="${p.sky[0]}" opacity=".22"/>
      </g>` : `
      <g opacity="${1-lys.sol}"><g style="animation:svæv 7s ease-in-out infinite">
        <path d="${måneSti(fase.fase, himmelX)}" fill="${p.sol}"/>
        <g clip-path="url(#måne-${sfx})">
          <circle cx="${himmelX-8}" cy="82" r="4" fill="${p.sky[0]}" opacity=".3"/>
          <circle cx="${himmelX+6}" cy="94" r="2.6" fill="${p.sky[0]}" opacity=".26"/>
          <circle cx="${himmelX+1}" cy="79" r="2" fill="${p.sky[0]}" opacity=".22"/>
        </g>
      </g></g>`}
      <g transform="translate(70 58)">${nat ? fugle : `<g opacity="${1-lys.mørke}">${fugle}</g>`}</g>
      <g opacity=".5" style="animation:drift 30s linear infinite alternate">
        <ellipse cx="120" cy="64" rx="46" ry="7" fill="#f2efe6" opacity=".13"/>
        <ellipse cx="300" cy="42" rx="34" ry="5.5" fill="#f2efe6" opacity=".09"/>
      </g>
    </g>
    <g transform="translate(0 ${lo})">
      ${nat ? `
      <path d="M0 252 C60 228 120 242 180 234 C250 225 300 248 350 238 C390 231 415 238 430 234 V368 H0 Z" fill="${p.b1}"/>
      <rect x="0" y="244" width="430" height="30" fill="url(#dis-${sfx})" style="animation:drift 26s ease-in-out infinite alternate"/>
      <path d="M0 284 C70 264 130 280 200 270 C280 259 330 282 430 266 V368 H0 Z" fill="${p.b2}"/>
      <g fill="${p.b3}">
        <path d="m300 284 9-18 9 18zM302 270l7-14 7 14z" opacity=".9"/>
        <path d="m386 280 8-16 8 16zM388 268l6-12 6 12z" opacity=".85"/>
        <path d="m352 288 7-14 7 14z" opacity=".7"/>
      </g>
      <path d="M0 298 C90 291 200 301 430 293 V320 H0 Z" fill="${p.sky[2]}" opacity=".14"/>
      <g opacity="${nat ? 1 : (lys.sol+(1-lys.sol)*fase.belyst).toFixed(3)}"><ellipse class="vandspejl" cx="330" cy="303" rx="28" ry="3.5" fill="${p.sol}"/></g>
      ${nat ? ildfluer : `<g opacity="${lys.mørke}">${ildfluer}</g>`}
      <path d="M0 316 C90 300 180 316 270 308 C340 302 400 312 430 306 V368 H0 Z" fill="${p.b3}"/>
      <path d="M0 330 H430 V${H-lo+20} H0 Z" fill="${p.b3}"/>
` : kystlandskab(p, H, lo, sfx, lys.sol+(1-lys.sol)*fase.belyst)}
      ${bilenMedParret(p, nat, nat ? 1 : lys.mørke, nat ? 0 : (lys.fra==='klarDag' ? 1-lys.andel : 0) + (lys.til==='klarDag' ? lys.andel : 0), sfx)}
    </g>
    <rect width="430" height="${H}" fill="url(#vig-${sfx})"/>
    <rect width="430" height="${H}" filter="url(#korn-${sfx})" opacity=".045"/>
  </svg>`;
}

/* =============================================================
   NAVIGATION — Forside · Log · Profil
   ============================================================= */
let aktivSkærm = 'hjem';
const NAV = [
  {id:'profil', ikon:'person', navn:'Profil'},
  {id:'hjem',   ikon:'hjem',   navn:'Forside'},
  /* Samme navn som skærmens egen overskrift (KN 6/9) — bundnavigationen må
     ikke hedde noget andet end det, man lander på. */
  {id:'log',    ikon:'bog',    navn:'Arytme log'}
];
/* ÉN ægte historik i stedet for gæt. Tilbage fører altid derhen, hvor man
   lige kom fra — kommer man ind i Forplejningen fra tjeklisten, går tilbage
   til tjeklisten, ikke til "punktet før i rækken".

   En VISNING er ikke bare et skærmnavn: det er skærmen PLUS de undertilstande,
   der afgør, hvad skærmen viser. Trykker man "Planlæg sammen" inde på
   invitationssiden, skifter siden jo indhold uden at skifte skærm — det er et
   skridt, brugeren kan se, og derfor et skridt, Tilbage skal kunne tage igen.
   Reglen i hele appen: ét synligt skift = ét skridt i historikken.

   Undertilstande der er FREMDRIFT (invStatus: sendt, bekræftet, afslået) hører
   ikke med — man kan ikke fortryde en afsendt invitation med en tilbage-knap. */
let historik = [];
function visning(){
  const f = s.forberedelse;
  return {
    skærm: aktivSkærm,
    invType:    f ? (f.invType || null) : null,
    invVisMail: f ? !!f.invVisMail : false
  };
}
function sætVisning(v){
  aktivSkærm = v.skærm;
  const f = s.forberedelse;
  if(f){
    f.invType = v.invType; f.invVisMail = v.invVisMail;
    /* EN GAVE ER PRIVAT, og det er ikke til at vælge fra: hele pointen med
       "Overraskelse — i det skjulte" er, at modtageren ikke kan se den.
       Er modtageren rejsemakkeren, kunne hun det, indtil 0029.
       Den anden vej sætter vi IKKE automatisk: fortryder man gaven, er
       det ikke givet, at turen så skal deles — det skal man selv sige. */
    if(v.invType === 'gave') f.privat = true;
    gem();
  }
  tegn();
  efterNavigation();
}
function læg(v){
  historik.push(v);
  if(historik.length > 40) historik.shift();
}
/* EFTER ET SKÆRMSKIFT — ét sted, fem kaldere.
   -----------------------------------------------------------------
   Rullet til toppen stod før som `$('indhold').scrollTop = 0` fem steder.
   Det var rigtigt, og det var kun det halve: når `innerHTML` udskiftes,
   forsvinder det element, fokus stod på, og fokus falder ned på <body>.

   For en, der ser skærmen, betyder det ingenting. For en, der bruger
   skærmlæser eller tastatur, betyder det, at intet bliver læst op, og at
   næste tabulator starter forfra i toppen af siden — på hver eneste
   navigation, gennem hele appen.

   Derfor flyttes fokus med over på indholdet. `tabindex="-1"` sættes her i
   stedet for i index.html: skelettet skal blive ved at være et skelet
   (AGENTS.md), og attributten hører til den opførsel, der styres herfra.

   ⚠️ Kaldes KUN ved navigation — ikke fra `tegn()`. `tegn()` kører også,
   når en skærm tegnes om under sig selv (et valg slås til, en liste
   opdateres), og dér ville et fokusspring rive markøren ud af det felt,
   brugeren skriver i. Skærme, der selv sætter fokus i et felt bagefter,
   vinder stadig — de gør det i en setTimeout, altså efter det her. */
function efterNavigation(){
  kalenderÅben = false;
  const el = $('indhold');
  if(!el) return;
  /* Straks til toppen — ikke glidende. .indhold har scroll-behavior:smooth,
     og så rullede den gamle skærm synligt op, mens den nye kom ind. */
  el.style.scrollBehavior = 'auto';
  el.scrollTop = 0;
  el.style.scrollBehavior = '';
  if(el.getAttribute('tabindex') === null) el.setAttribute('tabindex', '-1');
  try { el.focus({ preventScroll:true }); } catch(e) { /* ældre browser: fokus er en bonus, ikke et krav */ }
}
function gåTil(skærm){
  if(skærm !== aktivSkærm) læg(visning());
  aktivSkærm = skærm;
  tegn();
  efterNavigation();
}
/* Kaldes FØR en ændring, der skifter hvad skærmen viser uden at skifte skærm.
   Uden den ville Tilbage springe hele skærmen over og lande et skridt for langt. */
function gemUnderTrin(){ læg(visning()); }
/* Skærme, der er "brugt op" når man går videre (fx et sted man netop har valgt),
   skal ikke ligge i vejen på vej tilbage. */
function gåTilErstat(skærm){
  aktivSkærm = skærm;
  tegn();
  efterNavigation();
}
/* Ét skridt tilbage. Er historikken tom (frisk start), bruges fallback. */
function tilbage(fallback){
  if(historik.length){ sætVisning(historik.pop()); return; }
  aktivSkærm = fallback || 'hjem';
  tegn();
  efterNavigation();
}
/* Hop ud af et helt forløb (Overblik-genvejen, bundnavigationen, "Færdig" i
   Udstyr): rul historikken tilbage til den skærm i stedet for at lægge endnu
   et skridt oveni. Så peger Tilbage dér ikke ind i det, man lige har forladt.

   Til forskel fra tilbage() gendannes undertilstandene IKKE. Et spring ud til
   overblikket er ikke en fortrydelse — har man valgt "Planlæg sammen", skal
   valget stadig stå, når man kigger forbi forsiden og kommer tilbage. */
function tilbageTil(skærm){
  for(let i = historik.length-1; i >= 0; i--){
    if(historik[i].skærm === skærm){
      historik.length = i;
      aktivSkærm = skærm;
      tegn();
      efterNavigation();
      return;
    }
  }
  gåTil(skærm);
}
/* Nulstilles når turen begynder eller slutter — så tilbage aldrig lander på
   en skærm, der ikke findes mere. */
function nulstilHistorik(){ historik = []; }
function tegnNav(){
  /* Klassen fortæller CSS'en, at der ikke er nogen bundnavigation at holde
     plads til. Uden den blev .hero.fuld ved med at trække 92 px fra på login-
     og onboardingskærmene og efterlod en tom creme stribe i bunden. */
  const telefon = document.querySelector('.telefon');
  if(!s.onboarded || loginKræves){ $('bundnav').style.display='none'; telefon.classList.add('uden-bundnav'); return; }
  telefon.classList.remove('uden-bundnav');
  $('bundnav').style.display='flex';
  /* Fanen "Steder" står kun der, mens editoren er slået til (KN 5/10). */
  const punkter = editorTil() ? NAV.concat({id:'red-steder', ikon:'blyant', navn:t('editor.steder','Steder')}) : NAV;
  const rod = aktivSkærm.startsWith('red-') ? 'red-steder'
    : punkter.some(n=>n.id===aktivSkærm) ? aktivSkærm : (aktivSkærm==='log'||aktivSkærm==='profil') ? aktivSkærm : 'hjem';
  $('bundnav').innerHTML = punkter.map(n=>`
    <button class="navpunkt ${n.id===rod?'aktiv':''}" onclick="tilbageTil('${n.id}')" aria-label="${n.navn}">${ik(n.ikon)}<span class="nav-navn" aria-hidden="true">${n.navn}</span></button>`).join('');
}
function skærmTop(titel, tilbageTil, etiket){
  return `<div class="skærm-top">
    <button class="tilbage" onclick="tilbage('${tilbageTil}')">${ik('tilbage')}</button>
    <div>${etiket?`<div class="etiket">${etiket}</div>`:''}<h1 style="font-size:22px">${titel}</h1></div>
  </div>`;
}

/* =============================================================
   ONBOARDING — velkomst → personlig kode → notifikationer
   ============================================================= */
let obTrin = 1;
/* LOGIN MANGLER (4/10). Hun har været igennem velkomsten på telefonen, men
   sessionen er væk. Før kørte appen videre, som om alt var godt — og intet
   kom op på serveren, så en ven aldrig kunne inviteres ("Turen er ikke nået
   op"). Nu står login-skærmen, indtil hun er inde igen. Hendes ture bliver
   liggende og sendes op bagefter (sync.js: en tur, serveren aldrig har
   set, er hendes egen og skal OP). Sættes af tjekLogin() og vedUdlogning. */
let loginKræves = false;
/* Dato som tre valg (dag/måned/år) i stedet for et nativt dato-felt — genbrugt
   af fødselsdag (onboarding), afgangsdato og "vælg dato" ved hjemkomst.
   Et kalenderhjul er dårligt til fødselsdage (30-40 klik tilbage i tiden) og
   så forskelligt ud på tværs af Mac/Windows/Android, ligesom skriften gjorde
   det før 13/8. Dag-listen retter sig efter måned/år, så 30. februar ikke kan
   vælges. `retning` styrer årlisten: 'fortid' (fødselsdag, ned til 1920,
   nyeste år først) eller 'fremtid' (rejsedatoer, i år + 2 år frem).
   `gemFn`, hvis angivet, kaldes efter dag-listen er opdateret — bruges til
   rejsedatoer, der skal gemmes og opdatere resten af skærmen med det samme
   (fx om "Videre"-knappen skal låses op). Fødselsdag gemmes først ved klik
   på "Gem min kode", så onboarding sender ikke noget gemFn. */
function datoSelects(id, iso, retning, gemFn){
  const [åY,åM,åD] = (iso||'').split('-').map(Number);
  const maxDage = åM ? new Date(åY||2000, åM, 0).getDate() : 31;
  const opt = (v,valgt,tekst)=>`<option value="${v}" ${v===valgt?'selected':''}>${tekst}</option>`;
  const dage = Array.from({length:maxDage},(_,i)=>opt(i+1, åD, i+1)).join('');
  const måneder = MDR.map((m,i)=>opt(i+1, åM, m[0].toUpperCase()+m.slice(1))).join('');
  const iÅr = new Date().getFullYear();
  const årListe = retning==='fremtid'
    ? [iÅr, iÅr+1, iÅr+2]
    : Array.from({length:iÅr-1920+1},(_,i)=>iÅr-i);
  const år = årListe.map(v=>opt(v, åY, v)).join('');
  const skift = `datoTegnDage('${id}')${gemFn?`;${gemFn}()`:''}`;
  return `<div class="dato-vælger">
    <select id="${id}Dag" aria-label="${esc(t('faelles.dag','Dag'))}" onchange="${skift}">${!åD?`<option value="" selected disabled>${t('faelles.dag','Dag')}</option>`:''}${dage}</select>
    <select id="${id}Måned" aria-label="${esc(t('faelles.maaned','Måned'))}" onchange="${skift}">${!åM?`<option value="" selected disabled>${t('faelles.maaned','Måned')}</option>`:''}${måneder}</select>
    <select id="${id}År" aria-label="${esc(t('faelles.aar','År'))}" onchange="${skift}">${!åY?`<option value="" selected disabled>${t('faelles.aar','År')}</option>`:''}${år}</select>
  </div>`;
}
/* Genopbygger kun Dag-listen ved skift af måned/år, så man ikke mister
   andre felter, man er i gang med (hele skærmen tegnes ikke om her). */
function datoTegnDage(id){
  const dagFelt = $(id+'Dag'), valgtDag = parseInt(dagFelt.value)||0;
  const måned = parseInt($(id+'Måned').value)||0, år = parseInt($(id+'År').value)||0;
  const maxDage = måned ? new Date(år||2000, måned, 0).getDate() : 31;
  const dag = Math.min(valgtDag, maxDage) || '';
  const opt = (v,valgt,tekst)=>`<option value="${v}" ${v===valgt?'selected':''}>${tekst}</option>`;
  dagFelt.innerHTML = (!dag?'<option value="" selected disabled>Dag</option>':'') +
    Array.from({length:maxDage},(_,i)=>opt(i+1, dag, i+1)).join('');
}
/* Læser de tre valg til ét ISO-datotekst (eller null, hvis ikke alle tre er sat). */
function datoLæs(id){
  const d=$(id+'Dag').value, m=$(id+'Måned').value, å=$(id+'År').value;
  return (d&&m&&å) ? `${å}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}` : null;
}
/* Login-familiens ramme (KN 5/10: "kedelig og mangler lidt design").
   Landskabet fra velkomstskærmen står som et bånd øverst — samme scene,
   samme døgnlys — med logoet, et mærkat og overskriften oven på. Formularen
   ligger i et kort, der griber op over båndets kant, så man ikke forlader
   billedet, når man trykker "Log ind". Bruges af trin 2, 2.5, 2.6 og 2.7. */
function obRamme(etiket, overskrift, under, krop, efter){
  return `<div class="ned-hero login-hero">
      ${heroScene('klar', 420)}
      <div class="ned-lag">
        <div class="h-logo">${logoSVG(true)}</div>
        <div class="login-maerkat">${etiket}</div>
        <h1 class="login-titel">${overskrift}</h1>
        ${under?`<p class="login-under">${under}</p>`:''}
      </div>
    </div>
    <div class="login-blok anim">
      <div class="kort login-kort">${krop}</div>
      ${efter||''}
    </div>`;
}
function skærmOnboarding(){
  if(obTrin===1){
    $('indhold').innerHTML = `
    <div class="hero fuld">
      ${heroScene('klar', skærmHøjde())}
      <div class="overlay">
        <div class="h-top">
          <div class="h-logo">${logoSVG(true)}</div>
          <div class="ht-side"></div>
          <div class="ht-side højre"></div>
        </div>
        <div class="h-bund velkomst">
          <!-- <br> står INDE i teksten. Det er netop derfor, t() ikke escaper
               selve teksten: linjeskiftet er en del af, hvordan sætningen
               skal se ud, og OD skal kunne flytte det uden at bede om kode. -->
          <h1>${t('velkomst.overskrift','Vælg mindre.<br>Oplev mere.')}</h1>
          <p>${t('velkomst.under','Fra idé til afsted — mindst mulig planlægning, mest mulig oplevelse.')}</p>
          <div class="handling">
            <!-- Samme pille som forsidens "Start her" (OD 5/10: "passer til
                 de andre"): CTA-orange, kapitæler, logoets puls, ingen pil. -->
            <button class="start-cta" onclick="obTrin=2;tegn()">
              <span>${t('velkomst.login','Log ind')}</span>${logoPuls()}
            </button>
            <!-- ÉN knap (KN 4/10 2026). Her stod før "Opret en konto", der
                 førte UD til arytmi.com. Login-skærmen har nu selv "Første
                 gang? Opret dig" med en kode på mail (K21), så der er kun én
                 vej ind — og ingen vej ud af appen til et køb (Apple 3.1.1). -->
          </div>
        </div>
      </div>
    </div>`;
    return;
  }
  /* TRIN 2 — LOG IND.
     Ikke "opret dig". Kontoen findes stadig allerede: den blev lavet, da hun
     betalte. Skærmen skal derfor ikke ligne en tilmelding, den skal ligne
     en dør.

     Den, der IKKE har købt, står ikke længere og leder — hun blev fanget
     ét trin før, af "Opret en konto" på forsiden, som fører ud til
     arytmi.com. Rettet 8/9 2026: før stod der ingen vej for hende overhovedet,
     og en app, der kun er en login-mur, bliver også afvist ved gennemsyn. */
  if(obTrin===2){
    $('indhold').innerHTML = obRamme(
      t('login.etiket','Log ind'),
      t('login.overskrift','Velkommen til Arytmi'),
      t('login.under','Brug den mailadresse, du købte Arytmi med.'),
      `${loginKræves?`<div class="advarsel" style="margin-top:12px">${t('login.igen','Du er blevet logget ud. Log ind igen — dine ture på telefonen kommer med.')}</div>`:''}
        <label class="felt-etiket">${t('login.mail','Mailadresse')}</label>
        <input type="email" id="obEmail" inputmode="email" autocomplete="username"
               placeholder="${esc(t('login.mailplads','dig@eksempel.dk'))}" value="${esc(s.profil.email||'')}">
        <label class="felt-etiket">${t('login.kodeord','Kodeord')}</label>
        <input type="password" id="obKodeord" autocomplete="current-password" placeholder="••••••••••••">
        <div style="margin-top:20px"><button class="knap primær bred" id="obLogindKnap" onclick="obLogInd()">${t('login.knap','Log ind')}</button></div>
        <!-- Glemt kodeord og første gang (K21, KN 4/10): begge veje bliver
             I APPEN, med en kode på mail. Før pegede "Glemt" ud til
             arytmi.com/nulstil og "Første gang" på linket i
             ordrebekræftelsen. Det er samme bevis begge steder: hun ejer
             postkassen. Kun overskrifterne er forskellige. -->
        <div class="login-link"><button class="tekst-knap" onclick="obKodeStart('glemt')">${t('login.glemt','Glemt dit kodeord?')}</button></div>`,
      /* "Første gang?" står UDEN for kortet: kortet er døren for den, der
         har en nøgle; det her er vejen for den, der ikke har fået den endnu. */
      `<div class="login-foerste">
        <p>${t('login.foerste','<b>Første gang?</b> Din konto blev oprettet, da du købte Arytmi. Opret dig med den mail, du købte med.')}</p>
        <button class="knap kontur bred" onclick="obKodeStart('opret')">${t('login.opret','Opret dig')}</button>
      </div>`);
    return;
  }
  /* TRIN 2.5 — VÆLG KODEORD.
     Vises kun, når man kommer fra aktiveringslinket. Tokenet står i
     adressens fragment og har aldrig været forbi en server.

     Kravet står HER, mens hun skriver, og kontrolleres igen på serveren.
     En regel, der kun findes i en browser, er en anbefaling. */
  if(obTrin===2.5){
    $('indhold').innerHTML = obRamme(
      t('vaelgkode.etiket','Velkommen til Arytmi'),
      t('vaelgkode.overskrift','Vælg dit kodeord'),
      t('vaelgkode.under','Sidste skridt. Så er appen din.'),
      `<label class="felt-etiket">${t('vaelgkode.kodeord','Kodeord')}</label>
        <input type="password" id="akKodeord" autocomplete="new-password" placeholder="••••••••••••"
               oninput="akTælTegn()">
        <!-- Længden er en REGEL, ikke prosa: den kommer fra ArytmiAuth og
             skal blive ved med at følge serveren. Derfor er den en
             pladsholder, ikke et tal, OD kan skrive om. -->
        <div id="akMaal" class="dæmpet" style="font-size:13px;margin-top:6px">${t('vaelgkode.maal','Mindst {antal} tegn.',{antal:ArytmiAuth.MIN_KODEORD})}</div>
        <div class="info-boks" style="margin-top:14px">
          ${ik('info')}
          <p>${t('vaelgkode.raad','<b>Længde slår krusseduller.</b> Fire tilfældige ord i træk — <i>blå hest batteri hæfteklamme</i> — er både lettere at huske og sværere at gætte end Sommer2026!. Vi tjekker, at dit kodeord ikke står i et kendt datalæk.')}</p>
        </div>
        <div style="margin-top:20px"><button class="knap primær bred" id="akKnap" onclick="obAktiver()">${t('vaelgkode.knap','Gem og kom i gang')}</button></div>`);
    setTimeout(()=>{ const f=$('akKodeord'); if(f) f.focus(); }, 60);
    return;
  }

  /* TRIN 2.6 og 2.7 — OPRET DIG / NYT KODEORD MED EN KODE PÅ MAIL (K21).
     Kennet 4/10: "Kunden skal kunne gøre alt fra appen og ikke andre
     steder." Kontoen findes allerede — købet lavede den. Koden på mail
     beviser, at det er hende, der ejer adressen; at adressen har købt, er
     ikke nok. `obKodeFormaal` er 'opret' eller 'glemt' og styrer kun
     overskrifterne — serveren (`mailkode`) gør det samme i begge tilfælde. */
  if(obTrin===2.6 || obTrin===2.7){
    const opret = obKodeFormaal !== 'glemt';
    const etiket = opret ? t('kode.opretetiket','Første gang') : t('kode.glemtetiket','Glemt kodeord');
    const tilbageLink = `<div class="login-link"><button class="tekst-knap" onclick="${obTrin===2.7?'obTrin=2.6':'obTrin=2'};tegn()">${t('kode.tilbage','Tilbage')}</button></div>`;
    if(obTrin===2.6){
      $('indhold').innerHTML = obRamme(etiket,
        opret ? t('kode.opretoverskrift','Opret dig') : t('kode.glemtoverskrift','Nyt kodeord'),
        t('kode.mailunder','Skriv den mailadresse, du købte Arytmi med. Så sender vi dig en kode.'),
        `<label class="felt-etiket">${t('login.mail','Mailadresse')}</label>
        <input type="email" id="obKodeMail" inputmode="email" autocomplete="username"
               placeholder="${esc(t('login.mailplads','dig@eksempel.dk'))}" value="${esc(obKodeMail||s.profil.email||'')}">
        <div style="margin-top:20px"><button class="knap primær bred" id="obKodeMailKnap" onclick="obSendKode()">${t('kode.sendknap','Send mig en kode')}</button></div>
        ${tilbageLink}`);
      setTimeout(()=>{ const f=$('obKodeMail'); if(f && !f.value) f.focus(); }, 60);
      return;
    }
    $('indhold').innerHTML = obRamme(etiket,
      t('kode.kodeoverskrift','Skriv koden'),
      /* Serveren svarer det samme, uanset om adressen findes. Det gør
         teksten også — ellers kunne appen bruges til at slå kunder op. */
      t('kode.kodeunder','Er {mail} den adresse, du købte med, har vi sendt en kode dertil. Den gælder i 15 minutter.',{mail:esc(obKodeMail)}),
      `<label class="felt-etiket">${t('kode.kode','Kode')}</label>
        <input type="text" id="obKode" inputmode="numeric" autocomplete="one-time-code" maxlength="7"
               placeholder="123 456" style="font-size:22px;letter-spacing:.3em;text-align:center">
        <label class="felt-etiket">${opret ? t('vaelgkode.overskrift','Vælg dit kodeord') : t('kode.nytkodeord','Vælg et nyt kodeord')}</label>
        <input type="password" id="akKodeord" autocomplete="new-password" placeholder="••••••••••••" oninput="akTælTegn()">
        <div id="akMaal" class="dæmpet" style="font-size:13px;margin-top:6px">${t('vaelgkode.maal','Mindst {antal} tegn.',{antal:ArytmiAuth.MIN_KODEORD})}</div>
        <div style="margin-top:20px"><button class="knap primær bred" id="obKodeKnap" onclick="obGemMedKode()">${opret ? t('kode.opretknap','Opret mig og log ind') : t('kode.glemtknap','Gem og log ind')}</button></div>
        <div class="login-link"><button class="tekst-knap" onclick="obSendKode(true)">${t('kode.nykode','Send en ny kode')}</button></div>
        ${tilbageLink}`);
    setTimeout(()=>{ const f=$('obKode'); if(f) f.focus(); }, 60);
    return;
  }

  /* TRIN 3 — LIDT OM DIG.
     Navnet lå før på login-skærmen. Det kan det ikke længere: hun logger
     ind på en konto, der allerede findes, og skærmen skal ikke ligne en
     tilmelding. Så det spørges her, ÉN gang — og springes helt over, hvis
     serveren allerede kender hendes navn. En kunde, der skifter telefon,
     skal ikke præsentere sig igen.

     Navnet er ikke pynt: invitationerne bliver sendt i det. */
  $('indhold').innerHTML = `<div class="side anim" style="padding-top:34px">
    <div style="display:flex;justify-content:center;margin-bottom:22px">${logoSVG(false)}</div>
    <div class="kort">
      <div class="etiket">${t('omdig.etiket','Velkommen')}</div>
      <div style="display:flex;gap:12px;align-items:center;margin-top:6px">
        <span style="color:var(--rav)">${ik('person','stor')}</span>
        <h2>${t('omdig.overskrift','Lidt om dig')}</h2>
      </div>
      <label class="felt-etiket">${t('omdig.navn','Dit navn')}</label>
      <input type="text" id="obNavn" placeholder="${esc(t('omdig.navnplads','Fx Kennet'))}" value="${esc(s.profil.navn||'')}">
      <p class="dæmpet" style="font-size:13px;margin-top:6px">${t('omdig.navnhvorfor','Invitationer til jeres ture bliver sendt i dit navn.')}</p>
      <label class="felt-etiket">${t('omdig.foedselsdag','Fødselsdag')}</label>
      ${datoSelects('ob', s.profil.fødselsdag, 'fortid')}
      <!-- Man skal kunne se formålet DÉR hvor man bliver bedt om noget
           personligt — ikke i en betingelsestekst, ingen læser (KN 6/9). -->
      <div class="info-boks">
        ${ik('info')}
        <p>${t('omdig.hvorfor','<b>Hvorfor spørger vi?</b> Vi bruger din fødselsdag til to ting: at foreslå ture på det tidspunkt, der passer dig, og som alder i en samlet statistik over, hvor gamle Arytmis brugere er — så vi kan lave appen til dem, der rent faktisk bruger den. Alderen står aldrig sammen med dit navn.')}</p>
      </div>
      <div style="border-top:1px solid var(--linje);margin:22px 0 4px"></div>
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
        <span style="color:var(--rav)">${ik('klokke','stor')}</span>
        <h3>${t('omdig.beskeder','Beskeder')}</h3>
      </div>
      <!-- ⚠️ TEKSTEN SKAL VÆRE SAND I DAG. Indtil 16/9 stod der "sender
           Arytmi beskeder til din telefon" — som noget af det FØRSTE appen
           sagde til en ny kunde — og der fandtes ingen beskeder. Fra 16/9 til
           7/10 stod der derfor ærligt, at påmindelserne ikke var sat i gang.
           Nu ER de (K22, fase C): paamind-afholdt sender "Din arytme er nu
           afholdt" dagen efter turen kl. 10 — som besked på telefonen, hvis
           hun har sagt ja her eller under Profil, ellers på mail. Teksten
           siger HVOR den kommer på netop denne telefon (beskedKanal()).
           ⚠️ Derfor må den her udgave af appen først ud, når 0049 er kørt og
           paamind-afholdt er udrullet med sine hemmeligheder — ellers er det
           igen et løfte, der ikke holdes. -->
      <p style="font-size:14.5px">${t('omdig.beskederhvorfor','Dagen efter jeres tur minder vi dig om at anmelde den, så du senere kan huske det bedste og rette det, der kunne være bedre.')}</p>
      <div id="obBeskedKanal">${obBeskedKanal()}</div>
      <button class="knap primær bred" id="obFaerdigKnap" onclick="obFærdig()" style="margin-top:16px">${t('omdig.knap','Kom i gang')}</button>
    </div>
  </div>`;
}

/* ---------- LOG IND ---------- */
async function obLogInd(){
  const email   = ($('obEmail').value||'').trim();
  const kodeord = $('obKodeord').value||'';
  const knap = $('obLogindKnap');
  if(knap){ knap.disabled = true; knap.textContent = 'Logger ind…'; }

  const svar = await ArytmiAuth.logInd(email, kodeord);
  if(!svar.ok){
    if(knap){ knap.disabled = false; knap.textContent = 'Log ind'; }
    flash(svar.fejl);
    return;
  }
  s.profil.email = ArytmiAuth.normaliserEmail(email) || '';
  gem();
  await efterLogin();
}

/* ---------- AKTIVERING ---------- */
/* Tælleren under feltet siger, hvor langt hun er — ikke hvad hun gør
   forkert. Et rødt felt, mens man er halvvejs gennem sit kodeord, er en
   irettesættelse af noget, der endnu ikke er sket. */
function akTælTegn(){
  const felt = $('akKodeord'); const maal = $('akMaal');
  if(!felt || !maal) return;
  const n = felt.value.length, kraev = ArytmiAuth.MIN_KODEORD;
  if(n === 0)      maal.textContent = 'Mindst ' + kraev + ' tegn.';
  else if(n < kraev) maal.textContent = n + ' af ' + kraev + ' tegn.';
  else             maal.textContent = 'Langt nok.';
}

async function obAktiver(){
  const kodeord = $('akKodeord').value||'';
  const knap = $('akKnap');
  const lokal = ArytmiAuth.kodeordsFejl(kodeord);
  if(lokal){ flash(lokal); return; }

  if(knap){ knap.disabled = true; knap.textContent = 'Gemmer…'; }
  const svar = await ArytmiAuth.aktiver(akToken, kodeord);
  if(!svar.ok){
    if(knap){ knap.disabled = false; knap.textContent = 'Gem og kom i gang'; }
    flash(svar.fejl);
    return;
  }
  /* Hun kom fra et link og har ikke tastet sin mail. Serveren sender den
     tilbage, så vi kan logge hende ind med det samme — hun skal ikke skrive
     noget, hun aldrig har skrevet. */
  const email = svar.email || s.profil.email;
  const ind = await ArytmiAuth.logInd(email, kodeord);
  if(!ind.ok){
    // Kodeordet ER gemt. Send hende til login i stedet for at lade hende tro,
    // at det hele gik galt.
    akToken = null; obTrin = 2; tegn();
    flash('Kodeordet er gemt. Log ind med din mail og dit nye kodeord.', 'tjek');
    return;
  }
  s.profil.email = ArytmiAuth.normaliserEmail(email) || '';
  gem();
  akToken = null;
  if(typeof history !== 'undefined' && history.replaceState){
    // Tokenet ud af adresselinjen, så det ikke bliver liggende i
    // browserhistorikken eller følger med på et skærmbillede.
    history.replaceState(null, '', location.pathname + location.search);
  }
  await efterLogin();
}

/* ---------- KODEN PÅ MAIL (K21) ---------- */
let obKodeFormaal = 'opret';   // 'opret' eller 'glemt' — kun overskrifterne skifter
let obKodeMail = '';

function obKodeStart(formaal){
  obKodeFormaal = formaal === 'glemt' ? 'glemt' : 'opret';
  const skrevet = $('obEmail') ? ($('obEmail').value||'').trim() : '';
  if(skrevet) obKodeMail = skrevet;
  obTrin = 2.6; tegn();
}

async function obSendKode(igen){
  if(!igen) obKodeMail = ($('obKodeMail') ? $('obKodeMail').value : obKodeMail || '').trim();
  const knap = $('obKodeMailKnap');
  if(knap){ knap.disabled = true; knap.textContent = t('kode.sender','Sender…'); }
  const svar = await ArytmiAuth.bedOmKode(obKodeMail);
  if(!svar.ok){
    if(knap){ knap.disabled = false; knap.textContent = t('kode.sendknap','Send mig en kode'); }
    flash(svar.fejl);
    return;
  }
  obKodeMail = svar.email;
  if(igen){ flash(t('kode.nysendt','Vi har sendt en ny kode. Kun den nyeste virker.'), 'tjek'); return; }
  obTrin = 2.7; tegn();
}

async function obGemMedKode(){
  const kode = $('obKode').value||'';
  const kodeord = $('akKodeord').value||'';
  const knap = $('obKodeKnap');
  const før = knap ? knap.textContent : '';
  if(knap){ knap.disabled = true; knap.textContent = t('kode.gemmer','Et øjeblik…'); }
  const svar = await ArytmiAuth.saetKodeordMedKode(obKodeMail, kode, kodeord);
  if(!svar.ok){
    if(knap){ knap.disabled = false; knap.textContent = før; }
    flash(svar.fejl);
    return;
  }
  /* Kodeordet er sat. Log hende ind med det samme — hun har lige skrevet
     både mail og kodeord og skal ikke gøre det igen. */
  const ind = await ArytmiAuth.logInd(svar.email, kodeord);
  if(!ind.ok){
    obTrin = 2; tegn();
    flash(t('kode.gemtlogind','Kodeordet er gemt. Log ind med din mail og dit nye kodeord.'), 'tjek');
    return;
  }
  s.profil.email = ArytmiAuth.normaliserEmail(svar.email) || '';
  gem();
  obKodeMail = '';
  await efterLogin();
}

/* Fælles for begge veje ind: hent profilen ned, og gå videre i onboardingen
   eller direkte hjem, hvis hun har været her før. */
async function efterLogin(){
  loginKræves = false;
  /* ⚠️ UDBAKKEN SKAL I GANG HER (4/10). Ved opstart var hun ikke logget
     ind, så sync.js' første hentning gav op — og udbakken samler INTET op,
     før en hentning er lykkedes (se `klar` i efterGem). Uden denne linje
     kom intet op på serveren resten af sessionen: Oliivia lavede en tur
     lige efter login, inviterede en ven, og inviter-gaest svarede 404,
     "Turen findes ikke". Først næste genstart af appen satte det i gang.
     Hentningen er sikker her: en tur, serveren aldrig har set, bliver
     liggende og sendes op bagefter (se fjernForsvundne i sync.js). */
  if(window.ArytmiSync && ArytmiSync.hent){
    try{ await ArytmiSync.hent(); ArytmiSync.efterGem(); }catch(e){}
  }
  const profil = await ArytmiAuth.hentProfil();
  if(profil){
    if(profil.navn) s.profil.navn = profil.navn;
    if(profil.foedselsdag) s.profil.fødselsdag = profil.foedselsdag;
    if(profil.email) s.profil.email = profil.email;
    if(profil.telefon) s.profil.telefon = profil.telefon;
    if(typeof profil.notifikationer === 'boolean') s.profil.notifikationer = profil.notifikationer;
    gem();
  }
  if(s.profil.navn){
    // Har hun været her før, skal hun ikke gennem velkomsten igen.
    s.onboarded = true; gem();
    nulstilHistorik(); gåTil('hjem');
    return;
  }
  obTrin = 3; tegn();
}

/* Beskeder i velkomsten: hvor påmindelsen kommer, og — kan telefonen give
   besked — knappen, der spørger. Blokken tegnes for sig efter svaret, så
   navnet, hun allerede har skrevet ovenover, ikke forsvinder med en tegn(). */
function obBeskedKanal(){
  const k = beskedKanal();
  return `<p class="dæmpet" style="font-size:13.5px;margin-top:8px">${beskedKanalTekst(k)} ${t('omdig.beskederfra','Du kan altid ændre det under Profil &amp; indstillinger.')}</p>
    ${k === 'kan' ? `<button class="knap kontur lille" style="margin-top:10px" onclick="obBeskederTil()">${t('beskeder.knap','Ja tak, på telefonen')}</button>` : ''}`;
}
async function obBeskederTil(){
  const k = await slåPushTil();
  const blok = $('obBeskedKanal');
  if(blok) blok.innerHTML = obBeskedKanal();
  beskedSvar(k);
}
/* Sidste skridt i onboardingen. Navnet gemmes BÅDE lokalt og på serveren —
   det er serverens udgave, der følger med til næste telefon, og uden den
   ville hun blive spurgt igen ved hvert skifte. Fejler serveren, kommer hun
   alligevel ind: en manglende netværksforbindelse må ikke spærre hende ude
   af den app, hun lige har betalt for. Synkroniseringen tager det næste gang. */
async function obFærdig(){
  const navn = ($('obNavn').value||'').trim();
  if(!navn){ flash('Skriv dit navn — invitationerne bliver sendt i dit navn.'); return; }
  const knap = $('obFaerdigKnap');
  if(knap){ knap.disabled = true; knap.textContent = 'Et øjeblik…'; }

  s.profil.navn = navn;
  s.profil.fødselsdag = datoLæs('ob') || '';
  s.profil.notifikationer = true;
  s.onboarded = true;
  gem();

  try{
    await ArytmiAuth.gemProfil({
      navn: s.profil.navn,
      foedselsdag: s.profil.fødselsdag || null,
      notifikationer: true
    });
  }catch(e){ /* offline: den lokale tilstand står, og sync tager den */ }

  nulstilHistorik(); gåTil('hjem');
  flash('Velkommen til Arytmi.', 'klokke');
}
/* Log ud. Turene bliver liggende lokalt — de er der igen, når man logger ind
   med samme nummer, og de skal ikke være væk, mens man står og skifter
   telefon. Det er onboardingen, der lukkes op igen, ikke dataene, der
   slettes. */
/* LOGUD RYDDER ALT LOKALT (KN 15/9).

   Den gamle udgave nulstillede `onboarded` og mailen — og kun det. Turene,
   egne ting, de afholdte ture, UDBAKKEN og SPEJLET blev liggende. Loggede
   en anden bruger så ind på den samme telefon, skete det her:

     1. `hentNed()` satte spejlet til DEN NYES rækker.
     2. `efterGem()` så den forriges ture som noget, serveren ikke kendte,
        og lagde dem i udbakken.
     3. `skrivTabel()` stempler hver række med ejeren, der er logget ind NU.

   Den forriges ture blev altså den nyes. Det er den ene kundes data i den
   anden kundes konto, og det er grunden til, at der ikke kan testes to
   konti i samme browser, før det her er rettet.

   REKKEFØLGEN ER IKKE LIGEGYLDIG:
     · udbakken tømmes FØRST, mens vi stadig er logget ind. Ellers ryger
       uafsendte ændringer i skraldespanden, og brugeren har fået at vide,
       at hendes ture er der igen næste gang.
     · kan den ikke tømmes (intet net), siger vi det og bliver stående.
       At logge ud er ikke presserende nok til at koste en tur.
     · først derefter logges ud, og først derefter ryddes.

   Der ryddes ved at slette og genindlæse, ikke ved at nulstille felter ét
   for ét: en liste over "hvad skal også huskes at rydde" holder aldrig. */
async function logUdAfArytmi(){
  /* Selve udgangen. Samlet i én funktion, fordi der nu er TO veje hertil:
     den almindelige, og den hvor udbakken ikke kunne tømmes. */
  const lukDøren = async ()=>{
    await glemPush();   // FØR logUd: kun hun selv må slette sit abonnement
    try { await ArytmiAuth.logUd(); } catch(e){}
    if(window.ArytmiSync && ArytmiSync.glem) ArytmiSync.glem();
    try { localStorage.removeItem(GEM); } catch(e){}
    try { localStorage.removeItem('klar-app-v2'); } catch(e){}
    location.reload();
  };

  bekræft(t('indstil.logudspm','Log ud af Arytmi? Dine ture bliver liggende og er der igen, når du logger ind igen.'), async ()=>{
    let venter = -1;
    if(window.ArytmiSync && ArytmiSync.skub){
      try { venter = await ArytmiSync.skub(); } catch(e){ venter = -1; }
    }

    /* ⚠️ RETTET 21/9. HER STOD `return`, OG DET VAR EN BLINDGYDE.

       Begrundelsen ovenfor — "at logge ud er ikke presserende nok til at
       koste en tur" — er rigtig, når nettet bare er nede. Den holder ikke,
       når ændringen ALDRIG kan sendes.

       `skub()` fjerner nemlig kun en post fra udbakken, hvis serveren
       sagde ja. Bliver en skrivning afvist for altid — en række, der
       peger på noget slettet, en politik der siger nej — så bliver den
       liggende, `skub()` returnerer altid mere end nul, og log ud er
       spærret. For altid.

       Det ramte Oliivia 21/9: to ændringer, der ikke kunne sendes, og
       dermed en konto hun ikke kunne komme ud af. Og det er værre end
       tabte ændringer: kan man ikke logge ud, kan telefonen ikke gives
       videre — og lige over står hele begrundelsen for, hvorfor det er
       farligt at efterlade en konto på en telefon.

       Så nu SPØRGES der i stedet for at nægte. Hun får at vide, hvad det
       koster, og hun bestemmer. To ændringer, der ikke kan sendes, er
       mindre værd end en dør, der kan åbnes. */
    if(venter > 0){
      bekræft(t('indstil.logudventer2',
        '{antal} ændringer kunne ikke sendes til serveren. Logger du ud nu, går netop de ændringer tabt — alt det, der ER sendt, er der stadig. Log ud alligevel?',
        {antal:venter}), lukDøren);
      return;
    }
    await lukDøren();
  });
}

/* =============================================================
   SLET KONTOEN — den eneste dør, der ikke kan åbnes igen
   =============================================================
   HVORFOR DET ER EN SKÆRM OG IKKE EN bekræft()
   --------------------------------------------
   "Nulstil prototypen" blev fjernet 15/9 med netop den begrundelse: den
   "slettede alle brugerens data bag én bekræftelse". Det her sletter mere
   og kan ikke fortrydes. Så det får en skærm, hvor der er plads til at
   skrive, hvad der forsvinder — og hvor man skal skrive sit kodeord, hvilket
   er svært at gøre ved et uheld.

   KRAVET er ikke vores: Google Play og App Store forlanger begge, at en app
   med konti kan slette kontoen INDE i appen, og artikel 17 forlanger det
   uanset butikkerne. Privatlivspolitikken lover den nu.

   ⚠️ TALLENE KOMMER FRA DEN LOKALE TILSTAND, ikke fra serveren. Det er med
   vilje: skærmen skal kunne tegnes uden netværk, og den skal vise det, HUN
   kan se. Er der mere på serveren, end telefonen kender, forsvinder det
   også — teksten lover ikke, at listen er udtømmende. */
function skærmSletKonto(){
  /* Navnene er ikke til at gætte, og de er slået op, ikke antaget:
     `arytmer` er de KOMMENDE ture, `ture` er dem, der er holdt (de har en
     anden form — score, kommentar, minde), og de egne punkter ligger i
     `egneTing` som én liste pr. navn. Se friskState(). */
  const antalKommende = (s.arytmer && s.arytmer.length) || 0;
  const antalAfholdte = (s.ture && s.ture.length) || 0;
  const et = s.egneTing || {};
  const antalEgne = Object.keys(et).reduce((n,k)=> n + ((et[k]||[]).length), 0);

  const punkt = (tal, en, flere) => tal === 0 ? ''
    : `<li>${tal === 1 ? t(en[0], en[1], {antal:tal}) : t(flere[0], flere[1], {antal:tal})}</li>`;

  $('indhold').innerHTML = `<div class="side anim slet-side">
    ${skærmTop(t('slet.overskrift','Slet din konto'), 'profil')}

    <div class="kort" style="margin-top:14px">
      <p>${t('slet.indledning','Her stopper det. Vi sletter din konto og alt, du har lavet i Arytmi — og vi kan ikke hente det tilbage bagefter.')}</p>

      <h3 style="margin-top:18px">${t('slet.hvadoverskrift','Det her forsvinder')}</h3>
      <ul class="slet-liste">
        ${punkt(antalKommende,
          ['slet.tur','din ene planlagte tur'],
          ['slet.ture','dine {antal} planlagte ture'])}
        ${punkt(antalAfholdte,
          ['slet.afholdt','den ene tur, du har holdt — og det, du skrev om den'],
          ['slet.afholdte','de {antal} ture, du har holdt — og det, du skrev om dem'])}
        ${punkt(antalEgne,
          ['slet.egen','dit ene egne punkt på pakkelisten'],
          ['slet.egne','dine {antal} egne punkter på pakkelisten'])}
        <li>${t('slet.profil','dit navn, din mailadresse, dit telefonnummer og din fødselsdag')}</li>
        <li>${t('slet.adgang','din adgang til Arytmi. Du kan ikke logge ind igen')}</li>
      </ul>

      <div class="advarsel" style="margin-top:16px">
        <b>${t('slet.partneroverskrift','Din rejsemakker mister dem også.')}</b>
        ${t('slet.partner','De ture, du ejer, forsvinder fra din rejsemakkers telefon i samme øjeblik — også dem, I har været på sammen. Rejsemakkerens egne ture bliver liggende, og der kan frit vælges en ny rejsemakker bagefter.')}
      </div>

      <p class="dæmpet" style="font-size:13.5px;margin-top:16px">${t('slet.backup','Der kan gå op til 90 dage, før du er helt ude af vores natlige sikkerhedskopier. De bruges kun til at genskabe databasen efter et nedbrud.')}</p>
    </div>

    <div class="kort" style="margin-top:14px">
      <label class="felt-etiket" for="sletKodeord">${t('slet.kodeordetiket','Skriv dit kodeord for at bekræfte')}</label>
      <input type="password" id="sletKodeord" autocomplete="current-password"
             placeholder="${esc(t('slet.kodeordplads','Dit kodeord'))}">
      <p class="dæmpet" style="font-size:13px;margin-top:6px">${t('slet.kodeordhvorfor','Vi spørger, fordi en oplåst telefon ikke er det samme som dig.')}</p>
      <div id="sletFejl" class="advarsel" style="margin-top:12px;display:none"></div>
      <button class="knap bred slet-knap" id="sletKnap" onclick="sletKontoBekræft()" style="margin-top:14px">${t('slet.knap','Slet min konto for altid')}</button>
      <button class="knap kontur bred" onclick="tilbage('profil')" style="margin-top:10px">${t('faelles.fortryd','Fortryd')}</button>
    </div>
  </div>`;
}

/* To spørgsmål, ikke ét. Kodeordet er beviset; bekræftelsen er tænkepausen. */
function sletKontoBekræft(){
  const felt = $('sletKodeord');
  const kodeord = felt ? felt.value : '';
  const fejl = $('sletFejl');
  if(!kodeord){
    if(fejl){ fejl.style.display='block'; fejl.textContent = t('slet.manglerkode','Skriv dit kodeord for at bekræfte.'); }
    if(felt) felt.focus();
    return;
  }
  bekræft(t('slet.sidstespm','Er du sikker? Din konto og alt, du har lavet, bliver slettet nu. Det kan ikke fortrydes.'),
    ()=>sletKontoUdfør(kodeord));
}

async function sletKontoUdfør(kodeord){
  const knap = $('sletKnap'), fejl = $('sletFejl');
  const vis = besked => { if(fejl){ fejl.style.display='block'; fejl.textContent = besked; } };
  if(knap){ knap.disabled = true; knap.textContent = t('slet.sletter','Sletter …'); }

  const svar = await ArytmiAuth.sletKonto(kodeord);

  if(!svar.ok){
    if(knap){ knap.disabled = false; knap.textContent = t('slet.knap','Slet min konto for altid'); }
    vis(svar.fejl || t('slet.gikgalt','Kontoen kunne ikke slettes. Prøv igen.'));
    return;
  }

  /* KONTOEN ER VÆK PÅ SERVEREN. Nu skal telefonen rydde op — og det skal
     være GRUNDIGT, af præcis den grund, der blev fundet 15/9: logud
     nulstillede kun `onboarded` og mailen, så den næste, der loggede ind på
     samme telefon, fik den forriges ture stemplet med SIT ejer-id.
     Her er kontoen endda slettet, så der er ingen server at rette op mod. */
  if(window.ArytmiSync && ArytmiSync.glem) ArytmiSync.glem();
  await glemPush();   // rækken er væk med kontoen; telefonen skal også opsige abonnementet
  try { await ArytmiAuth.logUd(); } catch(e){}
  try { localStorage.removeItem(GEM); } catch(e){}
  try { localStorage.removeItem('klar-app-v2'); } catch(e){}
  try { localStorage.removeItem('arytmi-udbakke'); } catch(e){}
  try { localStorage.removeItem('arytmi-spejl'); } catch(e){}
  location.reload();
}

/* =============================================================
   FORSIDE — ét helt billede, én beslutning: forbered turen
   ============================================================= */
/* Arytmi-tæller — kompakt hjerteslag øverst; tæller årets arytmer */
function arytmiTæller(){
  const iÅr = s.ture.filter(t=>t.dato && String(t.dato).startsWith(String(new Date().getFullYear()))).length;
  // rytmestregen bor i ordmærket — tælleren nøjes med hjerteslaget
  return `<button class="aryt-tæller" onclick="gåTil('log')" aria-label="${t('hjem.taelleraria','{antal} arytmer i år',{antal:iÅr})}" title="${esc(t('hjem.taellertitel','Arytmer i år'))}">
    <span class="at-label">${t('hjem.tael','Arytmer i år:')}</span>
    <svg class="at-hjerte" viewBox="0 0 24 24"><path d="M12 21C12 21 3 14.6 3 8.9 3 5.7 5.4 4 7.8 4 9.7 4 11.2 5.2 12 6.4 12.8 5.2 14.3 4 16.2 4 18.6 4 21 5.7 21 8.9 21 14.6 12 21 12 21Z"/></svg>
    <span class="at-tal">${iÅr}</span>
  </button>`;
}

/* Er der reelt sat noget i gang? En tom kladde (fx man åbnede "Forbered tur"
   men valgte intet) tæller ikke — så forsiden forbliver ren. */
function turIGang(){
  const f = s.forberedelse; if(!f) return false;
  return !!(f.destination || f.dato || f.invType
    || f.set.mad || f.set.bilen
    || (f.pakkeTjek && f.pakkeTjek.length));
}
function skærmHjem(){
  // Tom kladde smides væk, så forsiden ikke husker en planlægning, der aldrig kom i gang
  if(s.forberedelse && !turIGang()){ sletTur(s.aktivId); }
  // Har turen en dato (planlagt via Spontan tur), bliver forsiden en nedtælling + tjekliste
  if(s.forberedelse && s.forberedelse.dato){
    return skærmHjemNedtælling();
  }
  let variant='klar', overskrift, underoverskrift='', under, knap, ekstraForside='';

  /* "Velkommen hjem" og "God tur" er væk (OD 31/8). De var to fuldskærms-
     tilstande, der ventede på et tryk. Turen ligger i stedet i Dine arytmer,
     indtil man selv gemmer den. */
  if(s.forberedelse){
    const fase = s.forberedelse.fase || 1;
    const f = fremdrift(fase);
    if(fase===1){
      overskrift = f.mangler===0 ? t('hjem.planenklar','Planen er klar.') : t('hjem.planenigang','Planen er i gang.');
      under = f.mangler===0
        ? t('hjem.restenventer','Resten venter til dagen, hvor I skal afsted.')
        : t('hjem.imanglerplan','Der mangler {mangler} af {total} i planen. I er tættere på, end I tror.',{mangler:f.mangler,total:f.total});
      knap = f.mangler===0
        ? { tekst:t('hjem.goerklarafgang','Gør klar til afgang'), note:t('hjem.trin2','Trin 2 · på dagen'), ikon:'bil', aktion:'tilFase(2)' }
        : { tekst:t('hjem.fortsaetplanen','Fortsæt planen'), note:t('hjem.afklaret','{klaret} af {total} klaret',{klaret:f.klaret,total:f.total}), ikon:'pil', aktion:"gåTil(nutidigSektion())", ring:f.pct };
    } else {
      overskrift = f.mangler===0 ? t('hjem.ierklar','I er klar.') : t('hjem.klartilafgang','Klar til afgang?');
      under = f.mangler===0
        ? t('hjem.altpakket','Alt er pakket. I skal bare sætte jer ind og køre.')
        : t('hjem.manglerpakket','{mangler} af {total} ting mangler at blive pakket.',{mangler:f.mangler,total:f.total});
      knap = f.mangler===0
        ? { tekst:t('hjem.afsted','Afsted'), ikon:'måne', aktion:'tilAfsted()' }
        : { tekst:t('hjem.afslutforberedelsen','Afslut forberedelsen'), note:t('hjem.afpakket','{klaret} af {total} pakket',{klaret:f.klaret,total:f.total}), ikon:'pil', aktion:"gåTil(nutidigSektion())", ring:f.pct };
    }
    ekstraForside = `<button class="spontan-link" onclick="gåTil('turplan')">${ik('bog')} ${t('faelles.seturplan','Se hele turplanen')}</button>`;
  } else {
    /* Tekstnøgler siden 5/10, så editoren kan rette dem på forsiden. */
    overskrift=t('hjem.velkomstoverskrift','Klar til en sund<br>forstyrrelse?');
    underoverskrift=t('hjem.velkomstetiket','Fra idé til afsted.');
    /* Strammet 13/8, så startknappen kommer inden for skærmen på en lille telefon.
       Kennets egne ord er beholdt — kun gentagelsen og konsulentsproget er væk.
       MIDLERTIDIG: OD og KN laver den rigtige tekstgennemgang, når det
       overordnede er på plads. Rør den ikke før da. */
    under=t('hjem.velkomstbrod','Vælg mindre, oplev mere. Alt for mange idéer drukner i planlægning — her går du direkte fra idé til afsted.');
    knap={ tekst:t('hjem.startknap','Start her'), aria:t('hjem.startaria','Forbered tur'), ikon:'bil', aktion:'startForberedelse()', iKnappen:true };
    /* Underknappen LOGGER nu turen bagefter i stedet for at starte en hurtig
       forberedelse (KN 4/9). En spontan tur er per definition allerede kørt —
       den skal skrives ind, ikke planlægges. Bemærk: 'hurtig'-skærmen findes
       stadig og er stadig med i navigationstesten, men der er ingen vej ind
       til den fra appen længere. Skal den helt ud, er det en selvstændig
       oprydning (noteret i Arytmi-status.md). */
    /* "Log en spontan tur" står ikke her længere (KN 28/9: "passer bedre ind
       under arytmeloggen"). Den logger en tur, man allerede HAR taget — og
       det er loggen, ikke forsiden, der handler om de ture. Se tegnLog(). */
  }

  // Rund hovedknap til fuldskærms-forsiden — med pulserende hjerteslag-ringe.
  // Ved turens to store greb (start / gør klar) står pulsen fra logoet i cirklen.
  // Bilen stod her før, men den står allerede i landskabet lige ved siden af.
  const visPuls = knap.ikon === 'bil';
  // Startknappen bærer selv sit ord inde i cirklen. De øvrige greb har for
  // lange labels til at kunne stå derinde.
  //
  // ⚠️ ORDET STÅR ØVERST, PULSEN NEDENUNDER (KN 17/9). Det var omvendt før.
  // Rækkefølgen ligger i OPMÆRKNINGEN og ikke i en column-reverse, så det,
  // man læser i filen, er det, man ser på skærmen — og så en skærmlæser
  // ikke får dem i én orden og øjet i en anden.
  /* Et flag og ikke teksten (5/10): "Start her" kan nu rettes i editoren, og
     så måtte knappen ikke skifte form, fordi ordet blev et andet. */
  const ordIKnappen = !!knap.iKnappen;
  /* ⚠️ "START HER" ER EN PILLE NU, IKKE EN CIRKEL (KN 28/9: "Jeg er altså
     heller ikke glad for knappen her. Kan du lave noget der er mere
     indbydende?"). Den runde creme-knap blev fravalgt til en bred knap 11/9;
     nu er det Kennets eget ønske. Pillen står i CTA-orange fra Oliivias
     palette — farven findes netop til hovedknappen — og bærer pulsen fra
     logoet, så mærket er med. De andre greb (gør klar, nedtælling) er
     stadig runde: de har en fremdriftsbue, der kun giver mening om en cirkel. */
  const rundKnap = `
    <div class="rund-start">
      ${ordIKnappen ? `<button class="start-cta" onclick="${knap.aktion}" aria-label="${knap.aria || knap.tekst}">
        <span>${knap.tekst}</span>${logoPuls()}
      </button>` : `<button class="rund-knap" onclick="${knap.aktion}" aria-label="${knap.aria || knap.tekst}">
        <span class="rk-ring"></span>
        ${knap.ring!==undefined?`<svg class="rk-bue" viewBox="0 0 120 120"><circle class="rk-spor" cx="60" cy="60" r="55"/><circle class="rk-fyld" cx="60" cy="60" r="55" pathLength="100" style="stroke-dashoffset:${100-knap.ring}"/></svg>`:''}
        ${visPuls ? pulsIKnap() : ik(knap.ikon)}
      </button>`}
      ${ordIKnappen?'':`<div class="rk-label${knap.forklaring?' sætning':''}">${knap.forklaring || knap.tekst}</div>`}
      ${knap.note?`<div class="rk-note">${knap.note}</div>`:''}
      ${ekstraForside}
    </div>`;
  // Kompakt knap, når hero'en er lille (anmeldelse venter)
  const handling = `<button class="knap lys ånde kør-knap" onclick="${knap.aktion}">${ik(knap.ikon)} <span>${knap.tekst}</span> ${ik('pil')}</button>`;

  /* Forsiden er ét helt skærmbillede — men 'med-vaerktoej' gør den 64 px
     kortere, så toppen af værktøjskassen kigger frem under folden (KN 6/9).
     Klassen sidder KUN her: onboardingens hero har intet under sig og skal
     stå præcis som før. */
  const fuldHero = true;
  $('indhold').innerHTML = `
  <div class="hero${fuldHero?' fuld med-vaerktoej':''}">
    ${heroScene(variant, fuldHero ? skærmHøjde() : undefined)}
    <div class="overlay">
      <div class="h-top">
        <div class="h-logo">${logoSVG(true)}</div>
        <div class="ht-side"></div>
        <div class="ht-side højre">${arytmiTæller()}</div>
      </div>
      <div class="h-bund">
        <h1>${overskrift}</h1>
        ${underoverskrift?`<p class="h-under">${underoverskrift}</p>`:''}
        <p>${under}</p>
        ${fuldHero ? rundKnap : `<div class="handling">${handling}</div>`}
      </div>
    </div>
  </div>
  ${deltVarsel()}
  ${værktøjskasse()}`;
}

/* ---------- "HUN HAR DELT EN TUR MED DIG" ----------
   Trin 1 af to (KN 16/9). Udbakken melder id'erne; her vises de.

   Kortet ligger UNDER hero'en og ikke oven i den. Forsiden er ét helt
   skærmbillede (ARKITEKTUR.md), og en bjælke i toppen ville skubbe
   kompositionen — sol, overskrift, landskab — ned og ødelægge netop det,
   der gør forsiden til en forside. Man ser den, når man ruller, og man
   ruller, fordi værktøjskassen allerede kigger frem dernede.

   Er der flere på én gang, vises ÉN besked med et tal. Tre kort under
   hinanden ville være tre gange den samme nyhed. */
function deltVarsel(){
  const ider = Array.isArray(s.deltVarsel) ? s.deltVarsel.filter(id =>
    s.arytmer && s.arytmer.some(a => a && a.id === id)) : [];
  if(!ider.length) return '';

  const navn = partnerNavn().split(' ')[0];
  const tur = s.arytmer.find(a => a && a.id === ider[0]);
  const flere = ider.length > 1;

  return `<div class="delt-varsel">
    <div class="dv-krop">
      <div class="dv-titel">${flere
        ? t('delt.titelflere','{navn} har delt {antal} ture med dig',{navn:navn, antal:ider.length})
        : t('delt.titel','{navn} er i gang med at planlægge en tur',{navn:navn})}</div>
      ${!flere && tur && tur.destination ? `<div class="dv-under">${esc(destNavn(tur) || '')}</div>` : ''}
    </div>
    <button class="knap lille dv-se" onclick="seDeltTur('${esc(ider[0])}')">${t('delt.se','Se turen')}</button>
    <button class="dv-luk" onclick="lukDeltVarsel()" aria-label="${esc(t('delt.luk','Luk'))}">${ik('kryds')}</button>
  </div>`;
}
/* Åbn den delte tur. Beskeden ryddes: den har gjort sit arbejde i det
   sekund, hun trykker. */
function seDeltTur(id){
  s.deltVarsel = [];
  s.aktivId = id;
  gem();
  gåTil('turplan');
}
function lukDeltVarsel(){
  s.deltVarsel = [];
  gem();
  tegn();
}
/* Navnet paa turens destination, uanset hvilken af de tre slags den er.
   Egen destination har en adresse; et testet sted har et navn. */
function destNavn(tur){
  const d = tur && tur.destination;
  if(!d) return '';
  if(typeof d === 'string') return d;
  return d.navn || d.adresse || '';
}

function startForberedelse(){
  s.forberedelse = nyForberedelse();
  gem(); nulstilHistorik(); gåTil('turdato');
}
/* =============================================================
   FORBEREDELSEN — fire trin før kortet: hvornår · hvorfra ·
   hvor langt · hvad vil I opleve. Ét flow, uanset om man trykker
   Start eller den spontane knap.
   ============================================================= */
const RADIUS_TEKST = ['Under 30 min','30–60 min','1–2 timer','Mere end 4 timer'];
/* Køretid → fugleflugt. Landevejsfart ca. 65 km/t, og vejen er sjældent lige —
   derfor ca. 80 % af den kørte afstand. Bruges til cirklen på kortet.
   Sidste trin hedder "Mere end 4 timer" (KN 4/9), men radius bliver på 200 km:
   200 km fugleflugt fra et hvilket som helst punkt i Danmark rammer allerede
   hele landet, så et større tal ville ikke give ét sted mere at vælge imellem. */
const RADIUS_KM = [25, 50, 100, 200];
function turTilbage(trin){
  tilbage(['hjem','turdato','hvorfra','hvorlangt'][trin] || 'hjem');
}
/* Fælles trin-top: etiket, prikker, spørgsmål */
function wizardTop(trin, spm, under){
  const prikker = [0,1,2,3].map(i=>`<span class="wiz-prik ${i===trin?'aktiv':''} ${i<trin?'klaret':''}"></span>`).join('');
  return `<div class="wizard-top">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <button class="tilbage" onclick="turTilbage(${trin})">${ik('tilbage')}</button>
      <div class="wiz-etiket">${t('wizard.etiket','Planlæg turen · trin {trin} af 4',{trin:trin+1})}</div>
    </div>
    <div class="wiz-prik-række">${prikker}</div>
    <h1 class="wiz-spm">${spm}</h1>
    ${under?`<p class="wiz-under">${under}</p>`:''}
  </div>`;
}
function wizardBund(label, aktion, aktiv){
  return `<div style="margin-top:24px">
    <button class="knap primær bred" ${aktiv?`onclick="${aktion}"`:'disabled'}>${label} ${ik('pil')}</button>
  </div>`;
}
/* Den stille række nederst på en side: handlinger, man sjældent bruger, og som
   ikke skal konkurrere med Tilbage/Næste. Ét sted, så de ser ens ud overalt
   (31/8 — før stod den samme knap som "kontur lille" fire forskellige steder
   med tre forskellige bredder). */
function annullérLinje(){
  return `<div class="stille-række" style="margin-top:14px">
    <button class="knap stille fare" onclick="annullerForberedelse()">${t('faelles.annullertur','Annullér turen')}</button>
  </div>`;
}

/* Trin 1 — hvornår */
/* ---------- Hvornår vil I afsted? ----------

   KN 15/9: "Det er alt for klumpe dumbe. Det er ikke særlig elegangt."

   HVAD DER VAR GALT: tre selects til én dato (dag, måned, år — og året
   blev klippet af på en 375 px skærm), to tidsfelter i fuld bredde, og tre
   knapper, hvis tekst brækkede over i to linjer. Fem fuldbredde-blokke
   stablet oven på hinanden for at spørge om fire ting, hvoraf de tre er
   valgfrie.

   NU: samme rækkeform som profilen — ét spørgsmål pr. linje, svaret til
   højre. Det er ikke en ny komponent; det er den, der lige er bygget, og
   som Kennet har set og godkendt.

   ÉT FELT I STEDET FOR TRE: `<input type="date">` åbner telefonens egen
   kalender. Tre selects var svaret dengang appen ikke havde en native
   flade at læne sig op ad — men den har den, og en kalender er både
   hurtigere og sværere at taste forkert i. `min` holder afgangen i dag
   eller senere, og hjemkomsten på eller efter afgangen; det kunne de tre
   selects ikke.

   `datoSelects()` bliver stående: onboardingen bruger den til fødselsdagen,
   hvor en kalender, man skal bladre 40 år tilbage i, er det forkerte greb.

   "Hjem igen" er nu en dropdown i stedet for tre knapper. Tre valg, hvoraf
   ét er standard, er præcis det, en dropdown er til — og teksten brækker
   ikke over. `sætRetur()` og alt, der læser `f.retur`, er urørt.

   "Samme dag"/"Dagen efter" (KN 4/9) er relativt til AFGANGSDATOEN, ikke
   til den rigtige kalenderdato. Valgene hed "I dag"/"I morgen" fra 24/8, og
   de ord var kun sande, hvis man kørte i dag — ved en afgang om tre uger
   løj de. */
/* ---------- KALENDEREN (KN 17/9) ----------

   "Kunne man ikke med fordel rydde lidt op i felterne ved at have en
   datovælger hvor man bare vælger fra og til, så kan vi vel fjerne samme
   dag, næste dag og vælg dato?"

   Jo. Der stod fire felter og en dropdown, hvor spørgsmålet i
   virkeligheden er ét: hvilke dage er I væk? Og dropdownen gav to
   genveje og ét rigtigt svar — "Vælg dato" foldede så et FEMTE felt ud.
   Nu er der en kalender: tryk afrejse, tryk hjemkomst, og dagene imellem
   bliver markeret.

   ⚠️ DATAMODELLEN ER UÆNDRET, og det er med vilje. `f.retur` ('samme' /
   'næste' / 'dato') og `f.returDato` sættes stadig — de UDLEDES bare af
   de to datoer nu i stedet for at blive valgt. Fem steder læser dem
   (turSlutDato, turHjemkomstTekst, flerdagsTur, delingens nyttelast og
   crawleren), og ingen af dem skulle røres. Havde jeg skiftet modellen
   ud, var det fem ting mere, der kunne gå i stykker for en flades skyld.

   Én dag = afrejse og hjemkomst på samme dato. Det er ikke en særregel;
   det er hvad en endagstur ER. */

/* Hvilken måned kalenderen står på. Ikke i tilstanden: det er en
   bladre-position, ikke noget brugeren ejer. Nulstilles til turens måned,
   hver gang skærmen åbnes. */
let kalenderMdr = null;

function isoFra(d){ return d.toISOString().slice(0,10); }
function isoPlus(iso, dage){
  const d = new Date(iso+'T12:00:00'); d.setDate(d.getDate()+dage); return isoFra(d);
}
function dageMellem(a, b){
  return Math.round((new Date(b+'T12:00:00') - new Date(a+'T12:00:00'))/86400000);
}

/* Udleder retur-formen af de to datoer. Rækkefølgen er den samme som de
   gamle valg, så en gammel tur læses præcis som før. */
function sætReturFraDatoer(f){
  if(!f || !f.dato || !f.returDato) return;
  const spring = dageMellem(f.dato, f.returDato);
  f.retur = spring <= 0 ? 'samme' : spring === 1 ? 'næste' : 'dato';
  if(spring <= 0) f.returDato = f.dato;
}

/* Turens to datoer, altid som konkrete ISO-dage — også for de gamle ture,
   der kun har 'samme'/'næste' stående. */
function turDatoer(f){
  const fra = f.dato || null;
  if(!fra) return { fra:null, til:null };
  let til = f.returDato || null;
  if(!til){
    if(f.retur === 'næste') til = isoPlus(fra, 1);
    else til = fra;
  }
  if(dageMellem(fra, til) < 0) til = fra;
  return { fra, til };
}

function kalenderSkift(delta){
  const d = new Date((kalenderMdr || isoFra(new Date())) + 'T12:00:00');
  d.setDate(1); d.setMonth(d.getMonth() + delta);
  kalenderMdr = isoFra(d);
  kalenderTegn();
}

/* Første tryk sætter afrejsen. Andet tryk lukker perioden. Trykker man FØR
   afrejsen, starter man forfra dér — det er altid en ny afrejse, man
   mener, aldrig en hjemkomst før afgang.

   ⚠️ DET SKAL VÆRE EN EKSPLICIT TILSTAND, og den første udgave prøvede at
   udlede den af datoerne: "er fra og til ens, venter vi på en slutdato".
   Det holdt ikke. En ny tur har ALLEREDE dagens dato stående som
   udgangspunkt, så fra og til var ens, før nogen havde rørt noget — og et
   tryk på den 25. blev læst som "hjem den 25." i stedet for "afsted den
   25.". Man fik en tur på otte nætter fra i dag ud af ét tryk.

   Flaget siger, hvad der faktisk er sket, i stedet for at gætte det ud af
   noget, der lignede.

   ⚠️ DET NULSTILLES IKKE, NÅR SKÆRMEN TEGNES, og det er ikke en
   forglemmelse. `kalenderVælg` kalder `tegn()`, som kalder
   `skærmTurDato()` — en nulstilling dér ville slå flaget fra i samme
   øjeblik, det blev sat, og andet tryk ville starte forfra i stedet for
   at lukke perioden. Kalenderen ville se ud til aldrig at kunne vælge
   mere end én dag.

   Det er heller ikke nødvendigt: efter en færdig periode står flaget
   allerede på false, så næste tryk begynder en ny. Den eneste tilstand,
   der overlever et skærmskift, er "vi mangler en hjemkomstdato" — og
   dér er det rigtige svar netop at lukke perioden. */
let kalenderVenterPåSlut = false;

/* KALENDEREN ER FOLDET SAMMEN, indtil man beder om den (KN 28/9). Den
   fylder en hel skærm, og på en ny tur står dagens dato der allerede — så
   det meste af tiden er den bare i vejen for klokkeslættene og "Videre".
   Samme regel som flaget ovenfor: den nulstilles IKKE i skærmTurDato(),
   for kalenderVælg() tegner hele skærmen om, og så ville kalenderen
   klappe i efter første tryk. Den lukkes i efterNavigation() i stedet —
   forlader man skærmen, er den lukket, når man kommer tilbage. */
let kalenderÅben = false;
/* Foldet åbnes fra en af de to rækker — Afrejse eller Hjemkomst — og
   rækken, man trykkede på, bestemmer, hvilken dag næste tryk i kalenderen
   sætter. Det er det, der gør skærmen til at forstå: man vælger ikke "en
   periode", man trykker på det, man vil rette.

   Det sker UDEN tegn(). Gitteret ligger i DOM'en hele tiden, og det er kun
   klasser, der skifter — så kan det glide ud OG ind. En gentegning ville
   sætte det hele på plads i ét hug, uden bevægelse. Trykker man på den
   række, der allerede er åben, lukker den. */
function kalenderÅbn(hvad){
  const f = s.forberedelse, fold = $('kalender-fold'); if(!f || !fold) return;
  const hjem = hvad === 'hjem' && !!f.dato;
  if(fold.classList.contains('åben') && kalenderVenterPåSlut === hjem){
    kalenderÅben = false; kalenderVis(false); return;
  }
  kalenderVenterPåSlut = hjem;
  kalenderÅben = true;
  /* Bladr hen til den dag, man er ved at rette. */
  const { fra, til } = turDatoer(f);
  const iso = hjem ? til : fra;
  if(iso){ kalenderMdr = iso; kalenderTegn(); }
  kalenderVis(true);
}
function kalenderVis(åben){
  const fold = $('kalender-fold'); if(!fold) return;
  fold.classList.toggle('åben', åben);
  /* Lukket er gitteret stadig i DOM'en — inert holder tabulatoren og
     skærmlæseren ude af dage, man ikke kan se. */
  fold.inert = !åben;
  document.querySelectorAll('.rejse-række').forEach(r => {
    const aktiv = åben && (r.dataset.hvad === 'hjem') === kalenderVenterPåSlut;
    r.classList.toggle('aktiv', aktiv);
    const knap = r.querySelector('.rejse-dato');
    if(knap) knap.setAttribute('aria-expanded', String(aktiv));
  });
  const hjælp = $('kal-hjælp');
  if(hjælp) hjælp.textContent = kalenderHjælp();
}
function kalenderHjælp(){
  return kalenderVenterPåSlut
    ? t('turdato.hjaelphjem','Tryk på den dag, I kommer hjem')
    : t('turdato.hjaelpud','Tryk på den dag, I kører');
}

function kalenderVælg(iso){
  const f = s.forberedelse; if(!f) return;
  let lukEfter = false;
  if(!kalenderVenterPåSlut || !f.dato || iso < f.dato){
    /* Afrejsen flyttes. Hjemkomsten bliver stående, hvis den stadig ligger
       efter — retter man bare afgangsdagen, skal man ikke vælge hjem forfra.
       Bagefter spørger kalenderen efter hjemkomsten. */
    f.dato = iso;
    if(!f.returDato || f.returDato < iso) f.returDato = iso;
    sætReturFraDatoer(f);
    kalenderVenterPåSlut = true;
  } else {
    f.returDato = iso;
    sætReturFraDatoer(f);
    kalenderVenterPåSlut = false;
    lukEfter = true;
  }
  gem();
  /* Hele skærmen tegnes om, ikke bare gitteret. "Videre" er slået fra,
     indtil der ER en dato (wizardBund afgør det ved tegningen), og
     sammenfatningen nedenunder skal følge med. To halve opdateringer, der
     skal holdes i takt, er en fejl, der venter — og et tryk er ikke et
     træk, så gitteret når ikke at flytte sig under fingeren.

     kalenderMdr nulstilles i skærmTurDato(), men den valgte dato ligger nu
     i turen, så kalenderen åbner på den måned, man trykkede i. */
  tegn();
  /* Perioden er lukket — kalenderen har gjort sit og folder sig sammen, så
     klokkeslættene og "Videre" kommer op igen. Et øjeblik efter, så man
     når at se sit valg først. Efter FØRSTE tryk bliver den stående: man
     mangler hjemkomsten. Er man gået videre imens, gør kalenderVis intet. */
  if(lukEfter) setTimeout(() => { kalenderÅben = false; kalenderVis(false); }, 380);
}

function kalenderTegn(){
  const el = $('kalender'); if(!el) return;
  el.innerHTML = kalenderGitter();
  /* Én lytter på beholderen, ikke på hver dag. Den overlever, at gitteret
     tegnes om — beholderen er den samme, det er kun indmaden, der skiftes.
     Derfor sættes den kun, hvis den ikke er der. */
  if(!el.dataset.lytter){
    el.dataset.lytter = '1';
    el.addEventListener('click', e => {
      const knap = e.target.closest('.kal-dag[data-iso]');
      if(knap && !knap.disabled) kalenderVælg(knap.dataset.iso);
    });
  }
}
function kalenderGitter(){
  const f = s.forberedelse;
  const iDag = isoFra(new Date());
  const { fra, til } = turDatoer(f);
  const vis = new Date((kalenderMdr || fra || iDag) + 'T12:00:00');
  vis.setDate(1);
  const år = vis.getFullYear(), md = vis.getMonth();

  /* Mandag først. getDay() giver søndag=0, så søndag skubbes bagest. */
  const førsteUgedag = (new Date(år, md, 1).getDay() + 6) % 7;
  const dageIMd = new Date(år, md+1, 0).getDate();

  /* Man kan ikke planlægge en tur i fortiden — men man skal kunne BLADRE
     tilbage uden at knappen forsvinder, ellers ligner kalenderen ødelagt. */
  const førsteIMd = år + '-' + String(md+1).padStart(2,'0') + '-01';
  const kanTilbage = førsteIMd > iDag.slice(0,8) + '01';

  let celler = '';
  for(let i = 0; i < førsteUgedag; i++) celler += '<div class="kal-tom"></div>';
  for(let d = 1; d <= dageIMd; d++){
    const iso = år + '-' + String(md+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    const fortid = iso < iDag;
    const erFra = fra && iso === fra;
    const erTil = til && iso === til;
    const imellem = fra && til && iso > fra && iso < til;
    const klasser = ['kal-dag'];
    if(fortid) klasser.push('fortid');
    if(erFra) klasser.push('fra');
    if(erTil) klasser.push('til');
    if(erFra && erTil) klasser.push('ene');
    if(imellem) klasser.push('imellem');
    if(iso === iDag) klasser.push('idag');
    /* Datoen ligger i `data-iso`, og ét kald lytter for hele gitteret —
       ikke en onclick pr. dag. 31 inline-handlere, der hver især skal have
       en ISO-dato ind i en attribut med anførselstegn i, er 31 chancer for
       at sætte et citationstegn forkert. Lytteren sættes i kalenderTegn(). */
    /* ⚠️ TALLET SKAL LIGGE I ET SPAN. Den valgte dag får sin kobbercirkel
       af et ::before, og et ::before lægger sig OVEN PÅ en bar tekstnode —
       tallet forsvandt, og dagen så tom ud. Et element kan løftes over med
       z-index; en tekstnode kan ikke. */
    celler += '<button type="button" class="' + klasser.join(' ') + '" data-iso="' + iso + '"'
      + (fortid ? ' disabled' : '')
      + ' aria-label="' + esc(pænDato(iso)) + '"><span>' + d + '</span></button>';
  }

  return '<div class="kal-top">'
    + '<button type="button" class="kal-pil" ' + (kanTilbage ? 'onclick="kalenderSkift(-1)"' : 'disabled')
    + ' aria-label="' + esc(t('turdato.forrigemaaned','Forrige måned')) + '">‹</button>'
    + '<div class="kal-maaned">' + MDR[md] + ' ' + år + '</div>'
    + '<button type="button" class="kal-pil" onclick="kalenderSkift(1)"'
    + ' aria-label="' + esc(t('turdato.naestemaaned','Næste måned')) + '">›</button>'
    + '</div>'
    + '<div class="kal-uge">' + ['ma','ti','on','to','fr','lø','sø'].map(u=>'<span>'+u+'</span>').join('') + '</div>'
    + '<div class="kal-gitter">' + celler + '</div>';
}

/* Dagen kort, som på en billet: "man. 28. sep." Året kommer kun med,
   når det ikke er i år. */
const UGEDAG_KORT = ['søn.','man.','tirs.','ons.','tors.','fre.','lør.'];
const MDR_KORT = ['jan.','feb.','mar.','apr.','maj','jun.','jul.','aug.','sep.','okt.','nov.','dec.'];
function kortDato(iso){
  const d = new Date(iso + 'T12:00:00');
  let tekst = UGEDAG_KORT[d.getDay()] + ' ' + d.getDate() + '. ' + MDR_KORT[d.getMonth()];
  if(d.getFullYear() !== new Date().getFullYear()) tekst += ' ' + d.getFullYear();
  return tekst;
}

/* DATOTRINNET SOM EN REJSEPLAN (KN 28/9). Én boks med "28.09 – 30.09.2026"
   var ikke til at forstå: hvor skulle man trykke, og hvad var afrejse og
   hvad hjem? Nu er der to rækker, som i enhver rejseapp — Afrejse og
   Hjemkomst — hver med sin dag og sit klokkeslæt, og rejselængden står
   imellem dem. Trykker man på en dag, folder kalenderen sig ud under. */
function rejseRække(hvad){
  const f = s.forberedelse;
  const { fra, til } = turDatoer(f);
  const ud = hvad === 'ud';
  const iso = ud ? fra : til;
  const åben = kalenderÅben || !f.dato;
  const aktiv = åben && (ud ? !kalenderVenterPåSlut : kalenderVenterPåSlut);
  const etiket = ud ? t('turdato.afrejse','Afrejse') : t('turdato.hjemkomst','Hjemkomst');
  const felt = ud ? 'afgangstid' : 'returtid';
  const tid = ud ? f.afgangstid : f.returtid;
  return `<div class="rejse-række${aktiv ? ' aktiv' : ''}" data-hvad="${hvad}">
    <button type="button" class="rejse-dato" onclick="kalenderÅbn('${hvad}')"
      aria-expanded="${aktiv}" aria-controls="kalender-fold"
      aria-label="${esc(etiket)}: ${esc(iso ? pænDato(iso) : t('turdato.vaelgdag','Vælg dag'))}">
      <span class="rejse-etiket">${ik(ud ? 'bil' : 'hjem')}${esc(etiket)}</span>
      <span class="rejse-værdi">${iso ? esc(kortDato(iso)) : '<span class="dæmpet">' + esc(t('turdato.vaelgdag','Vælg dag')) + '</span>'}</span>
    </button>
    <label class="rejse-tid">
      <span class="rejse-etiket">${t('turdato.cakl','ca. kl.')}</span>
      <input type="time" step="900" value="${esc(tid||'')}" onchange="sætTid('${felt}', this.value)"
        aria-label="${esc(ud ? t('turdato.afgangstid','Ca. hvornår kører I?') : t('turdato.hjemtid','Ca. hvornår er I hjemme?'))}">
    </label>
  </div>`;
}

/* Rejselængden i DAGE, begge ender med: fredag til søndag er 3 dage, en
   endagstur er 1 dag. Nætterne står stadig på turplanen. */
function rejseLængde(){
  const { fra, til } = turDatoer(s.forberedelse);
  if(!fra) return '';
  const dage = Math.max(0, dageMellem(fra, til)) + 1;
  return dage === 1 ? t('turdato.endagsantal','1 dag') : t('turdato.dage','{antal} dage',{antal:dage});
}

function datoFelter(){
  const f = s.forberedelse;
  /* Uden en dato er der intet at folde sammen om — så står kalenderen åben. */
  const åben = kalenderÅben || !f.dato;
  const længde = rejseLængde();
  return `<div class="kort dato-kort">
    ${rejseRække('ud')}
    <div class="rejse-mellem" aria-hidden="${!længde}"><span>${esc(længde)}</span></div>
    ${rejseRække('hjem')}
    <div id="kalender-fold" class="dato-fold${åben ? ' åben' : ''}"${åben ? '' : ' inert'}>
      <div class="dato-fold-indre">
        <p id="kal-hjælp" class="kal-hjælp">${esc(kalenderHjælp())}</p>
        <div id="kalender">${kalenderGitter()}</div>
      </div>
    </div>
  </div>`;
}

/* Ingen tegn() her: feltet er lige blevet forladt, og en gentegning ville
   rykke rundt under fingeren på vej videre. Turplanen henter selv den nye
   værdi, næste gang den tegnes. */
function sætTid(felt, v){ s.forberedelse[felt] = v || null; gem(); tidTjekOpdater(); }

/* Hjem før afgang (KN 5/10): samme dag, og hjemkomstens klokkeslæt ligger
   på eller før afrejsens. Kalenderen kan ikke give det — den giver aldrig en
   hjemDAG før afrejsen — men to klokkeslæt på én dag kan. */
function tidenErBagvendt(f){
  if(!f) return false;
  const { fra, til } = turDatoer(f);
  return !!(fra && fra === til && f.afgangstid && f.returtid && f.returtid <= f.afgangstid);
}
function turDatoBund(){
  const f = s.forberedelse;
  return wizardBund(t('faelles.videre','Videre'),"gåTil('hvorfra')", !!f.dato && !tidenErBagvendt(f));
}
/* Beskeden venter, mens kalenderen spørger efter hjemdagen: efter første
   tryk er afrejse og hjemkomst altid samme dag, og det er ikke en fejl endnu. */
function visTidAdvarsel(){ return tidenErBagvendt(s.forberedelse) && !kalenderVenterPåSlut; }
function tidAdvarsel(){
  return `<p id="tid-advarsel" class="tid-advarsel" role="alert"${visTidAdvarsel() ? '' : ' hidden'}>${t('turdato.bagvendt','Hjemkomsten ligger før afrejsen. Ret klokkeslættet, eller vælg en senere hjemdag.')}</p>`;
}
/* sætTid tegner ikke skærmen om (se ovenfor), så beskeden og knappen
   opdateres hver for sig — kun på datotrinnet, hvor de findes. */
function tidTjekOpdater(){
  const bund = document.getElementById('turdato-bund');
  if(!bund) return;
  bund.innerHTML = turDatoBund();
  const adv = document.getElementById('tid-advarsel');
  if(adv) adv.hidden = !visTidAdvarsel();
}

function skærmTurDato(){
  const f = s.forberedelse;
  if(!f){ gåTil('hjem'); return; }
  /* Kalenderen åbner på turens egen måned — ikke dér, hvor man sidst
     bladrede hen. Har man en tur i oktober og går ind og retter, skal
     oktober stå der. */
  kalenderMdr = null;
  $('indhold').innerHTML = `<div class="side anim">
    ${wizardTop(0,
      t('turdato.spm','Hvornår vil I afsted?'),
      t('turdato.under','Datoen først — så ved vi, hvornår solen går ned det sted, I vælger til sidst.'))}
    ${datoFelter()}
    ${tidAdvarsel()}
    <div id="turdato-bund">${turDatoBund()}</div>
    ${annullérLinje()}
  </div>`;
  /* Gitteret tegnes igen her — ikke for indholdets skyld, men for
     lytterens: `datoFelter()` leverer en streng, og en streng kan ikke
     bære en click-handler. Samme mønster som adresseTegnForslag(). */
  kalenderTegn();
}

/* Trin 2 — hvorfra */
function skærmHvorfra(){
  const f = s.forberedelse;
  if(!f){ gåTil('hjem'); return; }
  $('indhold').innerHTML = `<div class="side anim">
    ${wizardTop(1,
      t('hvorfra.spm','Hvor starter I fra?'),
      t('hvorfra.under','Vi bruger jeres startpunkt til at måle, hvor langt der er til hvert sted.'))}
    <div class="kort">
      <!-- kontur, ikke primær (31/8): skærmens ene rigtige greb er "Videre"
           nederst. Det her er en genvej til at udfylde feltet. -->
      <button class="knap kontur bred" onclick="startGPS()">${ik('gps')} ${t('hvorfra.gps','Brug min placering')}</button>
      <p class="dæmpet" style="text-align:center;font-size:12.5px;margin:12px 0">${t('hvorfra.eller','— eller vælg en anden adresse —')}</p>
      <div>
        <!-- esc() om teksten: den skal ind i et ATTRIBUT, og et anførselstegn
             i prosaen ville ellers lukke det for tidligt. -->
        <input type="text" id="spAdr" placeholder="${esc(t('hvorfra.soegadresse','Søg by eller adresse …'))}" value="${esc(f.startSøg||'')}" autocomplete="off" spellcheck="false" oninput="startSkriv(this.value)">
        <div id="start-forslag"></div>
      </div>
      ${f.startNavn?`<div class="sted-chips" style="margin-top:14px"><span class="sted-chip valgt">${ik('nål')} ${esc(f.startNavn)}</span></div>`:''}
    </div>
    ${wizardBund(t('faelles.videre','Videre'),"gåTil('hvorlangt')", !!f.startNavn)}
    ${annullérLinje()}
  </div>`;
  startTegnForslag();
}
function startGPS(){
  const sæt = (navn,xy)=>{ s.forberedelse.startNavn=navn; s.forberedelse.startXY=xy; gem(); tegn(); flash(navn+' sat som startpunkt.','gps'); };
  /* ⚠️ HER STOD EN FALSK RESERVE: fandt telefonen ingen placering, blev
     startpunktet sat til "Din placering (demo — Aarhus)" — et punkt i
     Aarhus, som resten af guiden så målte afstande fra, som om det var
     rigtigt (KN 28/9). En pladsholder må aldrig ligne et svar. Nu siger
     vi det, og feltet nedenunder er vejen videre. */
  const fejl = () => flash(t('hvorfra.gpsfejl','Vi kunne ikke finde din placering. Skriv jeres adresse i stedet.'),'gps');
  if(!navigator.geolocation){ fejl(); return; }
  flash('Finder din placering …','gps');
  navigator.geolocation.getCurrentPosition(pos=>{
    const xy = geoTilXY(pos.coords.latitude, pos.coords.longitude);
    sæt('Din placering', {x:Math.round(xy.x), y:Math.round(xy.y)});
  }, fejl, {timeout:6000});
}
/* Startpunktet havde NØJAGTIG samme fejl som bysøgningen på
   destinationsskærmen: en Vælg-knap og den håndskrevne liste på 25 byer.
   Skrev man "Odder", fik man "Byen er ikke i prototypens liste endnu" —
   og det er et dårligt sted at møde den besked, for det er skærm ét i
   guiden. Samme greb her som dér, og samme kilde (`byer.js`). */
let startForslag = [];
/* ADRESSER OGSÅ (KN 28/9). Feltet kendte kun byer, så "askelunden 5 odder"
   fik "Den by kender vi ikke" — på skærm ét i guiden, og med en adresse,
   der findes. Nu slår feltet op i adresseregistret ved siden af byerne,
   præcis som trin 3 gør (`registerSøg`). Byerne kommer med det samme fra
   telefonen; adresserne et øjeblik efter. */
let startAdresser = [];
let startVeje = [];
let startBesked = '';
let startVenter = false;
let startUr = null;

function startSkriv(værdi){
  if(!s.forberedelse) return;
  s.forberedelse.startSøg = værdi;
  startForslag = (typeof ArytmiByer !== 'undefined') ? ArytmiByer.søg(værdi, 6) : [];
  startAdresser = []; startVeje = []; startBesked = ''; startVenter = false;
  if(startUr){ clearTimeout(startUr); startUr = null; }
  if(værdi.trim().length >= 3 && typeof fetch === 'function'){
    /* Samme korte pause som i trin 3: ét opslag for en hel adresse, ikke
       ét pr. tastetryk. */
    startVenter = true;
    startUr = setTimeout(startHentAdresser, 250);
  }
  startTegnForslag();
}

async function startHentAdresser(){
  const f = s.forberedelse; if(!f) return;
  const q = (f.startSøg || '').trim();
  if(q.length < 3) return;
  let fund = null, fejl = false;
  try{ fund = await registerSøg(q); }catch(e){ fejl = true; }
  /* Har hun skrevet videre imens, er svaret til et spørgsmål, der ikke
     længere stilles — så tegner det næste svar. */
  if(!s.forberedelse || (s.forberedelse.startSøg || '').trim() !== q) return;
  startVenter = false;
  startAdresser = fund ? fund.forslag : [];
  startVeje = fund ? fund.veje : [];
  startBesked = fejl
    ? t('destination.adresseoffline','Vi kan ikke slå adressen op lige nu. Det, du har skrevet, bliver stående — prøv igen, når der er dækning.')
    : '';
  startTegnForslag();
}

function startTegnForslag(){
  const el = $('start-forslag');
  if(!el) return;
  const skrevet = ((s.forberedelse && s.forberedelse.startSøg) || '').trim();
  const besked = tekst => '<p class="dæmpet" style="font-size:12.5px;margin:10px 0 0">' + tekst + '</p>';
  /* Én rolig liste under feltet (KN 28/9: "formateringen er ikke særlig
     flot"). Før var hvert fund en fed, centreret pille, og en adresse som
     "Askelunden 5, 4660 Store Heddinge" brækkede midt i. Nu står gaden
     øverst og byen dæmpet under — sådan læser man en adresse. */
  const række = (onclick, ikon, top, under) =>
    '<button type="button" class="forslag-række" onclick="' + onclick + '">'
    + '<span class="forslag-ikon">' + ik(ikon) + '</span>'
    + '<span class="forslag-tekst"><span class="forslag-top">' + esc(top) + '</span>'
    + (under ? '<span class="forslag-under">' + esc(under) + '</span>' : '') + '</span></button>';
  /* "Askelunden 5, Hou, 8300 Odder" → gaden for sig, resten under. */
  const delt = tekst => { const i = tekst.indexOf(','); return i < 0 ? [tekst, ''] : [tekst.slice(0, i), tekst.slice(i + 1).trim()]; };
  const rækker = startForslag.map((b,i) => række('vælgStartBy(' + i + ')', 'nål', b.navn, String(b.postnr || '')))
    .concat(startAdresser.map((a,i) => { const [top, under] = delt(a.tekst); return række('vælgStartAdresse(' + i + ')', 'hjem', top, under); }));
  let ud = rækker.length ? '<div class="forslag-liste">' + rækker.join('') + '</div>' : '';
  if(ud){ el.innerHTML = ud; return; }
  /* Intet at vise. Hvad der så skal stå, afhænger af, HVORFOR:
     for lidt skrevet · registret er ikke færdigt · det fejlede · en vej
     uden husnummer · eller der findes virkelig intet. */
  if(skrevet.length < 2){ el.innerHTML = ''; return; }
  /* Registret kan være et par sekunder om det. Et tomt felt imens ligner,
     at intet sker. */
  if(startVenter){ el.innerHTML = besked(esc(t('hvorfra.soeger','Søger …'))); return; }
  if(startBesked){ el.innerHTML = besked(esc(startBesked)); return; }
  if(startVeje.length){
    el.innerHTML = besked(esc(t('destination.adressevej','Skriv også husnummeret. Vejen findes her:'))
      + '<br>' + startVeje.slice(0,4).map(esc).join('<br>'));
    return;
  }
  el.innerHTML = besked(esc(t('hvorfra.intet','Vi kan hverken finde en by eller en adresse med det navn. Tjek stavemåden — eller brug din placering.')));
}

function vælgStartBy(nr){
  const b = startForslag[nr];
  const f = s.forberedelse;
  if(!b || !f) return;
  startForslag = []; startAdresser = []; startVeje = [];
  const xy = geoTilXY(b.lat, b.lon);
  f.startNavn = b.navn;
  f.startSøg = '';
  f.startXY = { x: Math.round(xy.x), y: Math.round(xy.y) };
  gem(); tegn();
  flash(t('hvorfra.satsom','{navn} er sat som startpunkt.',{navn:b.navn}), 'gps');
}

/* Registret giver kun et id i søgningen; punktet hentes først nu. Det
   øjeblik SIGES, ellers ligner knappen en, der ikke virker. */
async function vælgStartAdresse(nr){
  const a = startAdresser[nr];
  if(!a) return;
  startForslag = []; startAdresser = []; startVeje = [];
  startBesked = t('destination.adressehenter','Henter stedet …');
  startTegnForslag();
  const punkt = await registerPunkt(a.id);
  const f = s.forberedelse;
  if(!f) return;
  if(!punkt){
    startBesked = t('hvorfra.adressepunkt','Vi fandt adressen, men ikke stedet på kortet. Prøv igen — eller brug din placering.');
    startTegnForslag();
    return;
  }
  const xy = geoTilXY(punkt.lat, punkt.lon);
  startBesked = '';
  f.startNavn = a.tekst;
  f.startSøg = '';
  f.startXY = { x: Math.round(xy.x), y: Math.round(xy.y) };
  gem(); tegn();
  flash(t('hvorfra.satsom','{navn} er sat som startpunkt.',{navn:a.tekst}), 'gps');
}

/* Trin 3 — hvor langt */
function skærmHvorLangt(){
  const f = s.forberedelse;
  if(!f){ gåTil('hjem'); return; }
  $('indhold').innerHTML = `<div class="side anim">
    ${wizardTop(2,
      t('hvorlangt.spm','Hvor langt vil I køre?'),
      t('hvorlangt.under','Hvor langt har I lyst til at køre for at komme væk?'))}
    <div class="kort">
      <div class="radius-vis">
        <div class="radius-tal">${RADIUS_TEKST[f.radius]}</div>
        <div class="radius-under">${t('hvorlangt.fra','kørsel fra {sted}',{sted:f.startNavn||t('hvorlangt.intetsted','jeres startpunkt')})}</div>
      </div>
      <input type="range" class="radius" min="0" max="3" step="1" value="${f.radius}" oninput="s.forberedelse.radius=+this.value;gem();opdaterRadius(this.value)">
      <div class="radius-mærker"><span>${t('hvorlangt.maerke1','30 min')}</span><span>${t('hvorlangt.maerke2','1 t')}</span><span>${t('hvorlangt.maerke3','2 t')}</span><span>${t('hvorlangt.maerke4','4 t+')}</span></div>
    </div>
    <!-- Egen destination (KN 15/9). Den hoerer HER og ikke laengere fremme:
         ved man allerede, hvor man skal hen, er radius, oensker og de tre
         forslag tre spoergsmaal, man ikke har brug for at svare paa.

         ⚠️ DET ENESTE STED, MAN SÆTTER SIT EGET STED (KN 28/9). Destinations-
         skærmen med kortet er væk; dens søgefelt (by ELLER adresse, se
         stedSkriv()) står her i stedet. Pin og "Brug min placering" fulgte
         ikke med. Et sted uden adresse rammes med nærmeste adresse eller by. -->
    <div class="kort">
      <label class="felt-etiket" style="margin-top:0">${t('hvorlangt.egenspm','Ved I allerede, hvor I skal hen?')}</label>
      <p class="dæmpet" style="font-size:12.5px;margin:0 0 8px">${t('hvorlangt.egenunder2','Søg på en by eller en adresse, så springer vi forslagene over og planlægger turen derhen i stedet.')}</p>
      <input type="text" id="bySøg" placeholder="${esc(t('destination.soegsted','Søg by eller adresse …'))}" value="${esc(søgTekst)}" autocomplete="off" spellcheck="false" oninput="stedSkriv(this.value)">
      <div id="by-forslag"></div>
      <div id="adr-forslag"></div>
    </div>
    ${wizardBund(t('faelles.videre','Videre'),"gåTil('onsker')", true)}
    ${annullérLinje()}
  </div>`;
  byTegnForslag();
  adresseTegnForslag();
}
function opdaterRadius(v){ const el = document.querySelector('.radius-tal'); if(el) el.textContent = RADIUS_TEKST[+v]; }

/* Trin 4 — hvad vil I opleve. Herfra går man videre til kortet. */
function skærmØnsker(){
  const f = s.forberedelse;
  if(!f){ gåTil('hjem'); return; }
  const o = f.oplevelser;
  const seg = (gruppe, a, b) => `
    <div class="seg-række">
      <div class="seg-titel">${t('oplevelser.enteneller','{a} eller {b}?',{a:a.titel,b:b.titel.toLowerCase()})}</div>
      <div class="seg-valg">
        <button class="seg-knap ${o[gruppe]===a.v?'valgt':''}" onclick="sætØnske('${gruppe}','${a.v}')">${ik(a.ik)}<span>${a.titel}</span></button>
        <button class="seg-knap ${o[gruppe]===b.v?'valgt':''}" onclick="sætØnske('${gruppe}','${b.v}')">${ik(b.ik)}<span>${b.titel}</span></button>
      </div>
    </div>`;
  const alle = o.lys && o.natur && o.stemning;
  $('indhold').innerHTML = `<div class="side anim">
    ${wizardTop(3,t('oplevelser.spm','Hvad vil I opleve?'),t('oplevelser.under','Vælg det, der frister — eller lad os overraske jer.'))}
    ${seg('lys', {titel:'Solopgang',v:'solopgang',ik:'solop'}, {titel:'Solnedgang',v:'solnedgang',ik:'sol'})}
    ${seg('natur', {titel:'Vand',v:'vand',ik:'vand'}, {titel:'Land',v:'land',ik:'skov'})}
    ${seg('stemning', {titel:'Isoleret',v:'isoleret',ik:'måne'}, {titel:'Livligt',v:'livligt',ik:'folk'})}
    <button class="knap kontur bred" style="margin-top:8px" onclick="overrasker()">${ik('gnist')} ${t('oplevelser.overrask','Eller overrask mig')}</button>
    ${wizardBund(t('oplevelser.setre','Se tre steder til jer'),"gåTil('forslag')", !!alle)}
    ${annullérLinje()}
  </div>`;
}
function sætØnske(gruppe,v){ s.forberedelse.oplevelser[gruppe]=v; gem(); tegn(); }
function overrasker(){
  const r = a => a[Math.floor(Math.random()*a.length)];
  s.forberedelse.oplevelser = { lys:r(['solopgang','solnedgang']), natur:r(['vand','land']), stemning:r(['isoleret','livligt']) };
  gem(); gåTil('forslag');
}

/* =============================================================
   TRE STEDER — resultatet af de fire trin. Ingen opfundne steder:
   vi rangerer vores egne testede destinationer efter radius,
   ønsker og afstand og viser de tre bedste. Man kan trykke ind på
   hver enkelt, læse det praktiske, og først dér vælge.
   ============================================================= */
/* ⚠️ IKKE DE SAMME TRE HVER GANG (KN 28/9): "Baseret på når man vælger
   køreradius/køretid vil jeg gerne at det ikke er de samme forslag man får
   hver gang ... hvis der ikke er andre destinationer, bliver det
   selvfølgelig nødt til at være det samme."

   Rækkefølgen er den samme som før — inden for radius først, så ønskerne,
   så "klar" — men blandt steder, der står LIGE på de tre, trækkes der lod
   i stedet for at tage de nærmeste. Så varierer det, når der er noget at
   variere med, og er der kun tre inden for radius, bliver det de tre.

   Lodtrækningen gemmes på turen (f.forslag) sammen med en nøgle for
   svarene. Ellers ville forslagene skifte ved hver gentegning, og kortet
   ville vise tre andre steder end listen (se tegnForslagKort()). Rettes radius,
   startpunkt eller ønsker, passer nøglen ikke længere, og der trækkes nyt. */
function forslagNøgle(f, start){
  return JSON.stringify([f.radius|0, start ? [start.lat, start.lon] : null,
    f.oplevelser || null]);
}
function forslagSteder(){
  const f = s.forberedelse;
  const start = startGeo();
  const kmMax = start ? RADIUS_KM[(f.radius)|0] : null;
  const alle = TESTEDE.map(t=>{
    const km = start ? Math.round(afstandKm(start, testetGeo(t))) : null;
    const m = ønskeMatch(t);
    return { t, km, match:m, indenfor: km==null || km<=kmMax };
  });
  const nøgle = forslagNøgle(f, start);
  const gemt = f.forslag;
  /* "Foreslå 3 nye" (OD 4/10) giver seks i alt, og kun én gang pr. tur. De
     tre første bliver stående; de næste tre i rækken lægges bagved. */
  const antal = Math.min(f.flereForslag ? 6 : 3, alle.length);
  let fundet = null;
  if(gemt && gemt.nøgle === nøgle && Array.isArray(gemt.ids)){
    fundet = gemt.ids.map(id=>alle.find(r=>r.t.id===id)).filter(Boolean);
    // Er et af stederne forsvundet fra kataloget, trækkes der forfra.
    if(fundet.length !== gemt.ids.length) fundet = null;
    else if(fundet.length >= antal) return fundet;
  }
  const lod = new Map(alle.map(r=>[r.t.id, Math.random()]));
  const rangeret = alle.sort((a,b)=>{
    /* Steder inden for radius kommer altid først, og dér afgør ønskerne.
       Skal vi ud over radius for at fylde tre pladser op, er det den
       korteste vej der tæller — ellers foreslår vi 126 km, fordi et sted
       på papiret rammer tre ønsker. */
    if(a.indenfor !== b.indenfor) return b.indenfor - a.indenfor;
    if(!a.indenfor) return (a.km||0) - (b.km||0);
    return ((b.match?b.match.træf:0)-(a.match?a.match.træf:0))
        || (b.t.klar-a.t.klar)
        || (lod.get(a.t.id) - lod.get(b.t.id));
  });
  const valgt = fundet
    ? fundet.concat(rangeret.filter(r=>!fundet.includes(r)).slice(0, antal - fundet.length))
    : rangeret.slice(0, antal);
  f.forslag = { nøgle, ids: valgt.map(r=>r.t.id) };
  gem();
  return valgt;
}
/* Ét sted som stående fotokort (OD 13/8). Formatet er bevidst 3:4: næsten alle
   vores billeder er taget stående med en telefon, og det er netop det, der viser,
   at nogen har stået der. Kortet er IKKE .res-kort — den bruges også af
   invitationen, biltype-valget og "steder i nærheden", og skulle ikke rives med.

   To steder (t1, t6) har ingen billeder endnu. De får landskabets egen aftenhimmel
   i stedet, så rækken beholder sin rytme og hullet er ærligt i stedet for tomt. */
/* Kort form af toiletfeltet til datastriben (14/8). Feltet er skrevet som en
   hel sætning til destinationssiden ("Offentligt toilet ved slusen, 600 m
   (åbent hele døgnet)") og kan ikke stå på et kort. Her trækkes afstanden ud,
   hvis den står der — ellers bliver det ja/nej. Vi opfinder ingenting: er
   feltet tomt, siger vi ikke "intet toilet", vi siger ingenting. */
function toiletKort(v){
  if(!v) return null;
  /* Ikke "intet toilet", men ordet streget over (KN 5/10). En skærmlæser
     læser ikke en streg, så den får ordet "ingen" med. */
  if(/^\s*(nej|intet|ingen)/i.test(v)) return `<s class="uden-toilet"><span class="sr-only">${t('destination.ingentoiletsr','ingen')} </span>${t('destination.toilet.findes','toilet')}</s>`;
  const m = v.match(/(\d[\d.,]*)\s*(km|m)\b/i);
  return m ? t('destination.toiletafstand','toilet <b>{tal}</b> {enhed}',{tal:m[1],enhed:m[2].toLowerCase()})
           : t('destination.toilet.findes','toilet');
}
function stedKort(r, først){
  /* Hed 't' indtil 13/9. Tekstopslaget hedder ogsaa t(), og linjen med
     "Laengere vaek, end I valgte" kaldte det - inde i skyggen. Den gren
     koerer kun, naar et sted ligger uden for radius, saa ingen proeve ramte
     den. vaerktoej/tjek-tekstkald.mjs fanger det nu. */
  const sted = r.t;
  const foto = (sted.billeder && sted.billeder.length) ? sted.billeder[0] : null;
  /* Datastriben (14/8). Før stod her "ca. 21 km · 3 af 3 ønsker" — og da alle
     tre forslag som regel rammer alle tre ønsker, fortalte den halvdel intet.
     Nu hårde tal, og KUN dem vi faktisk har: et felt, der ikke er udfyldt,
     udelades. En kortere stribe er bedre end en stribe med huller i. */
  const fakta = [];
  /* Stjernerne står under navnet (OD 4/10) — de er jeres dom og skal ses på
     to sekunder, ikke ligge i datastriben mellem km og underlag. */
  const stjerner = sted.stjerner
    ? `<span class="sk-stjerner" aria-label="${esc(t('destination.stjernearia','{n} af 5 stjerner',{n:sted.stjerner}))}">${'★'.repeat(sted.stjerner)}</span>` : '';
  /* MÆRKERNE PÅ BILLEDET (OD 4/10): "Testet af Arytmi" står der ikke mere —
     det er alle vores steder. Kun det, der er VALGT på destinationen:
     Anbefalet af Arytmi og God til børn. Ellers intet. Kladde og Måske
     bliver, de siger noget andet: at stedet ikke er færdigt. */
  const mærker = [];
  if(sted.kladde) mærker.push(`<span class="sk-mærke kladde">${t('forslag.kladde','Kladde')}</span>`);
  else if(!sted.klar) mærker.push(`<span class="sk-mærke måske">${t('forslag.maaske','Måske')}</span>`);
  if(sted.anbefalet) mærker.push(`<span class="sk-mærke anbefalet">${t('forslag.anbefalet','Anbefalet af Arytmi')}</span>`);
  if(sted.godTilBørn) mærker.push(`<span class="sk-mærke">${t('destination.boern','God til børn')}</span>`);
  if(r.km!=null){
    fakta.push(`<b>${r.km}</b> km`);
    fakta.push(esc(køretid(r.km)));
  }
  if(sted.underlag) fakta.push(esc(sted.underlag));
  const wc = toiletKort(sted.faciliteter && sted.faciliteter.toilet);
  if(wc) fakta.push(wc);
  const stribe = fakta.length
    ? `<span class="sk-fakta">${fakta.join(' <i>·</i> ')}</span>` : '';
  /* Ligger stedet uden for den valgte radius, skal det stadig siges — det er
     grunden til, at det ellers billige kort pludselig er en time væk. */
  const udenfor = (r.km!=null && !r.indenfor)
    ? `<span class="sk-meta">${t('forslag.laengerevaek','Længere væk, end I valgte')}</span>` : '';
  return `
    <button class="sted-kort${foto?'':' uden-foto'}" onclick="åbnTestet('${sted.id}','forslag')">
      ${foto
        ? `<img class="sk-foto" src="${foto}" alt="" width="1050" height="1400"
             ${først?'loading="eager" fetchpriority="high"':'loading="lazy"'} decoding="async">`
        : `<span class="sk-vandmærke">${ik('stjerne')}</span>`}
      ${mærker.length?`<span class="sk-mærker">${mærker.join('')}</span>`:''}
      <span class="sk-tekst">
        ${sted.ord?`<span class="sk-ord">${esc(sted.ord)}</span>`:''}
        <span class="sk-navn">${esc(sted.navn)}</span>
        ${stjerner}
        ${udenfor}
        ${foto?'':`<span class="sk-meta">${t('forslag.billederpaavej','Billeder er på vej')}</span>`}
        ${stribe}
      </span>
    </button>`;
}
/* Hvor "Destination" fører hen fra overblikket, turplanen og turen.

   ⚠️ ALDRIG DIREKTE TIL KORTET (KN 28/9: "Man skal efterfølgende heller
   ikke kunne trykke på destination på overblikket og komme ind på kortet.
   Man skal vel i stedet springe tilbage og vælge om man vil indtaste en ny
   'eget sted' eller bruge vores wizard som tiltænkt?"). Vejen går til trin
   3, "Hvor langt vil I køre?": dér kan man skrive en ny adresse, eller
   rette radius og gå videre gennem ønskerne til de tre forslag.

   Undtagelsen er den gamle: mangler stedet, men er ønskerne svaret på,
   står de tre forslag klar, og så går man direkte til dem. */
function destinationsVej(f){
  const o = f && f.oplevelser;
  if(f && !f.destination && o && o.lys && o.natur && o.stemning) return "gåTil('forslag')";
  return "gåTil('hvorlangt')";
}
/* "Ingen af dem?" fører til trin 3 og lægger feltet midt på skærmen —
   det står under radius, og det er det, man kom for. */
function egetSted(){
  gåTil('hvorlangt');
  const felt = $('bySøg');
  if(felt && felt.scrollIntoView) felt.scrollIntoView({ block:'center' });
}
function skærmForslag(){
  const f = s.forberedelse;
  if(!f){ gåTil('hjem'); return; }
  const res = forslagSteder();
  const udenfor = res.filter(r=>!r.indenfor).length;
  $('indhold').innerHTML = `<div class="side anim">
    ${skærmTop((f.flereForslag ? t('forslag.titelseks','Seks steder til jer') : t('forslag.titel','Tre steder til jer')),'onsker',t('forslag.etiket','Ud fra jeres svar'))}
    ${valgChips()}
    <!-- "Træk til siden …" er væk (KN 28/9: "det siger jo sig selv"). -->
    <div class="sted-række">
      ${res.map((r,i)=>stedKort(r, i===0)).join('')}
    </div>
    ${f.flereForslag || TESTEDE.length <= 3 ? '' : `
    <div class="flere-forslag">
      <button class="knap kontur" onclick="foreslåFlere()">${t('forslag.flereknap','Foreslå 3 nye')}</button>
      <p class="dæmpet">${t('forslag.flereobs','<b>OBS: Det kan kun gøres én gang.</b> Arytmi handler om at fjerne beslutningstræthed. Vælg en destination, og tag afsted — det handler ikke om destinationen, men om at komme afsted. Der ligger mange gode apps online, som kan bruges til at finde nye destinationer.')}</p>
    </div>`}
    <h3 class="forslag-kort-titel">${t('forslag.korttitel','Se destinationerne på kortet')}</h3>
    <div class="kort-wrap forslag-kort-ramme"><div id="forslag-kort" aria-label="${esc(t('forslag.kortaria','Kort over de tre steder og jeres startpunkt'))}"></div></div>
    <p class="forslag-vink">${ik('nål')} ${t('forslag.pinvink','Tryk på kortet for at sætte jeres eget sted')}</p>
    ${udenfor?`<p class="dæmpet" style="font-size:12.5px;margin-top:4px">${t('forslag.kunantal','Kun {antal} af vores testede steder ligger inden for jeres radius lige nu. Resten ligger længere væk, men er taget med.',{antal:res.length-udenfor})}</p>`:''}
    <div style="text-align:center;margin-top:18px">
      <button class="knap kontur lille" onclick="egetSted()">${ik('nål')} ${t('forslag.egetsted2','Ingen af dem? Skriv jeres eget sted')}</button>
    </div>
    ${annullérLinje()}
  </div>`;
  tegnForslagKort(res);
}
/* "Foreslå 3 nye" (OD 4/10). Lægger tre steder til — de tre første bliver.
   Kun én gang pr. tur: flaget står på turen og følger den til serveren. */
function foreslåFlere(){
  const f = s.forberedelse; if(!f || f.flereForslag) return;
  f.flereForslag = true;
  gem(); tegn();
}
/* "God tur"- og "Velkommen hjem"-siderne er slettet (OD 31/8) — de var to
   fuldskærms-tilstande, der ikke gjorde andet end at vente. Turen bliver
   liggende i Dine arytmer, indtil man selv gemmer den.

   Af sted er derfor heller ikke en tilstand længere: turen er klar, når den er
   pakket. Knapperne, der før kaldte afSted(), fører nu bare til Dine arytmer. */
function tilAfsted(){ nulstilHistorik(); gåTil('log'); }
/* Turene logges SELV (KN 4/9). Knappen "Vil du gemme din tur" er væk fra de
   kommende ture: den bad om et tryk for noget, appen godt selv kunne se var
   sket. Er turens sidste dag passeret, flytter den herfra og ned under
   Afholdte ture — anmeldelsen kan man så tage bagefter, hvis man vil.

   Tomme kladder med en passeret dato bliver slettet i stedet for logget. En
   kladde, hvor der aldrig blev valgt noget, er ikke en tur, man har været på. */
function turSlutDato(a){
  if(!a.dato) return null;
  if(a.retur === 'dato' && a.returDato) return a.returDato;
  if(a.retur === 'næste'){
    const d = new Date(a.dato + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0,10);
  }
  return a.dato;
}
function logAfholdteTure(){
  const iDag = new Date().toISOString().slice(0,10);
  let ændret = false;
  s.arytmer.slice().forEach(a => {
    const slut = turSlutDato(a);
    if(!slut || slut >= iDag) return;
    /* EN REJSEMAKKERS TUR ARKIVERES AF HENDE, ikke af os. Gjorde begge
       telefoner det, ville der stå to afholdte ture — én hos hver — for
       den samme tur, og vores sletning af hendes ville alligevel blive
       afvist af "kun ejeren sletter". Den, der ejer turen, rydder op i
       den. Vi ser resultatet komme ned ved næste hentning. */
    if(fremmedRække('ture', a.id)) return;
    if(!tomKladde(a)){
      s.ture.unshift({
        id: M.nytId('t'),
        sted: a.destination ? a.destination.navn : 'Jeres sted',
        dato: a.dato, score: null, kommentar: '', minde: '', plan: turSnapshot(a)
      });
    }
    sletTur(a.id);
    ændret = true;
  });
  if(ændret) gem();
}
/* "Anmeld turen" fra afgangskortet (KN 7/9). Det er den manuelle udgave af
   logAfholdteTure(): den flytter turen ned i loggen NU i stedet for at vente
   på, at slutdatoen passerer, og åbner anmeldelsen med det samme.

   Vi spørger først. Det er en énvejsdør: turen forlader Kommende ture, og
   afkrydsningerne på pakkelisten følger ikke med (turSnapshot gemmer valgene,
   ikke fluebenene — en gentaget tur skal pakkes forfra). */
function anmeldDenneTur(){
  const f = s.forberedelse;
  if(!f){ gåTil('hjem'); return; }
  /* Den, der ejer turen, lukker den. Gjorde vi det for hende, ville der
     stå to afholdte ture for den samme tur — én hos hver — og vores
     sletning af hendes ville alligevel blive afvist af "kun ejeren
     sletter". */
  if(fremmedRække('ture', f.id)){
    const navn = partnerNavn().split(' ')[0];
    flash('Turen er ' + navn + 's. Den kan kun afsluttes fra ' + navn + 's telefon.');
    return;
  }
  bekræft('Anmeld turen nu? Så er den slut: den flytter fra Kommende ture ned under Afholdte ture i Dine arytmer.', ()=>{
    const nyId = M.nytId('t');
    s.ture.unshift({
      id: nyId,
      sted: f.destination ? f.destination.navn : 'Jeres sted',
      dato: f.dato || new Date().toISOString().slice(0,10),
      score: null, kommentar: '', minde: '', plan: turSnapshot(f)
    });
    sletTur(f.id);
    startTurÅben = false;
    gem(); nulstilHistorik(); gåTil('log');
    logSpontanModal(nyId);
  });
}

/* =============================================================
   SPONTAN ARYTME — den hurtige vej for dem, der har prøvet det før.
   Ingen fire trin, intet kort: dato og tid sættes til i dag kl. 15,
   og man får kun huskelisten, så intet bliver glemt. Turen lander
   i loggen som en hvilken som helst anden arytme.
   ============================================================= */
function startSpontan(){
  s.forberedelse = nyForberedelse({ spontan:true });
  gem(); nulstilHistorik(); gåTil('hurtig');
}
function hurtigListe(){
  const f = s.forberedelse;
  const pakke = (f.pakkeTjek||[]).length;
  const pakkeAlle = pakkePunkter().length;
  return [
    { navn:t('hurtig.bilen','Bilen'),       under: bilenKlar(f) ? t('hurtig.bilenklar','Klar') : t('hurtig.bilenunder','Vælg bil og gå udstyret igennem'),               klar: bilenKlar(f),          mål:'bilen' },
    { navn:t('hurtig.pakkeliste','Pakkeliste'),  under:t('hurtig.pakkeunder','{antal} af {ialt} klaret — de personlige ting',{antal:pakke,ialt:pakkeAlle}),                    klar:pakke>=pakkeAlle,       mål:'pakke' },
    { navn:t('hurtig.mad','Mad og drikke'), under: forplejningKlar()? t('hurtig.madklar','Planlagt') : t('hurtig.madunder','Så I ikke skal handle på vejen'), klar:forplejningKlar(), mål:'mad' }
  ];
}
function skærmHurtig(){
  const f = s.forberedelse;
  if(!f){ gåTil('hjem'); return; }
  const items = hurtigListe();
  const mangler = items.filter(i=>!i.klar).length;
  $('indhold').innerHTML = `<div class="side anim">
    <div class="skærm-top">
      <button class="tilbage" onclick="tilbage('hjem')">${ik('tilbage')}</button>
      <div><div class="etiket">${t('hurtig.etiket','Spontan arytme')}</div>
        <h1 style="font-size:22px">${t('hurtig.overskrift','Kom afsted nu')}</h1></div>
    </div>
    <p class="dæmpet" style="margin-bottom:14px">${t('hurtig.brod','Ingen planlægning — bare huskelisten, så I ikke står uden dyner ved vandet.')}
      ${mangler? t('hurtig.tingtilbage','Der er <b style="color:var(--gran)">{antal}</b> ting tilbage.',{antal:mangler}) : t('hurtig.altklaret','Alt er klaret. I kan køre.')}</p>
    <div class="kort" style="padding:14px 16px">
      <div class="etiket">${t('hurtig.afgang','Afgang')}</div>
      <div style="display:flex;gap:10px;margin-top:8px">
        <input type="date" style="flex:1" value="${f.dato||''}" onchange="s.forberedelse.dato=this.value||null;gem();tegn()">
        <input type="time" step="900" style="flex:1" value="${f.afgangstid||''}" onchange="s.forberedelse.afgangstid=this.value;gem()">
      </div>
      <p class="dæmpet" style="font-size:12.5px;margin-top:8px">${t('hurtig.satidag','Sat til i dag. Skal I et bestemt sted hen, kan I stadig')}
        <button class="som-link" onclick="gåTil('hvorlangt')">${t('hurtig.vaelgdestination','vælge en destination')}</button>.</p>
      ${f.destination?`<div class="sted-chips" style="margin-top:10px"><span class="sted-chip valgt">${ik('nål')} ${esc(f.destination.navn)}</span></div>`:''}
    </div>
    <div class="sektion"><h3>${t('hurtig.huskeliste','Huskeliste')}</h3></div>
    ${items.map(i=>`
      <button class="tjek-punkt ${i.klar?'klar':''}" onclick="gåTil('${i.mål}')">
        <span class="tjek-boks">${ik('tjek')}</span>
        <span class="tjek-krop"><span class="tjek-navn">${i.navn}</span><span class="tjek-under">${i.under}</span></span>
        <span class="tjek-pil">${ik('pil')}</span>
      </button>`).join('')}
    <button class="knap primær bred ånde" style="margin-top:20px" onclick="tilAfsted()">${ik('bil')} ${t('hurtig.afstednu','Afsted nu')}</button>
    ${annullérLinje()}
  </div>`;
}

/* =============================================================
   NEDTÆLLING + TJEKLISTE — forsiden når turen har en dato
   ============================================================= */
function dageTil(iso){
  if(!iso) return null;
  const nu = new Date(); nu.setHours(0,0,0,0);
  return Math.round((new Date(iso+'T00:00:00') - nu) / 86400000);
}
/* Planlægger man sammen, giver det ikke mening at gøre resten klar, før
   rejsemakkeren har bekræftet datoen — først da er planen fælles. Gave og
   solo-ture skal derimod kunne forberedes fra start, så låsen gælder kun 'sammen'. */
function afventerFællesPlan(f){ return f.invType==='sammen' && f.invStatus!=='bekræftet'; }
/* Turen planlægges som en gave, der endnu ikke er sendt. */
function gaveKladde(f){ return !!(f && f.invType==='gave' && f.invStatus!=='sendt' && f.invModtager); }
/* Fra pakkelisten tilbage til invitationen — med mailen fremme, klar til at
   rette og sende. */
function tilInvitationMedMail(){
  const f = s.forberedelse;
  f.invVisMail = true; gem();
  tilbageTil('invitation');
}
/* Planlægningen er slut for de veje, der ikke sender en overraskelse.
   Forsiden skifter til de tre punkter om at komme afsted. */
function planenErKlar(){
  const f = s.forberedelse;
  f.planlagt = true; gem();
  /* Sidste punkt planlagt → turen lægger sig i Dine arytmer, hvor den kan
     vælges igen (OD 31/8). Før landede man på overblikket for den ene tur. */
  nulstilHistorik(); gåTil('log');
  infoModal(t('loggen.planlagt','Turen er planlagt. Den ligger nu i din Arytme log.'), t('faelles.godt','Godt'));
}
function venterPåBekræftelse(){
  const f = s.forberedelse;
  flash('I skal først blive enige om datoen med '+(f.invModtager||'rejsemakkeren')+'.', 'lås');
}
function tjeklisteData(){
  const f = s.forberedelse;
  const låst = afventerFællesPlan(f);
  const låstAktion = "venterPåBekræftelse()";
  return [
    { navn:'Dato',          under: f.dato?pænDato(f.dato):'Vælg afrejsedato',      klar:!!f.dato,        aktion:"gåTil('turdato')" },
    { navn:'Destination',   under: f.destination?esc(f.destination.navn):'Find et sted', klar:!!f.destination,
      aktion: destinationsVej(f) },
    /* Invitation er fjernet herfra (OD 13/8) — den ligger nu som en rund knap
       i bunden af overblikket. Den var et krav, der stod i vejen; nu er den
       et tilbud, man tager, når man har lyst. */
    /* "Planlagt" frem for "3 valgt" (OD 30/8) — tallet fortalte ingenting om,
       hvor langt man var, kun hvor mange gange man havde trykket. */
    { navn:'Forplejning',   under: låst?'Låst indtil invitationen er bekræftet':(forplejningKlar()?'Planlagt':'Snacks, drikkevarer og det, der skal til for at nyde det'), klar: forplejningKlar(), aktion: låst?låstAktion:"gåTil('mad')", låst, plan:true },
    { navn:'Bil',           under: låst?'Låst indtil invitationen er bekræftet':(bilenKlar(f)?'Planlagt':'Strøm, sengetøj og udstyr'), klar: bilenKlar(f), aktion: låst?låstAktion:"gåTil('bilen')", låst, plan:true },
    { navn:'Personligt',    under: låst?'Låst indtil invitationen er bekræftet':'De personlige ting', klar: (f.pakkeTjek||[]).length>=pakkePunkter().length, aktion: låst?låstAktion:"gåTil('pakke')", låst, plan:true }
  ];
}
/* De tre planlægningspunkter er klaret — så skal de ikke blive ved med at
   fylde som tre grønne rækker. De erstattes af den liste, de tilsammen har
   produceret (OD 13/8). */
function planTrinKlaret(){
  return tjeklisteData().filter(i=>i.plan).every(i=>i.klar);
}
/* =============================================================
   EFTER PLANLÆGNINGEN — forsiden skifter fra "hvad mangler vi" til
   "sådan kommer vi afsted". Tre punkter i stedet for seks (OD 11/8).
   ============================================================= */
function turPlanlagt(){ const f = s.forberedelse; return !!(f && f.planlagt); }
/* Det der skal PAKKES: de personlige ting (inkl. dem man selv har skrevet),
   udstyret man har lagt på huskelisten under Bilen, og grejet fra
   Forplejningen. Strøm hører ikke til her — den kan først laves på dagen. */
/* Pakkelisten i TO niveauer (OD 30/8). Før var det én lang klump; nu er der
   tre sektioner, man folder ud én ad gangen, med en underliste pr. slags ting:

     Bil          → Til bilen
     Personligt   → Personligt · Hund · Hygge
     Forplejning  → Madudstyr · Handleliste

   Id-præfikserne (p- b- ms- mo- s-) er UÆNDREDE fra før omlægningen, så
   afkrydsninger på igangværende ture overlever. */
function bilPunkt(id){
  for(const g of BILEN_GRUPPER){
    const p = g.punkter.find(x=>x.id===id);
    if(p) return { p, gruppe:g.id };
  }
  /* Punkter man selv har skrevet står ikke i BILEN_GRUPPER. Uden dette opslag
     forsvandt de lydløst på vej til pakkelisten. Slås op i ALLE åbne grupper
     (KN 6/9: 'need' kom til ved siden af 'hygge'), så gruppen følger med —
     det er den, der afgør, om punktet lander under "Det praktiske til bilen"
     eller under "Hygge" på pakkelisten. */
  for(const g of BILEN_GRUPPER){
    if(!g.åben) continue;
    const e = egne(g.åben).find(p=>p.id===id);
    if(e) return { p:e, gruppe:g.id };
  }
  return null;
}
function pakkeSektioner(){
  const f = s.forberedelse; if(!f) return [];
  const huske = (f.bilHuske||[]).map(bilPunkt).filter(Boolean);
  const bilRk = h => ({ id:'b-'+h.p.id, tekst:h.p.navn || h.p.tekst });
  const tilBilen = huske.filter(h=>h.gruppe!=='hygge' && h.p.id!=='strøm').map(bilRk);
  /* "Lad bilen op" hører til bilen, men kan først gøres på dagen — derfor
     står den først i listen og med sin egen tekst. */
  if((f.bilHuske||[]).includes('strøm') && f.bilType !== 'andet') tilBilen.unshift({ id:'s-strøm', tekst:'Lad bilen op' });

  const personligt = [...PAKKE_PUNKTER, ...egne('pakke')].map(p=>({ id:'p-'+p.id, tekst:p.tekst }));
  const hund = hundMed() ? [...HUND_PUNKTER, ...egne('hund')].map(p=>({ id:'p-'+p.id, tekst:p.tekst })) : [];
  const hygge = huske.filter(h=>h.gruppe==='hygge').map(bilRk);

  const madudstyr = [
    ...madScenarieUdstyr().map(p=>({ id:'ms-'+p.id, tekst:p.tekst })),
    ...morgenUdstyr().map(p=>({ id:'mo-'+p.id, tekst:p.tekst }))
  ];
  /* Handlelisten er det, der SKAL KØBES: madscenariet, snacks og drikkevarer —
     plus de punkter i et scenaries "Det skal I bruge", der er mad og ikke grej
     (mærket handle:true, fx tapasretter, dip og brød, OD 31/8). */
  const handleliste = [
    ...valgtForplejning().map(p=>({ id:'s-'+p.id, tekst:p.tekst })),
    ...madScenarieMad().map(p=>({ id:'ms-'+p.id, tekst:p.tekst }))
  ];

  /* SEKS lister i stedet for tre sektioner med underlister (OD 31/8): hund og
     hygge skal ikke ligge under Personligt, og handlelisten ikke under
     madudstyret. Hver liste er nu sin egen foldning med sin egen overskrift.

     Punkternes id-præfikser (b-, p-, ms-, mo-, s-) er UÆNDREDE, så ture, der
     er i gang, beholder deres afkrydsninger. Kun grupperingen er flyttet.
     Nøglerne i åbnePakkeSektioner skifter, men det er ren visningstilstand.

     Navnene: OD har navngivet tre af listerne. "Alt det lækre I skal dele" er
     flyttet fra madudstyret til HANDLELISTEN (KN 31/8) — det er dér maden og
     drikkevarerne ligger; madudstyret er pizzaskærer og termokande. Madudstyret
     hedder nu "Køkkenet I tager med", som holder samme tone som OD's tre.
     Hund og Hygge står med foreløbige navne og venter på hendes. */
  const sektioner = [
    { id:'bil',         navn:'Det praktiske til bilen',      lister:[
      { id:'til-bilen',   navn:'Det praktiske til bilen',      punkter:tilBilen } ]},
    { id:'personligt',  navn:'Det uundværlige til jer selv',  lister: personligeLister(f, personligt) },
    { id:'hund',        navn:'Hund',                          lister:[
      { id:'hund',        navn:'Hund',                         punkter:hund } ]},
    { id:'hygge',       navn:'Hygge',                         lister:[
      { id:'hygge',       navn:'Hygge',                        punkter:hygge } ]},
    { id:'madudstyr',   navn:'Køkkenet I tager med',          lister:[
      { id:'madudstyr',   navn:'Køkkenet I tager med',         punkter:madudstyr } ]},
    { id:'handleliste', navn:'Alt det lækre I skal dele',      lister:[
      { id:'handleliste', navn:'Alt det lækre I skal dele', under:'Købes tæt på afgangsdagen/på dagen', punkter:handleliste } ]}
  ];
  // Tomme lister og tomme sektioner vises ikke — de ville kun være støj.
  return sektioner
    .map(sek=>({ ...sek, lister:sek.lister.filter(l=>l.punkter.length) }))
    .filter(sek=>sek.lister.length);
}
/* DET UUNDVÆRLIGE TIL HVER AF JER (KN 5/10). Deles turen med rejsemakkeren,
   skal hver have sin egen liste — begge skal have nattøj med, og ét kryds
   for to tasker er et kryds, der lyver.

   Id'erne følger PERSONEN, ikke telefonen: turens ejer har 'p-' (de samme
   som før, så afkrydsninger på ture i gang overlever), rejsemakkeren 'pp-'.
   På rejsemakkerens telefon er turen fremmed — så er hendes egen liste
   'pp-', og den anden bærer ejerens navn. Begge ser altså "Til mig" øverst,
   og et kryds på den ene telefon lander på samme person på den anden.

   En ven på turen udelukker rejsemakkeren (venHarSædet), og vennen har sin
   egen fordeling — derfor kun ved delt tur. */
function personligeLister(f, personligt){
  const navn = 'Det uundværlige til jer selv';
  if(!f || !turDeles(f) || !partnerAktiv()) return [{ id:'personligt', navn, punkter:personligt }];
  const ejersListe = personligt;
  const makkersListe = personligt.map(p=>({ id:'p'+p.id, tekst:p.tekst }));   // 'p-x' → 'pp-x'
  const jegErMakker = !!(f.id && fremmedRække('ture', f.id));
  // Navnet sættes ind UDEN t()'s escaping: overskriften escapes, når den tegnes.
  const anden = partnerNavn().split(' ')[0];
  const mig   = { id:'personligt-mig',   navn:t('listen.tilmig','Til mig'), punkter: jegErMakker ? makkersListe : ejersListe };
  const hende = { id:'personligt-anden', navn:t('listen.tilanden','Til {navn}').split('{navn}').join(anden), punkter: jegErMakker ? ejersListe : makkersListe };
  return [mig, hende];
}
function pakkeListe(){
  return pakkeSektioner().flatMap(sek=>sek.lister.flatMap(l=>l.punkter));
}
function klarKlaret(){
  const f = s.forberedelse; if(!f) return false;
  const l = pakkeListe();
  return l.length>0 && l.every(p=>(f.klarTjek||[]).includes(p.id));
}
function klarTjek(id){
  if(!s.forberedelse) return;
  const t = s.forberedelse.klarTjek || (s.forberedelse.klarTjek = []);
  const i = t.indexOf(id);
  const tilføjer = i<0;
  if(i>=0) t.splice(i,1); else t.push(id);
  gem();
  if(tilføjer) efterAfkrydsning(); else tegn();
}
/* Vælg/fjern hele en underliste på én gang (OD 30/8). */
function vælgAlle(sektionId, listeId){
  const f = s.forberedelse; if(!f) return;
  const sek = pakkeSektioner().find(x=>x.id===sektionId);
  const liste = sek && sek.lister.find(l=>l.id===listeId);
  if(!liste) return;
  const t = f.klarTjek || (f.klarTjek = []);
  const alleValgt = liste.punkter.every(p=>t.includes(p.id));
  if(alleValgt){
    const væk = new Set(liste.punkter.map(p=>p.id));
    f.klarTjek = t.filter(x=>!væk.has(x));
    gem(); tegn();
  } else {
    liste.punkter.forEach(p=>{ if(!t.includes(p.id)) t.push(p.id); });
    gem(); efterAfkrydsning();
  }
}
/* Er ALT pakket, er turen klar — så siger vi det og sender folk tilbage til
   overblikket. Må KUN kaldes fra en afkrydsning, aldrig fra render: ellers
   ryger man ud af skærmen, hver gang man åbner en færdig liste. */
/* Sidste emne på pakkelisten krydset af (OD 31/8): turen er klar, og man
   føres tilbage til Dine arytmer, hvor den nu har knappen "Vil du gemme din
   tur". Før landede man på overblikket for den ene tur — det gav ikke mening,
   når der kan ligge flere. */
function efterAfkrydsning(){
  if(klarKlaret()){
    nulstilHistorik(); gåTil('log');
    infoModal('Du er nu klar til at tage afsted.', 'Godt');
  } else tegn();
}
/* klarPunkter() er slettet 6/9 (KN). De to rubrikker, den beskrev — "Jeg er
   klar til at pakke" og "Se turplanen" — er væk fra Hjem. Pakkelisten nås nu
   via proceslinjens trin "Pakning" og via turplanen; turplanen står i
   side-foden. Ingen anden skærm kaldte funktionen. */
/* De tre faser en tur går igennem (OD 31/8: "generelt har vi 3 faser
   planlægning, klargøring og afsted" — listen skulle skifte farve, så man kan
   se, man er et nyt sted). Farverne er brandets egne og ligger langt fra
   hinanden i RGB, ikke bare i lyshed: oliven (95,99,83), kobber (176,121,78),
   bark (58,50,39). En forskel, man kan se på en telefon i sol. */
/* Navnene rettet 6/9 (KN): "Klargøring" hed noget andet end det, man rent
   faktisk gør — man pakker. Og sidste trin er ikke en tilstand, man befinder
   sig i, men det greb, der sender jer afsted: "Start tur". Id'erne står
   urørt; de er nøgler, ikke tekst. */
const TUR_FASER = [
  /* Farverne bor i app.css (--fase-*), så de følger paletten og temaet. */
  { id:'planlægning', navn:'Planlægning', farve:'var(--fase-plan)' },
  { id:'klargøring',  navn:'Pakning',     farve:'var(--fase-pak)' },
  { id:'afsted',      navn:'Start tur',   farve:'var(--fase-afsted)' }
];
function turFase(){
  const f = s.forberedelse;
  if(!f) return TUR_FASER[0];
  if(klarKlaret()) return TUR_FASER[2];
  /* Planlægningen er færdig, når man selv har trykket "Afslut planlægning"
     (f.planlagt) — ikke først når hvert eneste punkt er hakket af. Uden det
     stod Planlægning som "her er du" på skærme, man kun KAN nå ved at være
     færdig med at planlægge (KN 6/9). */
  if(f.planlagt || planTrinKlaret()) return TUR_FASER[1];
  return TUR_FASER[0];
}
/* ---------- PROCESLINJEN — den røde tråd (KN 6/9) ----------
   Før var faserne tre stumme etiketter: de skiftede farve, men fortalte
   hverken hvad der var overstået, eller hvor man selv stod. Nu er det en
   proces man kan læse: pil imellem trinnene, flueben på det, der er gjort,
   og "Her er du" under det trin, man står på.

   Den er bevidst generel (trin, idx) og ikke bundet til TUR_FASER, fordi den
   skal bruges flere steder i appen og se ens ud hver gang. Skal den bruges et
   nyt sted, kald procesLinje() — lav ikke en kopi.

   Hvert trin er en KOLONNE med to linjer: mærket og "Her er du". Den anden
   linje står der også på de trin, man ikke er på (bare tom) — ellers hopper
   linjen i højden, når man rykker et trin frem. */
/* Fjerde argument (KN 6/9): `valg.stor` gør linjen til sidens hovedgreb i
   stedet for en statusstribe, og et trin med `aktion` bliver en knap i stedet
   for et mærkat. Begge dele bruges på Hjem, hvor proceslinjen har overtaget
   pladsen fra de to rubrikker. Uden aktion opfører den sig præcis som før. */
function procesLinje(trin, idx, etiket, valg){
  const stor = valg && valg.stor;
  return `<div class="proces${stor?' stor':''}" role="group" aria-label="${esc(etiket||'Hvor langt er I')}">
    ${trin.map((t,i)=>{
      const tilstand = i<idx ? 'klaret' : i===idx ? 'nu' : 'kommer';
      const pil = i ? `<span class="proces-pil ${i<=idx?'passeret':''}" aria-hidden="true">${ik('pil')}</span>` : '';
      const tag = t.aktion ? 'button' : 'span';
      const attr = t.aktion ? ` type="button" class="proces-trin trykbar ${tilstand}" onclick="${t.aktion}"` : ` class="proces-trin ${tilstand}"`;
      return `${pil}<${tag}${attr} style="--f:${t.farve||'var(--anker)'}" ${i===idx?'aria-current="step"':''}>
        <span class="proces-mærke">${i<idx?`<span class="proces-flue">${ik('tjek')}</span>`:''}${esc(t.navn)}</span>
        <span class="proces-nu">${i===idx?'Her er du':''}</span>
      </${tag}>`;
    }).join('')}
  </div>`;
}
function faseBånd(){
  return procesLinje(TUR_FASER, TUR_FASER.indexOf(turFase()), 'Turens tre faser');
}
/* Hvilke sektioner der står foldet ud. Ren visningstilstand — som
   åbneBilEmner: hverken gemt eller i historikken. Tom = alt foldet sammen,
   så man ikke mødes af en mur af punkter (OD 30/8). */
let åbnePakkeSektioner = {};
function pakkeFold(id){ åbnePakkeSektioner[id] = !åbnePakkeSektioner[id]; tegn(); }
function skærmKlarListe(){
  const f = s.forberedelse; if(!f){ gåTil('hjem'); return; }
  const sektioner = pakkeSektioner();
  const tjek = f.klarTjek || [];
  /* Totaltælleren i toppen ("0 af 49") er væk (KN 6/9). Et 49-tal er ikke
     et overblik, det er en mur — og de tal, der betyder noget, står på
     hver enkelt liste, hvor man rent faktisk pakker. */
  const tælTekst = (punkter)=>{
    const n = punkter.filter(p=>tjek.includes(p.id)).length;
    return n===punkter.length ? t('listen.altpakket','Alt er pakket') : t('listen.erpakket','{antal} af {ialt} er pakket',{antal:n,ialt:punkter.length});
  };
  const række = p => `
    <div class="liste-punkt ${tjek.includes(p.id)?'strøget':''}" onclick="klarTjek('${p.id}')" style="cursor:pointer">
      <div class="tjekboks ${tjek.includes(p.id)?'markeret':''}"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
      <div class="navn">${esc(p.tekst)}</div>
      ${ejerMærkat(p.id)}
    </div>`;
  /* Underlisterne ligger INDE i sektionens kort — derfor bare rækker, ingen
     ny .liste. Et kort i et kort giver dobbelt kant og skygge (samme grund
     som hunde-rubrikken på Personligt er bygget sådan). */
  const underliste = (sek, l) => {
    const sorteret = [...l.punkter.filter(p=>!tjek.includes(p.id)), ...l.punkter.filter(p=>tjek.includes(p.id))];
    const alleValgt = l.punkter.every(p=>tjek.includes(p.id));
    /* Har sektionen kun én liste, står navnet allerede i foldningens
       overskrift — så ville det stå to gange lige over hinanden. Tælleren
       står der også allerede. */
    const egenOverskrift = sek.lister.length > 1;
    return `
      ${egenOverskrift?`<div class="sektion" style="margin-top:14px"><h3>${esc(l.navn)}</h3><span class="tjek-tæl">${tælTekst(l.punkter)}</span></div>`:''}
      ${l.under?`<p class="dæmpet" style="margin:${egenOverskrift?'-4px':'10px'} 0 6px;font-size:13px">${esc(l.under)}</p>`:''}
      <div style="text-align:right;margin:0 0 2px">
        <button class="som-link" onclick="vælgAlle('${sek.id}','${l.id}')">${alleValgt?'Fjern alle':'Vælg alle'}</button>
      </div>
      ${sorteret.map(række).join('')}`;
  };
  $('indhold').innerHTML = `<div class="side anim">
    <!-- Hedder "Pakning" 6/9, samme dag som fasen fik det navn (KN). Samme
         regel som bundnavigationen: det trin, man trykker på, må ikke hedde
         noget andet end den skærm, man lander på. -->
    ${skærmTop(t('listen.pakning','Pakning'),'hjem')}
    ${faseBånd()}
    <div class="kort guide-brød"><p style="margin:0">${t('listen.brod','Alt det, I har valgt undervejs — samlet ét sted. Fold ud, efterhånden som I er klar til at pakke.')}</p></div>
    ${sektioner.length ? sektioner.map(sek=>{
      const sekPunkter = sek.lister.flatMap(l=>l.punkter);
      const åben = !!åbnePakkeSektioner[sek.id];
      /* div, ikke button: navigationstesten samler kun <button> op, og en
         foldning er ikke en rute. */
      return `
        <div class="liste" style="margin-bottom:12px">
          <div class="liste-punkt bil-emne" onclick="pakkeFold('${sek.id}')" style="cursor:pointer">
            <div class="navn"><span class="pakke-titel">${esc(sek.navn)}</span>
              <div class="dæmpet" style="font-size:12.5px;margin-top:2px">${tælTekst(sekPunkter)}</div>
            </div>
            <span class="bil-pil ${åben?'åben':''}">${ik('pil')}</span>
          </div>
          ${åben?`<div class="bil-krop" style="padding-bottom:0;border-bottom:none">
            ${sek.lister.map(l=>underliste(sek,l)).join('')}
          </div>`:''}
        </div>`;
    }).join('')
    : `<div class="liste"><div class="liste-punkt"><div class="navn dæmpet">${t('listen.tom','Der er ikke valgt noget til denne liste endnu.')}</div></div></div>`}
  </div>`;
}
/* nyArytmeLinje() er væk 31/8 — "Planlæg endnu en arytme" ligger nu i den
   stille række i side-fod sammen med Annullér turen. Vejen til tur nr. to er
   der stadig (OD: "også ved at gå til forsiden"), den konkurrerer bare ikke
   længere med skærmens rigtige greb. */
/* ---------- HJEM, når turen er planlagt (KN 6/9) ----------
   De to rubrikker ("Jeg er klar til at pakke" og "Se turplan") og teksten
   over dem er væk. De sagde det samme som proceslinjen lige ovenfor, bare
   med flere ord — og proceslinjen var for lille til at være sidens greb.
   Nu ER den grebet: tre store trin, alle tre trykbare.

     Planlægning → tilbage i planen og ret
     Pakning     → pakkelisten
     Start tur   → folder adressen og "Del med bil" ud, her på siden

   Turplanen ligger stadig ét tryk væk, i side-foden. */
let startTurÅben = false;
function slåStartTur(){
  startTurÅben = !startTurÅben;
  tegn();
  if(startTurÅben){
    const el = document.querySelector('.afgang-kort');
    if(el) el.scrollIntoView({block:'nearest', behavior:'smooth'});
  }
}
function hjemProcesLinje(){
  const idx = TUR_FASER.indexOf(turFase());
  const retMål = sektionListe(2)[0].id;
  const trin = [
    { ...TUR_FASER[0], aktion:`gåTil('${retMål}')` },
    { ...TUR_FASER[1], aktion:"gåTil('klar-pakke')" },
    { ...TUR_FASER[2], aktion:'slåStartTur()' }
  ];
  return procesLinje(trin, idx, 'Turens tre trin', { stor:true });
}
/* Adressen og det ene greb, der sender den videre. Foldes ud af "Start tur"
   — ikke en ny skærm: man står med bilnøglen i hånden.

   Tre ting rettet 7/9 (KN):
   1) Kortet åbner med "God tur!". Trykket på Start tur er turens vigtigste,
      og det skal mødes af noget andet end en adresse.
   2) "Luk" nederst er blevet til "Anmeld turen". Trin-knappen "Start tur"
      folder allerede kortet sammen igen, så "Luk" var det samme greb to
      gange — og pladsen skal bruges på det, der KOMMER efter turen.
   3) Plan B ligger under kortet. Det er ude ved stedet, man opdager, at der
      holder to biler i forvejen — ikke hjemme på turplanen. Det er den
      SAMME planBSteder(), turplanen bruger; ikke en kopi. */
function afgangKort(){
  if(!startTurÅben) return '';
  const f = s.forberedelse;
  const adr = turAdresse(f);
  const koord = turKoordinat(f);
  return `<div class="afgang-kort">
    <div class="afgang-hilsen">${t('turen.godtur','God tur!')}</div>
    ${adr
      ? `<div class="etiket" style="margin-top:14px">${t('turen.koermod','Kør mod')}</div>
         <h3 class="afgang-adresse">${esc(adr)}</h3>
         ${koord?`<div class="afgang-koord">${ik('nål')} ${koord}</div>`:''}
         ${f.afgangstid?`<div class="afgang-tid">${ik('ur')} ${t('turen.afgangkl','Afgang ca. kl. {tid}',{tid:f.afgangstid})}</div>`:''}
         <button class="knap primær bred" style="margin-top:14px" onclick="sendTilKøretøj()">${ik('del')} ${t('turen.delmedbil','Del med bil')}</button>`
      : `<p class="dæmpet" style="margin:6px 0 0">${t('turen.ingendestination','Der er ingen destination på turen endnu.')}</p>
         <button class="knap kontur bred" style="margin-top:12px" onclick="${destinationsVej(f)}">${ik('nål')} ${t('turen.vaelgdestination','Vælg destination')}</button>`}
    <button class="som-link" style="display:block;margin:14px auto 0" onclick="anmeldDenneTur()">${t('turen.anmeldturen','Anmeld turen')}</button>
  </div>
  ${planBSteder('hjem')}`;
}
function skærmHjemKlar(){
  const f = s.forberedelse;
  const dage = dageTil(f.dato);
  const stort = dage===0 ? 'I dag' : dage===1 ? 'I morgen' : dage>1 ? dage : 'Snart';
  $('indhold').innerHTML = `
  <div class="ned-hero ned-rejse">
    ${heroScene('klar', 420)}
    <div class="ned-lag">
      <div class="ned-top"><div class="h-logo">${logoSVG(true)}</div>${arytmiTæller()}</div>
      <div class="ned-label">${dage>1?t('hjem.nedtaelling','Nedtælling'):t('hjem.snartafsted','Snart afsted')}</div>
      <div class="ned-tal">${stort}</div>
      ${dage>1?`<div class="ned-label" style="margin-top:6px">${t('hjem.dagetil','dage til jeres tur')}</div>`:''}
      <!-- Sted, dato og lys er ÉN gruppe, ikke tre linjer der tilfældigvis
           står under hinanden (KN 17/9: "nu bliver det hele ret rodet").
           Hårfin streg over i stedet for en kasse om — heroen har ingen
           kasser, og den skulle den blive ved med ikke at have. -->
      <div class="ned-naar">
        <div class="ned-sted${f.destination?'':' uden'}">${esc(f.destination?f.destination.navn:t('hjem.vaelgsted','Vælg et sted'))}</div>
        <div class="ned-dato">${pænDato(f.dato)}</div>
        ${solLinje(f)}
      </div>
    </div>
  </div>
  <div class="tjek-blok">
    ${hjemProcesLinje()}
    ${afgangKort()}
    ${gæsteLinje(f)}
    <div class="side-fod">
      <button class="knap kontur bred" onclick="gåTil('turplan')">${ik('bog')} ${t('faelles.seturplan','Se hele turplanen')}</button>
      <!-- ⚠️ "Planlæg endnu en arytme" stod her ved siden af 17/9.

           KN: "Giver det mening at have planlæg endnu en arytme på denne
           skærm også? Jeg tænker kun folk planlægger en arytme ad gangen."

           Den er væk begge steder. Vejen til tur nummer to er den store
           "Ny arytme"-pille i loggen — ét tryk væk i bundnavigationen, og
           den skærm er også dér, man SER, hvad man allerede har. At blive
           tilbudt en ny opgave i bunden af den, man er midt i, er ikke en
           genvej; det er en afbrydelse. -->
      <div class="stille-række">
        <button class="knap stille fare" onclick="annullerForberedelse()">${t('faelles.annullertur','Annullér turen')}</button>
      </div>
    </div>
  </div>
  ${deltVarsel()}
  ${værktøjskasse()}`;
}
function skærmHjemNedtælling(){
  if(turPlanlagt()) return skærmHjemKlar();
  const f = s.forberedelse;
  const dage = dageTil(f.dato);
  const items = tjeklisteData();
  const klaret = items.filter(i=>i.klar).length;
  const pct = Math.round(klaret/items.length*100);
  const stort = dage===0 ? 'I dag' : dage===1 ? 'I morgen' : dage>1 ? dage : 'Snart';
  /* I fase 1 er stedet det eneste, der er valgt. Så er den runde knap
     turplanen, ikke invitationen — og "Se hele turplanen" nedenunder ville
     være den samme knap to gange. */
  const fase1 = (f.fase||1) === 1;
  const punkt = it => `
      <button class="tjek-punkt ${it.klar?'klar':''} ${it.låst?'låst':''}" onclick="${it.aktion}">
        <span class="tjek-boks">${ik(it.låst?'lås':'tjek')}</span>
        <span class="tjek-krop"><span class="tjek-navn">${it.navn}</span><span class="tjek-under">${it.under}</span></span>
        <span class="tjek-pil">${ik(it.låst?'lås':'pil')}</span>
      </button>`;
  const grund = items.filter(i=>!i.plan);   // dato og destination
  const plan  = items.filter(i=>i.plan);    // forplejning, bil, personligt
  /* Er de tre planlægningspunkter klaret, viser vi resultatet i stedet for
     tre grønne rækker, der ikke længere har noget at sige (OD 13/8). */
  const planBlok = planTrinKlaret()
    ? pakkeOpsummering() + retPlanlægningKnap()
    : `<div class="plan-overskrift">
         <h3>${PLANLÆG_OVERSKRIFT}</h3>
         <p class="dæmpet" style="font-size:12.5px;margin-top:2px">${t('hjem.tresamler','Når de tre er på plads, samler appen selv pakkelisten.')}</p>
       </div>
       ${plan.map(punkt).join('')}`;
  $('indhold').innerHTML = `
  <div class="ned-hero ned-rejse">
    ${heroScene('klar', 420)}
    <div class="ned-lag">
      <div class="ned-top"><div class="h-logo">${logoSVG(true)}</div>${arytmiTæller()}</div>
      <div class="ned-label">${dage>1?t('hjem.nedtaelling','Nedtælling'):t('hjem.snartafsted','Snart afsted')}</div>
      <div class="ned-tal">${stort}</div>
      ${dage>1?`<div class="ned-label" style="margin-top:6px">${t('hjem.dagetil','dage til jeres tur')}</div>`:''}
      <!-- Sted, dato og lys er ÉN gruppe, ikke tre linjer der tilfældigvis
           står under hinanden (KN 17/9: "nu bliver det hele ret rodet").
           Hårfin streg over i stedet for en kasse om — heroen har ingen
           kasser, og den skulle den blive ved med ikke at have. -->
      <div class="ned-naar">
        <div class="ned-sted${f.destination?'':' uden'}">${esc(f.destination?f.destination.navn:t('hjem.vaelgsted','Vælg et sted'))}</div>
        <div class="ned-dato">${pænDato(f.dato)}</div>
        ${solLinje(f)}
      </div>
    </div>
  </div>
  <div class="tjek-blok">
    ${faseBånd()}
    <div class="tjek-overskrift"><h2>${t('hjem.tjekliste','Jeres tjekliste')}</h2><span class="tjek-tæl">${t('hjem.afantal','{klaret} af {ialt}',{klaret,ialt:items.length})}</span></div>
    <div class="tjek-bar"><div class="fyld" style="width:${pct}%"></div></div>
    ${grund.map(punkt).join('')}
    ${planBlok}
    <!-- ⚠️ "Gem tur — planlæg detaljerne senere" stod her indtil 17/9.

         KN: "Gem tur og planlæg detaljerne senere gør ikke noget og giver
         vel egentlig heller ikke mening da man jo er der og det gemmes
         automatisk. Hvad er meningen egentlig med at gemme når det gemmer
         alligevel uden at trykke?"

         Han har ret, og koden giver ham ret: s.forberedelse er en GETTER
         over s.arytmer (se klargørState), turen bor i listen fra det
         sekund den bliver til, og gem() kaldes ved hver eneste ændring —
         hundrede steder i filen. Der var ingenting at gemme.

         Det, knappen FAKTISK gjorde, var at slippe turen og gå til loggen.
         Men sikrAktivTur() falder alligevel tilbage på den næste tur, og
         bundnavigationen står der hele tiden — så vejen ud fandtes i
         forvejen. Tilbage var kun et navn, der lovede noget, appen allerede
         havde gjort. Og en knap, man trykker på for en sikkerheds skyld,
         lærer én at tvivle på resten.

         gemTilSenere() er fjernet sammen med den. Den ligger i git.

         ⚠️ INGEN BAKTIKKER I EN KOMMENTAR HERINDE. Hele blokken står i en
         template-streng, og en baktik lukker den midt i sætningen. Det
         kostede en syntaksfejl at finde ud af. -->
    ${klaret===items.length
      ? `<button class="knap primær bred" style="margin-top:14px" onclick="tilAfsted()">${t('hjem.alterklar','Alt er klar — afsted')} ${ik('måne')}</button>`
      : `<p class="dæmpet" style="text-align:center;font-size:12.5px;margin-top:12px">${t('hjem.krydsresten','Kryds resten af, så bliver hele listen grøn.')}</p>`}
    <!-- Invitationen er skjult i hele appen, indtil brugere er afklaret
         (OD 31/8, J1). inviterKnap() og skærmInvitation() står urørt i filen —
         de er bare ikke kaldt fra nogen skærm. -->
    <!-- Den runde "Se den foreløbige turplan" er væk fra forsiden (OD 5/10:
         turen har allerede "Se/ret planen" i Arytme log). foreløbigPlanKnap()
         står urørt i filen, men kaldes ikke. -->
    <div class="side-fod">
      ${fase1 ? '' : `<button class="knap kontur bred" onclick="gåTil('turplan')">${ik('bog')} ${t('faelles.seturplan','Se hele turplanen')}</button>`}
      <!-- ⚠️ "Planlæg endnu en arytme" stod her ved siden af 17/9.

           KN: "Giver det mening at have planlæg endnu en arytme på denne
           skærm også? Jeg tænker kun folk planlægger en arytme ad gangen."

           Den er væk begge steder. Vejen til tur nummer to er den store
           "Ny arytme"-pille i loggen — ét tryk væk i bundnavigationen, og
           den skærm er også dér, man SER, hvad man allerede har. At blive
           tilbudt en ny opgave i bunden af den, man er midt i, er ikke en
           genvej; det er en afbrydelse. -->
      <div class="stille-række">
        <button class="knap stille fare" onclick="annullerForberedelse()">${t('faelles.annullertur','Annullér turen')}</button>
      </div>
    </div>
  </div>
  ${deltVarsel()}
  ${værktøjskasse()}`;
}
/* Vejen tilbage i planlægningen (OD 31/8). Når de tre punkter er klaret, bliver
   rækkerne erstattet af pakkelisten — og så var der ingen vej ind og rette et
   madscenarie eller et stykke biludstyr igen. Den lander på første
   planlægningstrin, så man kan bladre videre derfra. */
function retPlanlægningKnap(bred){
  const mål = sektionListe(2)[0].id;
  return bred
    ? `<button class="knap kontur bred" style="margin-top:14px" onclick="gåTil('${mål}')">${ik('tilbage')} ${t('hjem.retplanlaegning','Ret i planlægningen')}</button>`
    : `<div class="stille-række" style="margin-top:2px"><button class="knap stille" onclick="gåTil('${mål}')">${t('hjem.retplanlaegning','Ret i planlægningen')}</button></div>`;
}
/* Fase 1: invitationen er skjult, og den runde knap viser i stedet den
   foreløbige turplan (OD 31/8). At spørge om hvem der skal med, før stedet er
   faldet på plads, er præcis det trin, der blev fjernet 13/8, fordi det spærrede
   vejen. Rejsemakkeren hører til, når turen er en tur. */
function foreløbigPlanKnap(){
  return `<div class="inviter-blok">
    <button class="rund-knap inviter-rund" onclick="gåTil('turplan')"
            aria-label="${esc(t('hjem.turplanknap','Se den foreløbige turplan'))}">
      ${ik('bog')}
    </button>
    <div class="inviter-tekst">${t('hjem.turplanknap','Se den foreløbige turplan')}</div>
    <div class="inviter-under">${t('hjem.turplanunder','Sådan ser turen ud indtil videre')}</div>
  </div>`;
}
/* Invitationen som rund knap i bunden af overblikket (OD 13/8) — samme form
   som startknappen på forsiden, så det læses som "det store greb her på siden"
   og ikke som endnu en række i en liste. Har man allerede valgt, står
   status under knappen i stedet for opfordringen. */
function inviterKnap(){
  const f = s.forberedelse;
  const valgt = !!f.invType;
  return `<div class="inviter-blok">
    <button class="rund-knap inviter-rund" onclick="gåTil('invitation')"
            aria-label="${esc(t('hjem.inviterknap','Inviter til denne arytme'))}">
      ${ik(valgt ? (f.invType==='gave'?'gave':f.invType==='selv'?'puls':'folk') : 'folk')}
    </button>
    <div class="inviter-tekst">${valgt ? esc(invUnderTekst(f)) : t('hjem.inviterknap','Inviter til denne arytme')}</div>
    ${valgt?'':`<div class="inviter-under">${t('hjem.inviterunder','Sammen, som gave — eller helt for dig selv')}</div>`}
  </div>`;
}
/* Når de tre planlægningspunkter er klaret, er det listen, de har lavet,
   der skal stå — ikke tre afkrydsede rækker. */
function pakkeOpsummering(){
  const liste = pakkeListe();
  const f = s.forberedelse;
  // klarTjek, ikke pakkeTjek — se kommentaren i turStatus()
  const pakket = liste.filter(p=>(f.klarTjek||[]).includes(p.id)).length;
  return `<div class="plan-overskrift">
      <h3>${t('hjem.pakkeliste','Jeres pakkeliste')}</h3>
      <p class="dæmpet" style="font-size:12.5px;margin-top:2px">${t('hjem.pakkelisteunder','Samlet af det, I valgte under forplejning, bil og personligt.')}</p>
    </div>
    <button class="tjek-punkt" onclick="gåTil('klar-pakke')">
      <span class="tjek-boks">${ik('tjek')}</span>
      <span class="tjek-krop">
        <span class="tjek-navn">${t('hjem.tingatpakke','{antal} ting at pakke',{antal:liste.length})}</span>
        <span class="tjek-under">${t('hjem.krydsetaf','{antal} krydset af · tryk for at se listen',{antal:pakket})}</span>
      </span>
      <span class="tjek-pil">${ik('pil')}</span>
    </button>`;
}
/* =============================================================
   GÆSTEN PÅ TUREN (KN 6/9) — "inviter en ven til din arytme"

   To skridt, ikke ét: FØRST hvem (navn + telefon), SÅ hvad han eller hun
   skal have med. Fordelingen er hele pointen — en invitation uden den er
   bare en besked om, at man skal mødes.

   Den faste partner (profilen) og gæsten her er IKKE det samme. Partneren
   har adgang til appen og alle ture; gæsten får ét link til én pakkeliste
   og skal ikke kunne se resten. Derfor to felter, to steder, to ord.

   Prototype: SMS'en sendes ikke rigtigt. Den vises, som den ville se ud,
   og gæstens svar simuleres — samme mønster som "Prøv gæstens svar (demo)"
   i den gamle rejsemakker-invitation. */
const VEN_EJERE = [
  { id:'min',    kort:'Mig' },
  { id:'deres',  kort:'Dem' },
  { id:'fælles', kort:'Fælles' }
];
function ven(){ const f = s.forberedelse; return (f && f.ven) || null; }
function venNavn(){ const v = ven(); return (v && v.navn) || 'din ven'; }
function venAfventer(a){ const v = (a||s.forberedelse||{}).ven; return !!(v && v.status==='afventer'); }
function venAccepteret(a){ const v = (a||s.forberedelse||{}).ven; return !!(v && v.status==='accepteret'); }
/* Hvem har ansvaret for punktet? Uden svar: mig. Man pakker selv, indtil man
   aktivt giver noget videre — aldrig omvendt. */
function venEjer(id){
  const f = s.forberedelse;
  return (f && f.venFordeling && f.venFordeling[id]) || 'min';
}
function sætVenEjer(id, ejer){
  const f = s.forberedelse; if(!f) return;
  if(!f.venFordeling) f.venFordeling = {};
  f.venFordeling[id] = ejer;
  gem(); tegn();
}
/* Hele en liste på én gang — 49 punkter ét ad gangen er ikke en fordeling,
   det er en straf. */
function sætVenEjerListe(sektionId, ejer){
  const f = s.forberedelse; if(!f) return;
  const sek = pakkeSektioner().find(x=>x.id===sektionId); if(!sek) return;
  if(!f.venFordeling) f.venFordeling = {};
  sek.lister.flatMap(l=>l.punkter).forEach(p=>{ f.venFordeling[p.id] = ejer; });
  gem(); tegn();
}
function venTæl(ejer){
  return pakkeListe().filter(p=>venEjer(p.id)===ejer).length;
}
/* Mærkatet på pakkelisten. Vises KUN når der er en gæst — uden en at dele
   med er "Mig" på hvert eneste punkt ren støj. */
function ejerMærkat(id){
  const f = s.forberedelse;
  if(!f || !f.ven || !f.ven.status) return '';
  const ejer = venEjer(id);
  const navn = ejer==='min' ? 'Mig'
    : ejer==='fælles' ? 'Fælles'
    : (f.ven.navn||'Gæst').split(' ')[0];
  return `<span class="ejer-mærkat ${ejer}">${esc(navn)}</span>`;
}
/* DET FALSKE LINK ER VÆK (11/9).

   Her stod en funktion, der lavede en hash af turens id og navnet og satte
   den efter `arytmi.com/liste/`. Den så ud som et link og var det ikke —
   samme slags løgn som den tegnede SMS i partnerkortet.

   Det rigtige token laves af `inviter-gaest` i det sekund, beskeden
   sendes, og kun hashen gemmes. Appen kan derfor ikke kende linket på
   forhånd, og det er meningen: kunne den det, ville tokenet være noget,
   klienten fandt på.

   Linket sættes på af serveren, på sin egen linje efter afsenderens tekst.
   Kom det fra klienten, kunne det peges hvor som helst — og en invitation
   fra Arytmi ville kunne føre et andet sted hen. */
/* Beskeden gæsten får. Den skal kunne stå alene i en indbakke (KN 7/9): hvor,
   hvornår, og hvornår I er hjemme igen. Før stod stedets navn og datoen inde i
   én sætning — intet klokkeslæt, ingen adresse, intet om hjemkomsten. En gæst,
   der skal sige ja, skal kunne se hele det døgn, han siger ja til.

   "Hvor" er stedets navn OG koordinaterne. Vores steder har ingen vejnavn — de
   ligger, hvor vejen holder op — så koordinatet ER adressen. Samme ærlighed som
   afgangskortet; se kommentaren over turKoordinat().

   Slutlinjen er skiftet ud. Der stod "Sig til, hvis du er med", og det lød, som
   om afsenderen bagefter selv skulle godkende gæsten. Sådan virker det ikke:
   gæsten siger ja på sit eget link, og turen går derved fra "Afventer" til "er
   med" (venAccepter). Nu siger beskeden det, funktionen gør. */
function venSMSStandard(){
  const f = s.forberedelse;
  if(!f) return '';
  const navn  = (f.ven && f.ven.navn) || 'Hej';
  const sted  = f.destination ? f.destination.navn : 'et sted vi finder';
  const adr   = turAdresse(f);
  const koord = turKoordinat(f);
  const afs   = afsenderNavn();
  const antal = venTæl('deres') + venTæl('fælles');
  const hvornår = f.dato
    ? pænDato(f.dato) + (f.afgangstid ? ' · afgang ca. kl. ' + f.afgangstid : '')
    : 'en dato vi aftaler';
  const hvor = (adr && adr !== sted ? adr : sted) + (koord ? ' (' + koord + ')' : '');
  const hjem = f.dato ? turHjemkomstTekst(f) : 'samme aften';
  const listeLinje = antal
    ? t('gaest.smsdinliste','Du har {antal} ting på din del af pakkelisten.',{antal})
    : t('gaest.smshelelisten','Pakkelisten er med på linket.');
  /* SKABELONEN KAN RETTES I BAGRUMMET (OD 4/10: "Jeg vil gerne kunne rette
     i den default tekst kunder sender som sms til en ven").

     Indtil 4/10 stod teksten her i koden, og det var med vilje — tre ting
     i t()-laget passede ikke til en SMS. Sådan er de løst:

     1) t() ESCAPER sine værdier, fordi alt andet i appen er HTML. Derfor
        hentes skabelonen UDEN værdier (så escapes intet), og felterne
        fyldes bagefter i som ren tekst. Hedder gæsten "Ask & Embla", står
        der "Ask & Embla" på hendes telefon.
     2) Linjeskiftene står som \n i faldbakken, og hent-noegler.mjs
        oversætter dem nu til rigtige linjeskift (4/10). Bagrummet viser
        teksten i et tekstfelt med flere linjer.
     3) Det er et almindeligt t(-kald, så måleren og udtrækket finder det.

     Felterne: {navn} {afsender} {sted} {hvornaar} {hvor} {hjem} {pakkeliste}.
     Fjerner Oliivia et felt i bagrummet, står det bare ikke i beskeden. */
  const skabelon = t('gaest.smsskabelon','Hej {navn}!\n\n{afsender} inviterer dig med på en arytme til {sted}.\n\nHvornår: {hvornaar}\nHvor: {hvor}\nHjemme igen: {hjem}\n\n{pakkeliste}\n\nSig ja tak på linket, så ved {afsender}, at du er med.');
  const felter = { navn, afsender:afs, sted, hvornaar:hvornår, hvor, hjem, pakkeliste:listeLinje };
  return skabelon.replace(/\{(navn|afsender|sted|hvornaar|hvor|hjem|pakkeliste)\}/g, (_, k) => felter[k]);
}
/* Kladden fryses IKKE ved første tegning, sådan som mailen til rejsemakkeren
   gør (se mailKladde). Fordelingen af pakkelisten laves på selve den skærm,
   beskeden står på, og et frosset "3 ting står på din" ville lyve i samme
   sekund, man flyttede et punkt. Standardteksten regnes derfor live — indtil
   brugeren selv skriver i feltet. Derfra er teksten hans. */
function venSMSTekst(){
  const f = s.forberedelse;
  return (f && f.venSMSTekst != null) ? f.venSMSTekst : venSMSStandard();
}
function venSMSFelt(værdi){
  const f = s.forberedelse; if(!f) return;
  f.venSMSTekst = værdi;
  gem();   // ingen tegn(): ellers mister man markøren midt i en sætning
}
function nulstilVenSMS(){
  const f = s.forberedelse; if(!f) return;
  f.venSMSTekst = null;
  gem(); tegn();
  flash('Beskeden er sat tilbage til Arytmis egen.', 'telefon');
}

/* Trin 1: hvem. */
function skærmVenInviter(){
  const f = s.forberedelse; if(!f){ gåTil('log'); return; }
  const v = f.ven || {};
  const klar = !!(v.navn && v.telefon);
  $('indhold').innerHTML = `<div class="side anim">
    ${skærmTop('Inviter en ven','log','Med på turen')}
    <div class="kort guide-brød"><p style="margin:0">${t('gaest.brod','Din ven får en SMS med et link til pakkelisten. Ingen app, ingen kode — bare listen over det, der skal huskes.')}</p></div>
    <div class="kort">
      <label class="felt-etiket" style="margin-top:0">${t('gaest.navn','Vennens navn')}</label>
      <input type="text" placeholder="${esc(t('gaest.navnplads','Fx Anne'))}" value="${esc(v.navn||'')}"
             oninput="venFelt('navn',this.value)">
      <label class="felt-etiket">${t('gaest.telefon','Telefonnummer')}</label>
      <input type="tel" inputmode="tel" placeholder="${esc(t('gaest.telefonplads','12 34 56 78'))}" value="${esc(v.telefon||'')}"
             oninput="venFelt('telefon',this.value)">
      <p class="dæmpet" style="font-size:12.5px;margin-top:10px">${t('gaest.nummernote','Nummeret bruges kun til at sende linket. Det gemmes på turen — ikke i din telefonbog.')}</p>
      <button class="knap primær bred" id="venVidereKnap" style="margin-top:16px" ${klar?'':'disabled'}
              onclick="gåTil('ven-fordel')">${t('gaest.fordelknap','Fordel pakkelisten')} ${ik('pil')}</button>
    </div>
    ${f.ven && f.ven.status ? `
    <div class="stille-række" style="margin-top:8px">
      <button class="knap stille fare" onclick="venFjern()">${t('gaest.fjern','Fjern {navn} fra turen',{navn:f.ven.navn||t('gaest.gaesten','gæsten')})}</button>
    </div>` : ''}
    ${venUdKnap()}
  </div>`;
}
/* EN VEJ UD (OD 4/10: "Man kan ikke komme ud af inviter en ven uden at
   sende"). Fører tilbage til skærmen FØR invitationen — loggen eller
   turplanen, alt efter hvor man kom fra — og rydder ven-trinene af
   historikken, så tilbage-pilen ikke fører ind i dem igen. */
function venUdMål(){
  for(let i = historik.length-1; i >= 0; i--){
    if(!/^ven-/.test(historik[i].skærm)) return historik[i].skærm;
  }
  return 'log';
}
function venUdKnap(){
  const mål = venUdMål();
  return `<div style="margin-top:18px;text-align:center">
      <button class="knap kontur lille" onclick="tilbageTil(venUdMål())">${ik('tilbage')} ${mål==='log'
        ? t('gaest.tillog','Tilbage til din Arytme log') : t('invitation.tiloverblik','Tilbage til overblikket')}</button>
    </div>`;
}
function venFelt(felt, værdi){
  const f = s.forberedelse; if(!f) return;
  if(!f.ven) f.ven = { navn:'', telefon:'', status:null };
  f.ven[felt] = værdi;
  gem();
  const k = $('venVidereKnap');
  if(k) k.disabled = !(f.ven.navn && f.ven.telefon);
}
/* Trin 2: hvem har hvad med. Samme lister som pakkelisten — det er den
   samme liste, set fra en anden vinkel. */
function skærmVenFordel(){
  const f = s.forberedelse; if(!f){ gåTil('log'); return; }
  if(!f.ven || !f.ven.navn){ gåTilErstat('ven-inviter'); return; }
  const sektioner = pakkeSektioner();
  const raaVenNavn = f.ven.navn;
  const navn = esc(raaVenNavn);
  const kort = { min:t('gaest.kortmig','Mig'), deres:navn.split(' ')[0], 'fælles':t('gaest.kortfaelles','Fælles') };
  const knapper = p => `<span class="ejer-valg" role="group" aria-label="${t('gaest.hvempakkeraria','Hvem pakker {ting}?',{ting:p.tekst})}">
      ${VEN_EJERE.map(e=>`<button type="button" class="ejer-knap ${venEjer(p.id)===e.id?'valgt '+e.id:''}"
        onclick="sætVenEjer('${p.id}','${e.id}')">${esc(kort[e.id])}</button>`).join('')}
    </span>`;
  $('indhold').innerHTML = `<div class="side anim">
    ${skærmTop(t('gaest.fordeltitel','Hvem pakker hvad?'),'ven-inviter',t('gaest.fordeletiket','Trin 2 af 2'))}
    <div class="kort guide-brød"><p style="margin:0">${t('gaest.fordelbrod','Sæt hvert punkt på din liste, {navn}s liste — eller Fælles, hvis I begge skal have det med. {navn} ser kun sine egne og de fælles.',{navn:raaVenNavn})}</p></div>
    <div class="ejer-tæller">
      <span>${ik('person')} ${t('gaest.mig','Mig:')} <b>${venTæl('min')}</b></span>
      <span>${ik('folk')} ${navn}: <b>${venTæl('deres')}</b></span>
      <span>${ik('hjerte')} ${t('gaest.faelles','Fælles:')} <b>${venTæl('fælles')}</b></span>
    </div>
    ${sektioner.length ? sektioner.map(sek=>{
      const punkter = sek.lister.flatMap(l=>l.punkter);
      return `<div class="liste" style="margin-bottom:12px">
        <div class="liste-punkt bil-emne" style="cursor:default">
          <div class="navn"><span class="pakke-titel">${esc(sek.navn)}</span>
            <div class="dæmpet" style="font-size:12.5px;margin-top:2px">${punkter.length} ${punkter.length===1?'ting':'ting'}</div>
          </div>
        </div>
        <div class="bil-krop" style="padding-bottom:8px;border-bottom:none">
          <div class="ejer-hurtig">Hele listen til:
            ${VEN_EJERE.map(e=>`<button class="som-link" onclick="sætVenEjerListe('${sek.id}','${e.id}')">${esc(kort[e.id])}</button>`).join('<span class="ejer-skil">·</span>')}
          </div>
          ${punkter.map(p=>`
            <div class="ejer-række">
              <div class="ejer-navn">${esc(p.tekst)}</div>
              ${knapper(p)}
            </div>`).join('')}
        </div>
      </div>`;
    }).join('')
    : `<div class="liste"><div class="liste-punkt"><div class="navn dæmpet">${t('gaest.tomliste','Pakkelisten er tom endnu — planlæg turen først, så er der noget at fordele.')}</div></div></div>`}
    <!-- Beskeden er et felt, ikke et opslag (KN 7/9). Man skal kunne skrive
         "husk badetøjet" til sin ven uden at forlade appen. -->
    <div class="ob-mail" style="margin-top:16px">
      <div class="m-top">${ik('telefon')} ${t('gaest.til','Til: {nummer}',{nummer:f.ven.telefon||''})}</div>
      <div class="m-krop">
        <p class="dæmpet" style="font-size:12.5px;margin:0 0 10px">${t('gaest.retbesked','Ret frit i beskeden, før du sender.')}</p>
        <textarea class="mail-felt" oninput="venSMSFelt(this.value)">${esc(venSMSTekst())}</textarea>
        ${f.venSMSTekst != null ? `<div class="stille-række" style="margin-top:8px">
          <button class="knap stille" onclick="nulstilVenSMS()">${t('gaest.nulstilbesked','Nulstil beskeden')}</button>
        </div>` : ''}
      </div>
    </div>
    <button class="knap primær bred" id="venSendKnap" style="margin-top:14px" onclick="venSend()">${ik('telefon')} ${t('gaest.inviter','Inviter {navn}',{navn})}</button>
    <!-- "Linket sættes ind af Arytmi, når du sender." er fjernet (KN 5/10: "det er vel ikke interessant for kunden"). -->
    ${venUdKnap()}
  </div>`;
}
/* HVAD GÆSTEN SKAL SE. Den regnes HER og ikke på serveren, fordi
   pakkelistens opdeling findes her — `pakkeListe()` og `venEjer()` ud af
   turens egne valg. Den samme udregning to steder ville drive fra
   hinanden.

   Kun det, gæsten skal bruge, kommer med. Serveren klipper hvert felt igen,
   men den er ikke den eneste, der passer på: det er forskellen på en gæst
   og en rejsemakker, at gæsten IKKE ser resten af turen. */
function venVisning(){
  const f = s.forberedelse; if(!f) return {};
  const sted = f.destination ? f.destination.navn : '';
  const adr = turAdresse(f), koord = turKoordinat(f);
  return {
    fra: afsenderNavn(),
    sted: sted,
    hvornaar: f.dato
      ? pænDato(f.dato) + (f.afgangstid ? ' · afgang ca. kl. ' + f.afgangstid : '')
      : 'En dato I aftaler',
    hvor: (adr && adr !== sted ? adr : sted) + (koord ? ' (' + koord + ')' : ''),
    hjem: f.dato ? turHjemkomstTekst(f) : '',
    ting: pakkeListe()
      .filter(p => venEjer(p.id) === 'deres' || venEjer(p.id) === 'fælles')
      .map(p => p.navn || p.tekst || '')
      .filter(Boolean)
  };
}
/* TUREN SKAL VÆRE NÅET OP, FØR DER KAN INVITERES TIL DEN (KN 15/9).

   Fejlen så ud som en SMS, der ikke kom frem. Den var noget andet:
   `inviter-gaest` svarede 404 med "Turen findes ikke". Funktionen slår
   turen op med SERVICE-nøglen, så RLS var ikke i vejen — rækken fandtes
   simpelthen ikke endnu.

   Grunden er rækkefølgen. `venSend()` sendte turens id af sted uden at
   sikre, at turen selv var sendt. Er udbakken ikke tømt — man har lige
   lavet turen, nettet har været væk, eller `skub()` er ikke nået at køre
   endnu — så peger invitationen på noget, serveren ikke kender.

   Nu tømmes udbakken FØRST. Kan den ikke tømmes, siger vi det, som det er,
   i stedet for at lade serveren svare "Turen findes ikke" — den besked
   peger det forkerte sted hen og sender folk ud at lede efter en tur, der
   ligger lige foran dem. */
/* TUREN SKAL OP — OG DET ER APPENS ARBEJDE, IKKE HENDES (KN 4/10: "Det
   skal bare spille"). Før tømte venSend bare udbakken og gav op med "prøv
   igen om et øjeblik". Det hjalp ikke, når udbakken aldrig var startet
   (login uden genstart) eller sessionen var væk: så kunne hun prøve igen
   til evig tid. Nu:
     1. Er hun ikke logget ind, beder vi om det — det er den eneste vej.
     2. Har udbakken aldrig hentet, henter den nu (det er dét, der tænder den).
     3. Alt lokalt, serveren ikke kender, lægges i udbakken og sendes.
     4. Er der stadig noget tilbage, prøves der et par gange med en pause.
   Svarer 'ok', 'login' eller 'net'. */
async function sikrTurenErOppe(){
  if(!window.ArytmiSync || !ArytmiSync.skub) return 'ok';
  if(ArytmiAuth.harSession && (await ArytmiAuth.harSession()) === false) return 'login';
  try{ if(ArytmiSync.status && !ArytmiSync.status().klar) await ArytmiSync.hent(); }catch(e){}
  try{ ArytmiSync.efterGem(); }catch(e){}
  for(let forsøg = 0; forsøg < 4; forsøg++){
    let venter;
    try { venter = await ArytmiSync.skub(); } catch(e){ venter = -1; }
    if(venter === 0) return 'ok';
    await new Promise(r => setTimeout(r, 700 * (forsøg + 1)));
  }
  return 'net';
}
async function venSend(){
  const f = s.forberedelse; if(!f || !f.ven){ return; }
  const knap = $('venSendKnap');
  const knapIgen = () => { if(knap){ knap.disabled = false; knap.innerHTML = ik('telefon') + ' Inviter ' + esc(f.ven.navn); } };
  if(knap){ knap.disabled = true; knap.textContent = 'Sender…'; }

  const oppe = await sikrTurenErOppe();
  if(oppe === 'login'){
    knapIgen();
    loginKræves = true; tegn();
    return;
  }
  if(oppe === 'net'){
    knapIgen();
    flash(t('faelles.ingenforbindelse','Ingen forbindelse lige nu. Det, du har lavet, venter og sendes, når der er net.'), 'info');
    return;
  }

  let svar = await ArytmiAuth.inviterGaest(
    f.id, f.ven.navn, f.ven.telefon, venSMSTekst(), venVisning()
  );
  /* Én gang til, hvis serveren alligevel ikke kendte turen: så har en
     skrivning ramt lige ved siden af, og en ny runde tager den med. */
  if(!svar.ok && /findes ikke/i.test(svar.fejl || '') && (await sikrTurenErOppe()) === 'ok'){
    svar = await ArytmiAuth.inviterGaest(f.id, f.ven.navn, f.ven.telefon, venSMSTekst(), venVisning());
  }

  if(!svar.ok){
    knapIgen();
    /* "Turen findes ikke" er serverens sande svar, men det peger det
       forkerte sted hen: turen ligger jo lige dér på skærmen. Den findes
       bare ikke PÅ SERVEREN endnu. Vi siger det, der er til at handle på.

       Og vi skriver id'et i konsollen. Sker det igen, er det første
       spørgsmål "hvilken tur bad den om" — og det svar skal man kunne
       finde uden at skulle gætte. `webContentsDebuggingEnabled` er tændt,
       så konsollen kan læses fra chrome://inspect. */
    if(/findes ikke/i.test(svar.fejl || '')){
      console.error('[venSend] Serveren kendte ikke turen.',
        { tur_id: f.id, udbakke: (window.ArytmiSync && ArytmiSync.status) ? ArytmiSync.status().venter : '?' });
      flash(t('gaest.turenikkeoppe','Turen er ikke nået op på serveren endnu. Prøv igen om et øjeblik — din gæst kan først inviteres, når turen er der.'), 'kryds');
      return;
    }
    flash(svar.fejl);
    return;
  }

  f.ven.status = 'afventer';
  f.ven.telefon = svar.telefon || f.ven.telefon;
  f.ven.sendt = new Date().toISOString().slice(0,10);
  gem(); nulstilHistorik(); gåTil('log');
  infoModal(t('gaest.sendtmodal','SMS\'en er sendt til <b>{navn}</b>. Turen står som <b>Afventer</b>, indtil der er svaret på linket.',{navn:f.ven.navn}), t('faelles.godt','Godt'));
}

/* HVORNÅR BLIVER "AFVENTER" TIL "ER MED"?

   Gæsten svarer på arytmi.com/liste, på SIN telefon. Denne app hører aldrig
   om det af sig selv — derfor spørger vi databasen, når turene tegnes. Før
   var der en demo-knap, hvor AFSENDEREN kunne trykke "Gæsten accepterer"
   på sin egen telefon. Den er væk; den kunne kun bekræfte, at vi troede på
   os selv.

   Svaret må skiftes: man kan sige ja og blive syg dagen efter. Derfor går
   den her begge veje — men kun når vi faktisk FIK spurgt. */
async function venOpdaterSvar(a){
  const tur = a || s.forberedelse;
  if(!tur || !tur.ven || !tur.ven.status) return;
  if(!ArytmiAuth.tilgaengelig()) return;
  const r = await ArytmiAuth.hentGaest(tur.id);
  if(!r.ok) return;   // vi fik ikke spurgt. Rør ingenting.

  /* "AFVENTER" UDEN EN INVITATION BAG (11/9).

     Den gamle `venSend()` satte `status = 'afventer'` og sendte aldrig
     noget. Den status ligger inde i turens `data` og synkroniseres derfor
     OP — så en tur, der er blevet rørt af en app fra før i dag, kan bære
     et "Afventer", der aldrig har haft en invitation bag sig. Play-udgaven
     er stadig den gamle, så det kan nå at ske igen, indtil der er bygget.

     Første udgave af den her funktion returnerede bare, når der ingen
     gæsterække var, og så ville sådan et "Afventer" stå for evigt. Det er
     nøjagtig den samme fejl, som partnerkortet havde og fik rettet samme
     dag — jeg gentog den her, fordi jeg skrev "hvis der er en gæst, så
     opdatér" i stedet for "hvad siger serveren".

     Spurgte vi, og er der ingen åben invitation, skal kortet ikke påstå,
     at der er. Det gælder også, når afsenderen har sendt en ny til en
     anden: den gamle er annulleret, og `hentGaest` ser kun den åbne. */
  if(!r.gaest){
    tur.ven.status = null;
    gem(); tegn();
    return;
  }

  const nyStatus = r.gaest.svar === 'ja' ? 'accepteret'
                 : r.gaest.svar === 'nej' ? 'afbud'
                 : 'afventer';
  if(tur.ven.status === nyStatus) return;
  tur.ven.status = nyStatus;
  gem();
  tegn();
}
function venFjern(){
  const f = s.forberedelse; if(!f) return;
  bekræft('Fjern gæsten fra turen? Fordelingen af pakkelisten slettes med.', ()=>{
    /* Beskeden følger gæsten ud (KN 7/9) — ellers arver næste gæst en tekst
       med det forrige navn i. */
    f.ven = null; f.venFordeling = {}; f.venSMSTekst = null;
    gem(); tilbageTil('log');
    flash('Gæsten er fjernet fra turen.', 'kryds');
  });
}
/* =============================================================
   DESTINATIONEN TIL BILEN (KN 6/9)
   Samme handling to steder: "Del med bil" på Hjem og "Send destination til
   køretøj" i loggen. Én funktion, så de aldrig kan komme til at gøre noget
   forskelligt. Prototype: bilen findes ikke, så vi kvitterer i stedet. */
function turAdresse(a){
  const f = a || s.forberedelse;
  const d = f && f.destination;
  if(!d) return null;
  return d.adresse || d.navn;
}
/* Vores steder HAR ingen vejnavn — de ligger, hvor vejen holder op. Det, en
   bilnavigation kan bruge, er koordinaterne, så det er dem, vi viser. Ærligt
   frem for at opfinde en adresse, der ikke findes. */
function turKoordinat(a){
  const f = a || s.forberedelse;
  const d = f && f.destination;
  if(!d) return null;
  const t = d.testetId ? TESTEDE.find(x=>x.id===d.testetId) : null;
  if(t && t.lat!=null) return t.lat.toFixed(5) + ', ' + t.lon.toFixed(5);
  if(d.x!=null && d.y!=null){
    const g = xyTilGeo(d.x, d.y);
    return g.lat.toFixed(5) + ', ' + g.lon.toFixed(5);
  }
  return null;
}
function sendTilKøretøj(id){
  const a = id ? s.arytmer.find(x=>x.id===id) : s.forberedelse;
  const adr = turAdresse(a);
  if(!adr){ flash(t('turen.vaelgdestfoerst','Vælg en destination først.'), 'nål'); return; }
  infoModal(t('turen.sendttilbil','<b>{adresse}</b> er sendt til bilen. Adressen ligger klar i navigationen, når I sætter jer ind.',{adresse:adr}), t('faelles.godt','Godt'));
}

/* Samlet, rolig oversigt over turen: hvornår, hvorhen, med hvem, hjem igen.
   Forplejningen er væk herfra (OD 30/8) — den stod som en lang liste midt i
   en side, der ellers svarer på fire spørgsmål, og den findes allerede på
   pakkelisten. Til gengæld ligger "stedet er optaget"-udvejen nu her. */
/* DELER I DEN HER TUR? (KN 15/9)

   Vises KUN, når der faktisk er en aktiv rejsemakker. Uden en at dele med
   er "del denne tur" et spørgsmål uden modtager, og en kontakt, der ikke
   gør noget, er værre end ingen kontakt.

   KONTAKTEN VENDER MOD DELING, ikke mod hemmeligholdelse: slået TIL
   betyder "hun kan se den", fordi det er standarden, og fordi en kontakt
   skal stå på det almindelige, ikke på undtagelsen.

   HANDLINGEN ER ÆGTE, ikke kosmetik. `privat` går med turen op i
   `ture.data`, og politikken fra 0029 holder rækken tilbage på serveren.
   Hendes app henter den altså ikke — og `anvendPåTilstand()` i sync.js
   fjerner den kopi, hun allerede måtte have. */
/* Delt betyder EKSPLICIT delt. `privat === false` og ikke `!privat`:
   en tur, hvor feltet mangler, er ikke delt — den er bare ikke sat. Med
   `!privat` ville den regne som delt, og så ville standarden være åben
   igen ad bagvejen. */
function turDeles(a){ return !!a && a.privat === false; }
/* En ven, der er inviteret eller har sagt ja, har det andet sæde i bilen.
   Så kan turen ikke OGSÅ deles med rejsemakkeren (KN 5/10: "enten ven eller
   partner") — den modsatte spærre står i gæsteKnap(). Et afbud frigiver sædet. */
function venHarSædet(a){ return !!(a && a.ven && (a.ven.status==='afventer' || a.ven.status==='accepteret')); }
function skiftTurDeling(id){
  /* Tager et id, fordi kontakten staar paa TURKORTET i loggen, hvor der kan
     ligge flere ture under hinanden — ikke kun paa den, man arbejder i. */
  const f = id ? (s.arytmer||[]).find(a => a && a.id === id) : s.forberedelse;
  if(!f) return;
  /* Kun ejeren bestemmer, hvem der ser turen. Kontakten TEGNES ikke paa en
     rejsemakkers tur (se `delerLinje`), men spaerren staar ogsaa her: den
     dag nogen kalder funktionen fra et andet sted, skal svaret vaere det
     samme. Samme greb som `sletTur`, og af samme grund — RLS filtrerer,
     den afviser ikke, saa en aendring her ville se ud til at lykkes og
     forsvinde igen ved naeste hentning. */
  if(id && fremmedRække('ture', id)){
    flash(t('turplan.kunejerendeler','Turen er {navn}s. Kun {navn} kan bestemme, hvem der ser den.',
      {navn: partnerNavn().split(' ')[0]}), 'kryds');
    return;
  }
  /* Kun det at TÆNDE er spærret. En tur, der blev delt før spærren kom, kan
     stadig slukkes — ellers sad man fast i en tilstand, appen ikke vil have. */
  if(!turDeles(f) && venHarSædet(f)){
    flash(t('turplan.venermed','{ven} er med på turen, så den kan ikke også deles med {navn}.',
      {ven: (f.ven.navn||t('gaest.gaestenstor','Gæsten')).split(' ')[0], navn: partnerNavn().split(' ')[0]}), 'folk');
    return;
  }
  /* En gave, der ikke er sendt endnu, kan ikke deles: så var den ikke en
     overraskelse. Vi siger det i stedet for bare at lade være. */
  if(gaveKladde(f) && f.privat){
    flash(t('turplan.gaveerskjult','Overraskelsen er skjult, indtil du sender den.'), 'gave');
    return;
  }
  /* Sættes ud fra det, der VISES, ikke ud fra !f.privat: står feltet
     tomt, ville !undefined give true — altså ingen synlig ændring, og en
     kontakt, der ikke rykker sig, ligner en fejl. */
  f.privat = turDeles(f) ? true : false;
  gem(); tegn();
  flash(f.privat
    ? t('turplan.nulukket','Turen er nu kun din.')
    : t('turplan.nudelt','{navn} kan se turen igen.',{navn:partnerNavn().split(' ')[0]}), f.privat?'kryds':'tjek');
}

function skærmTurplan(){
  const f = s.forberedelse;
  if(!f){ gåTil('hjem'); return; }
  const dest = f.destination;
  const dage = f.dato ? dageTil(f.dato) : null;
  const etiket = dage!=null ? (dage>1?dage+' dage til afgang':dage===1?'I morgen':dage===0?'I dag':'Turplan') : 'Turplan';
  const rad = (ikon, farve, navn, under, aktion) => `
    <div class="liste-punkt"${aktion?` onclick="${aktion}" style="cursor:pointer"`:''}>
      <span style="color:${farve};flex-shrink:0">${ik(ikon)}</span>
      <div class="navn" style="flex:1;font-size:14.5px">${navn}${under?`<div class="dæmpet" style="font-size:12px;margin-top:2px">${under}</div>`:''}</div>
      ${aktion?`<span style="color:#c9c2b0;flex-shrink:0">${ik('pil')}</span>`:''}
    </div>`;
  /* OD 11/8: turplanen skal kunne læses som ét svar på "hvornår, hvorhen, og
     hvornår er vi hjemme igen". Rejsemakker-rækken er ude 31/8 (J1) sammen med
     resten af invitationen — de to variabler, der beskrev den, er slettet med. */
  $('indhold').innerHTML = `<div class="side anim">
    ${skærmTop('Jeres turplan','hjem',etiket)}
    <div class="liste">
      ${rad('ur','var(--rav)','Afgang', f.dato ? pænDato(f.dato)+(f.afgangstid?' · ca. kl. '+f.afgangstid:'') : 'Dato ikke sat endnu', "gåTil('turdato')")}
      ${dest ? rad('nål','var(--rav)','Destination', esc(dest.navn), destinationsVej(f))
             : rad('nål','var(--rav)','Destination','Ingen destination endnu', destinationsVej(f))}
      ${rad('hjem','var(--rav)','Hjemkomst', turHjemkomstTekst(f)||'Ikke sat endnu', "gåTil('turdato')")}

      <!-- Pakkelisten hører til her (KN 6/9). Da knappen i loggen blev til
           "Send destination til køretøj", mistede listen sin faste indgang —
           og turplanen er stedet, man går hen for turens detaljer. -->
      ${pakkeListe().length ? rad('kurv','var(--rav)','Pakkeliste',
          pakkeListe().filter(p=>(f.klarTjek||[]).includes(p.id)).length + ' af ' + pakkeListe().length + ' pakket',
          "gåTil('klar-pakke')") : ''}
      ${f.ven && f.ven.status ? rad('folk','var(--rav)','Gæst',
          esc(f.ven.navn) + (f.ven.status==='accepteret' ? ' · er med' : ' · afventer svar'),
          "gåTil('ven-inviter')") : ''}
    </div>
    ${kørDerhen(dest)}
    ${planBSteder()}
  </div>`;
}

/* ---------- KØR DERHEN (17/9) ----------
   To ting, appen vidste og ikke sagde.

   1 · EN VEJ UD I TELEFONENS EGET KORT. Der fandtes ikke ét sted i appen
       en henvisning til et kortprogram — hverken Google Maps, Apple Maps
       eller en `geo:`-adresse. Man havde et stednavn og en pin på VORES
       kort, og skulle selv taste noget ind et andet sted for at køre
       derhen. `geo:` er valgt frem for et link til én bestemt udbyder,
       fordi telefonen så selv vælger, hvilket kortprogram der åbner —
       og fordi vi dermed ikke sender destinationen videre til nogen.

       ⚠️ `geo:` gør INGENTING i en browser på en computer. Det er
       rigtigt sådan: appen bor på en telefon. Prøver du det på 8642 og
       der ikke sker noget, er det ikke i stykker.

   2 · KOORDINATERNE I KLARTEKST. En alarmcentral vil have en position,
       ikke et stednavn — og "Rasteplads Mossøbrå" hjælper ingen klokken
       tre om natten på en grusvej. Stederne er valgt, fordi de er
       afsides, og så er det her den oplysning, der betyder mest.
       De står til at læse op og til at kopiere. */
function kørDerhen(dest){
  if(!dest) return '';
  const g = destGeo(dest);
  if(!Number.isFinite(g.lat) || !Number.isFinite(g.lon)) return '';

  const lat = g.lat.toFixed(5), lon = g.lon.toFixed(5);
  /* Navnet med i parentes, så kortprogrammet kan sætte en nål med et ord
     på. Det skal URL-kodes: et stednavn med & eller # ville ellers skære
     adressen over. */
  const mærke = encodeURIComponent(dest.navn || 'Arytmi');
  /* Sat sammen med + og ikke som template-streng, og det er ikke smag:
     tekstdækningsmåleren læser ALLE template-strenge i app.js som mulige
     brugertekster, og `geo:,?q=,()` slap igennem dens prosa-prøve som en
     manglende oversættelse. Den havde ret i, at den ikke kunne vide bedre —
     en adresse er ikke noget, nogen skal kunne rette i bagrummet. */
  const geo = 'geo:' + lat + ',' + lon + '?q=' + lat + ',' + lon + '(' + mærke + ')';
  /* Adressen over tallene (KN 5/10: "Jeg vil gerne have adressen tilføjet
     her også"). En egen destination har den adresse, hun valgte; vores egne
     steder har den, I har skrevet i editoren eller bagrummet (0047). */
  const testet = dest.testetId && TESTEDE.find(x => x.id === dest.testetId);
  const adr = (testet && testet.adresse) || dest.adresse || '';

  return `<div class="kør-derhen">
    <div class="kd-top">
      <div class="kd-titel">${t('turplan.koorddtitel','Sådan finder I derhen')}</div>
      <a class="knap kontur lille udad" href="${esc(geo)}">${ik('gps')} ${t('turplan.aabnikort','Åbn i kort')}</a>
    </div>
    ${adr ? `<div class="kd-adresse">${ik('nål')}<span>${esc(adr)}</span></div>` : ''}
    <div class="kd-tal" aria-label="${esc(t('turplan.koordaria','Koordinater'))}">${lat}, ${lon}</div>
    <div class="kd-note">${t('turplan.koordnote','Læs tallene op, hvis I får brug for hjælp. En alarmcentral kan finde jer på dem — også hvor et stednavn ikke siger nogen noget.')}</div>
  </div>`;
}
/* "Stedet er optaget eller ikke helt jer" — de nærmeste andre testede steder
   som en udvej. Lå før på selve destinationssiden, men dér havde man jo netop
   valgt stedet; her, på turplanen, er det først relevant (OD 30/8).
   Vises kun når man HAR valgt et af vores testede steder — ellers er der
   ingen at måle "i nærheden" fra.

   `retur` er den skærm, tilbage-pilen skal føre til (KN 7/9). Blokken står nu
   både på turplanen og under afgangskortet på Hjem, og et sted, man åbner
   herfra, skal sende én tilbage dertil, man kom fra. */
function planBSteder(retur){
  const f = s.forberedelse;
  const sted = f && f.destination && f.destination.testetId
    ? TESTEDE.find(x=>x.id===f.destination.testetId) : null;
  if(!sted) return '';
  const nær = stederINærheden(sted);
  if(!nær.length) return '';
  /* I sin egen farvede boks (KN 5/10: "så man kan se, dette er noget andet,
     og der er hjælp at hente"). */
  return `<div class="planb-boks">
    <h3>${ik('nål')} ${t('destination.planbspm','Stedet er optaget eller ikke helt jer?')}</h3>
    <p>${t('destination.planbunder','De nærmeste andre testede steder — som en plan B.')}</p>
    ${nær.map(n=>`
      <button class="res-kort" onclick="åbnTestet('${n.t.id}','${retur||'turplan'}')">
        <span class="res-ikon">${ik('stjerne')}</span>
        <span class="res-krop">
          <span class="res-navn">${esc(n.t.navn)}</span>
          <span class="res-meta">${t('destination.kmherfra','Ca. {km} km herfra',{km:Math.round(n.km)})}</span>
          <span class="res-mærke ${n.t.klar?'ægte':''}">${n.t.klar?t('forslag.testet','★ Testet af Arytmi'):t('destination.maaske','Måske — vi tester igen')}</span>
        </span>
        <span class="tjek-pil">${ik('pil')}</span>
      </button>`).join('')}
  </div>`;
}

/* =============================================================
   INVITATION — tre veje: planlæg sammen · giv som gave · for mig selv
   Alt det tværgående (gæstelogin, datoforhandling, den flotte
   invitation) er simuleret i prototypen og markeret som sådan.
   ============================================================= */
/* Navn/e-mail-felterne bruger kun gem() (ikke tegn()), så man ikke mister
   fokus midt i indtastningen. Det betyder "Se invitation"-knappen ikke
   automatisk opdaterer sin disabled-status — den sætter vi derfor direkte. */
function opdaterInvKnap(knapId){
  const f = s.forberedelse; if(!f) return;
  const knap = $(knapId); if(!knap) return;
  knap.disabled = !(f.invModtager && f.invEmail);
}
function invErKlar(f){
  if(f.invType==='selv')   return true;
  // sendt tæller som klaret: brugeren har gjort sit — svaret er rejsemakkerens
  if(f.invType==='sammen') return f.invStatus==='bekræftet' || f.invStatus==='sendt';
  if(f.invType==='gave')   return f.invStatus==='sendt' && f.gaveSvar!=='afslået';
  return false;
}
function invUnderTekst(f){
  if(!f.invType)         return 'Inviter til arytmen';
  if(f.invType==='selv') return 'Kun for dig selv';
  if(f.invType==='gave') return f.invStatus!=='sendt' ? 'Overraskelse — i det skjulte'
    : f.gaveSvar==='bekræftet' ? 'Bekræftet af '+(f.invModtager||'modtageren')
    : f.gaveSvar==='afslået'   ? 'Afvist — aftal en ny dato'
    : 'Overraskelse sendt — afventer svar';
  const navn = f.invModtager || 'din rejsemakker';
  if(f.invStatus==='bekræftet') return 'Bekræftet med '+navn;
  if(f.invStatus==='afslået')   return 'Afslået — inviter en anden';
  if(f.invStatus==='forhandler')return f.invForslagFra==='gæst' ? navn+' foreslog nye datoer' : 'Afventer '+navn;
  if(f.invStatus==='sendt')     return 'Afventer bekræftelse fra '+navn;
  return 'Planlægger sammen';
}
function forslagsDatoer(basisISO){
  const b = new Date((basisISO || new Date().toISOString().slice(0,10)) + 'T12:00:00');
  return [4,9,15].map(dg=>{ const d=new Date(b); d.setDate(d.getDate()+dg); return d.toISOString().slice(0,10); });
}
function gæsteKode(f){
  let h=0; const str = f.invModtager || 'gæst';
  for(let i=0;i<str.length;i++) h=(h*31 + str.charCodeAt(i))>>>0;
  return 'GÆST-'+(1000 + h%9000);
}

/* ---------- mail-skabelonerne ----------
   Teksterne er Kennets egne, ord for ord. De fyldes med turens data og
   lægges i et redigerbart felt: brugeren retter selv til og trykker send. */
function afsenderNavn(){ return (s.profil && s.profil.navn) || 'En ven'; }
function turDatoTekst(f){ return f.dato ? pænDato(f.dato) : '(dato ikke valgt endnu)'; }
function turStedTekst(f){ return f.destination ? f.destination.navn : '(destination ikke valgt endnu)'; }
/* Hjemkomst er en dato, ikke et klokkeslæt — udledt af trin 1's svar
   (samme dag / næste dag / anden dato). */
function turHjemkomstTekst(f){
  if(f.retur==='næste' && f.dato){
    const d = new Date(f.dato+'T12:00:00'); d.setDate(d.getDate()+1);
    return pænDato(d.toISOString().slice(0,10)) + returKl(f);
  }
  if(f.retur==='dato' && f.returDato) return pænDato(f.returDato) + returKl(f);
  if(f.dato) return pænDato(f.dato) + returKl(f);
  return '(dato ikke valgt endnu)';
}
function returKl(f){ return f.returtid ? ' · ca. kl. ' + f.returtid : ''; }

function mailSammen(f){
  const modt = f.invModtager || 'din rejsemakker';
  const afs  = afsenderNavn();
  return `Hej ${modt}

${afs} har inviteret dig til en arytme.

Dato: ${turDatoTekst(f)}
Hjemkomst: ${turHjemkomstTekst(f)}
Destination: ${turStedTekst(f)}

En arytme er en lille, bevidst forstyrrelse af hverdagens rytme.

Et døgn eller en aften, hvor bilen og naturen bliver jeres frirum. Hvor I kan trække stikket, komme ud i naturen og nyde tiden sammen – uden at det kræver ferie eller uger med planlægning.

${afs} har allerede taget det første skridt og vil gerne dele denne arytme med dig. Sammen gør I turen klar. Hvis du accepterer invitationen, hjælper Arytmi appen jer med at planlægge resten.

Appen hjælper jer med at fordele opgaverne og huske på alt det vigtigste, så I nemt kan få styr på:

• Mad og drikke
• Pakkelisten
• Klargøring af bilen

På den måde bruger I mindre tid på planlægning og mere tid på det, der betyder noget.

Vil du med?

[Bekræft invitation]

Hvis datoen ikke passer, kan du foreslå en ny, som ${afs} kan tage stilling til. Tryk her for at foreslå en ny dato i appen.

Når invitationen er bekræftet, sender vi dig en ny mail med gratis link til Arytmi-appen og dine personlige loginoplysninger, så I sammen kan gøre jeres arytme klar.

Vi glæder os til at sende jer afsted.

Team Arytmi

"Små forstyrrelser. Store øjeblikke."`;
}

function mailGave(f){
  const modt = f.invModtager || 'din rejsemakker';
  const afs  = afsenderNavn();
  const adr  = f.invAfhentning || '(afhentningsadresse)';
  const pak  = (f.invPakkeliste && f.invPakkeliste.length ? f.invPakkeliste : ['Nattøj','Toilettaske','Varmt tøj til aftenen']);
  return `Hej ${modt}

Nogen har planlagt noget særligt til dig.

${afs} har inviteret dig til en arytme.

Dato: ${turDatoTekst(f)}
Hjemkomst: ${turHjemkomstTekst(f)}

En arytme er en lille, bevidst forstyrrelse af hverdagens rytme.

Et lille afbræk, hvor der er plads til ro, nærvær og tid sammen. Ikke fordi hverdagen skal laves om, men fordi den fortjener små øjeblikke, der bryder rytmen og giver nye minder.

Den her arytme er allerede planlagt specielt til dig.

Du skal ikke tænke på destinationen, planlægningen eller alt det praktiske. Det har ${afs} allerede taget sig af.

Det eneste, du skal gøre, er at være klar her: ${adr} og tage disse få ting med:

DIN PAKKELISTE

• ${pak[0]||''}
• ${pak[1]||''}
• ${pak[2]||''}

Resten venter på dig.

ER DU KLAR?

[Jeg glæder mig – bekræft invitationen]

Vi håber, at denne arytme bliver begyndelsen på mange flere.

De bedste hilsner

Team Arytmi

"Livet har godt af en lille arytme."

Tryk her hvis du ikke kan deltage i arytmen`;
}

/* Mail-kladden gemmes, så brugerens rettelser ikke forsvinder ved gentegning.
   Nulstilles kun, når man selv beder om det. */
function mailKladde(f){
  if(f.invMailTekst == null) f.invMailTekst = (f.invType==='gave' ? mailGave(f) : mailSammen(f));
  return f.invMailTekst;
}
function nulstilMail(){
  const f = s.forberedelse;
  f.invMailTekst = (f.invType==='gave' ? mailGave(f) : mailSammen(f));
  gem(); tegn();
  flash('Teksten er sat tilbage til Arytmis egen.', 'mail');
}
function mailFelt(sendLabel, sendAktion){
  const f = s.forberedelse;
  return `
    <div class="kort">
      <div class="etiket">${t('invitation.mailtop','Sådan ser mailen ud')}</div>
      <p class="dæmpet" style="font-size:13px;margin:6px 0 10px">${t('invitation.mailret','Ret frit i teksten, før du sender.')}</p>
      <textarea class="mail-felt" oninput="s.forberedelse.invMailTekst=this.value;gem()">${esc(mailKladde(f))}</textarea>
      <button class="knap primær bred" style="margin-top:14px" onclick="${sendAktion}">${sendLabel} ${ik('mail')}</button>
      <div style="display:flex;gap:10px;margin-top:10px">
        <button class="knap kontur lille" style="flex:1" onclick="gemUnderTrin();s.forberedelse.invVisMail=false;gem();tegn()">${t('invitation.retoplysninger','Ret oplysninger')}</button>
        <button class="knap kontur lille" style="flex:1" onclick="nulstilMail()">${t('invitation.nulstiltekst','Nulstil teksten')}</button>
      </div>
    </div>`;
}

/* Invitationen er ikke længere et trin i rækken, så den kan ikke låne
   sektionHeader/sektionFod — de slår op i SEKTIONER og ville falde over et id,
   der ikke findes. Den har fået sin egen top og bund: almindelig tilbage-pil
   op i hjørnet og én vej hjem i bunden. */
function skærmInvitation(){
  const f = s.forberedelse; if(!f){ gåTil('hjem'); return; }
  let krop;
  if(!f.invType)              krop = invVælgKrop();
  else if(f.invType==='selv') krop = invSelvKrop();
  else if(f.invType==='sammen')krop = invSammenKrop();
  else                        krop = invGaveKrop();
  $('indhold').innerHTML = `<div class="side anim">
    ${skærmTop(t('invitation.titel','Inviter til denne arytme'),'hjem',t('invitation.etiket','Hvem skal med?'))}
    ${krop}
    <div style="margin-top:18px;text-align:center">
      <button class="knap kontur lille" onclick="tilbageTil('hjem')">${ik('tilbage')} ${t('invitation.tiloverblik','Tilbage til overblikket')}</button>
    </div>
  </div>`;
}
function invVælgKrop(){
  const valg = [
    { type:'sammen', ikon:'folk',   navn:t('invitation.valgsammen','Planlæg sammen'),   tekst:t('invitation.valgsammenunder','I planlægger arytmen sammen — begge er med fra hver jeres telefon.') },
    { type:'gave',   ikon:'gave',   navn:t('invitation.valggave','Giv som gave'),     tekst:t('invitation.valggaveunder','Planlæg alt i det skjulte og send en færdig overraskelse, når du er klar.') },
    { type:'selv',   ikon:'puls', navn:t('invitation.valgselv','Denne arytme er for mig'), tekst:t('invitation.valgselvunder','Du tager afsted alene.') }
  ];
  return `
    <div class="kort guide-brød"><p>${t('invitation.vaelghvordan','Vælg, hvordan I skal afsted.')}</p></div>
    ${valg.map(v=>`
      <button class="res-kort" onclick="vælgInvType('${v.type}')">
        <span class="res-ikon">${ik(v.ikon)}</span>
        <span class="res-krop"><span class="res-navn">${v.navn}</span><span class="res-meta">${v.tekst}</span></span>
        <span class="tjek-pil">${ik('pil')}</span>
      </button>`).join('')}`;
}
function vælgInvType(type){
  const f = s.forberedelse;
  gemUnderTrin();
  f.invType = type;
  if(type==='selv')      f.invStatus = 'alene';
  else if(type==='gave') f.invStatus = (f.invStatus==='sendt') ? 'sendt' : 'planlægger';
  else                   f.invStatus = (f.invStatus==='bekræftet') ? 'bekræftet' : 'kladde';
  gem(); tegn();
}
function invSkift(){
  const f = s.forberedelse;
  gemUnderTrin();
  f.invType=null; f.invStatus=null; f.invForslag=[]; f.invForslagFra=null; f.invEnigDato=null;
  gem(); tegn();
}
function invSelvKrop(){
  return `
    <div class="advarsel" style="background:#e2ead2;border-color:#c3d3a8;color:#4d5c3a">${ik('tjek')} ${t('invitation.selvbrod','Denne arytme er for dig selv. Nyd den — resten af planen er klar til dig alene.')}</div>
    <div style="text-align:center;margin-top:16px"><button class="knap kontur lille" onclick="invSkift()">${ik('folk')} ${t('invitation.andenmaade','Vælg en anden måde')}</button></div>`;
}

/* ---------- Planlæg sammen ---------- */
function gæstePreview(f){
  return `
  <div class="ob-mail">
    <div class="m-top">${ik('mail')} ${t('gave.til','Til: {mail}',{mail:f.invEmail||f.invModtager||t('invitation.standardnavn','din rejsemakker')})}</div>
    <div class="m-krop">
      <pre class="mail-vis">${esc(mailKladde(f))}</pre>
      <p class="dæmpet" style="font-size:13px;margin-top:14px">${t('invitation.vedbekraeftelse','Ved bekræftelse får {navn} en mail med login:',{navn:f.invModtager||t('invitation.rejsemakkeren','rejsemakkeren')})}</p>
      <div class="ob-kode">${gæsteKode(f)}</div>
      <p class="dæmpet" style="font-size:12px;text-align:center">${t('invitation.prototypenote','Prototype — gæstelogin er simuleret.')}</p>
    </div>
  </div>`;
}
function invSammenKrop(){
  const f = s.forberedelse;
  const status = f.invStatus || 'kladde';
  const raaNavn = f.invModtager || t('invitation.standardnavn','din rejsemakker');
  const navn = esc(raaNavn);
  if(status==='kladde'){
    return `
      <div class="kort guide-brød"><p>${t('invitation.sammenbrod','I planlægger arytmen sammen. Send en invitation, bliv enige om datoen — så bliver resten af planen fælles.')}</p></div>
      ${f.invVisMail ? mailFelt(t('invitation.sendknap','Send invitation'),'invSend()') : `
      <div class="kort">
        <label class="felt-etiket" style="margin-top:0">${t('invitation.navn','Rejsemakkerens navn')}</label>
        <input type="text" placeholder="${esc(t('invitation.navnplads','Fx Anne'))}" value="${esc(f.invModtager||'')}" oninput="s.forberedelse.invModtager=this.value;s.forberedelse.invMailTekst=null;gem();opdaterInvKnap('invSeKnap')">
        <label class="felt-etiket">${t('invitation.mail','Rejsemakkerens e-mail')}</label>
        <input type="email" placeholder="${esc(t('invitation.mailplads','anne@mail.dk'))}" value="${esc(f.invEmail||'')}" oninput="s.forberedelse.invEmail=this.value;gem();opdaterInvKnap('invSeKnap')">
        <label class="felt-etiket">${t('invitation.foreslaaetdato','Foreslået dato')}</label>
        <div class="sted-chips"><span class="sted-chip valgt">${ik('kort')} ${f.dato?pænDato(f.dato):t('invitation.ingendato','Ingen dato valgt endnu')}</span></div>
        <button class="knap primær bred" id="invSeKnap" style="margin-top:16px" ${f.invModtager&&f.invEmail?'':'disabled'} onclick="gemUnderTrin();s.forberedelse.invVisMail=true;gem();tegn()">${t('invitation.seinvitation','Se invitation')} ${ik('pil')}</button>
      </div>`}
      <div style="text-align:center;margin-top:14px"><button class="knap kontur lille" onclick="invSkift()">${ik('folk')} ${t('invitation.andenmaade','Vælg en anden måde')}</button></div>`;
  }
  if(status==='bekræftet'){
    return `
      <div class="mørk-kort"><div class="glød"></div>
        <div class="etiket" style="color:rgba(246,243,234,.6)">${t('invitation.enige','I er enige')}</div>
        <h3 style="margin-top:4px">${t('invitation.oprettet','Turen er oprettet')}</h3>
        <p style="margin-top:6px">${t('invitation.enigetekst','Du og {navn} er enige om <b>{dato}</b>. Nu er resten af planen fælles — I fylder tjeklisten ud sammen.',{navn:raaNavn,dato:pænDato(f.invEnigDato||f.dato)})}</p>
      </div>`;
  }
  if(status==='afslået'){
    return `
      <div class="advarsel">${t('invitation.afslaaet','{navn} kan desværre ikke denne gang. Det er helt okay — måske en anden gang.',{navn:raaNavn})}</div>
      <div class="kort">
        <button class="knap primær bred" onclick="invNulstilSammen()">${ik('mail')} ${t('invitation.inviteranden','Inviter en anden')}</button>
        <button class="knap kontur bred" style="margin-top:10px" onclick="vælgInvType('selv')">${t('invitation.selv','Tag afsted selv')}</button>
      </div>`;
  }
  if(status==='forhandler' && f.invForslagFra==='gæst'){
    return `
      <div class="kort guide-brød"><p>${t('invitation.kanikkeforeslaar','<b>{navn}</b> kan ikke den {dato} og foreslår i stedet:',{navn:raaNavn,dato:f.dato?pænDato(f.dato):t('invitation.foreslaaededato','foreslåede dato')})}</p></div>
      <div class="kort">
        <div class="etiket">${t('invitation.vaelgenaf','Vælg en af {navn}s datoer',{navn:raaNavn})}</div>
        ${f.invForslag.map(d=>`<button class="forslag-knap" style="margin-top:10px" onclick="brugerBekræftDato('${d}')"><span class="f-ikon">${ik('kort')}</span><span style="flex:1"><b>${pænDato(d)}</b></span><span class="pil">${ik('tjek')}</span></button>`).join('')}
        <button class="knap kontur bred" style="margin-top:14px" onclick="brugerForeslåNye()">${ik('kort')} ${t('invitation.ingenpasser','Ingen passer — foreslå 3 nye')}</button>
      </div>`;
  }
  if(status==='forhandler'){ // bruger har lige foreslået — afventer gæst
    return `
      <div class="advarsel">${t('invitation.duforeslog','Du foreslog 3 nye datoer. Nu venter I på {navn}.',{navn:raaNavn})}</div>
      <div class="kort">
        <div class="etiket">${t('invitation.dineforslag','Dine forslag')}</div>
        ${f.invForslag.map(d=>`<div class="vært-række">${ik('kort')}<div class="v-tekst">${pænDato(d)}</div></div>`).join('')}
      </div>
      <div class="kort">
        <div class="etiket">${t('invitation.demogaest','Prøv gæstens svar (demo)')}</div>
        <p class="dæmpet" style="font-size:13px;margin:6px 0 12px">${t('invitation.hvordansvarer','Hvordan svarer {navn}?',{navn:raaNavn})}</p>
        ${f.invForslag.map(d=>`<button class="knap primær bred" style="margin-top:8px" onclick="brugerBekræftDato('${d}')">${ik('tjek')} ${t('invitation.bekraefterdato','{navn} bekræfter {dato}',{navn:raaNavn,dato:pænDato(d)})}</button>`).join('')}
        <button class="knap kontur bred" style="margin-top:10px" onclick="gæstAfslå()">${ik('kryds')} ${t('invitation.afslaaarytmen','Afslå arytmen')}</button>
      </div>`;
  }
  // status === 'sendt'
  return `
    <div class="advarsel">${t('invitation.sendttil','Invitation sendt til {navn}. Nu venter I på svar.',{navn:raaNavn})}</div>
    ${gæstePreview(f)}
    <div class="kort">
      <div class="etiket">${t('invitation.demogaest','Prøv gæstens svar (demo)')}</div>
      <p class="dæmpet" style="font-size:13px;margin:6px 0 12px">${t('invitation.saadansvarer','Sådan svarer {navn} fra sin egen telefon:',{navn:raaNavn})}</p>
      <button class="knap primær bred" onclick="gæstBekræft()">${ik('tjek')} ${t('invitation.bekraeft','Bekræft {dato}',{dato:f.dato?pænDato(f.dato):t('invitation.datoen','datoen')})}</button>
      <button class="knap blød bred" style="margin-top:10px" onclick="gæstForeslå()">${ik('kort')} ${t('invitation.foreslaaandre','Foreslå 3 andre datoer')}</button>
      <button class="knap kontur bred" style="margin-top:10px" onclick="gæstAfslå()">${ik('kryds')} ${t('invitation.afslaaarytmen','Afslå arytmen')}</button>
    </div>`;
}
function invSend(){
  const f = s.forberedelse; if(!f.invModtager){ flash(t('invitation.manglermodtager','Skriv hvem invitationen er til.')); return; }
  f.invStatus='sendt'; f.invVisMail=false; gem();
  // Når mailen er afsted, hører brugeren hjemme på overblikket over resten
  tilbageTil('hjem');
  infoModal(t('invitation.sendtmodal','Invitation sendt til <b>{navn}</b>. Du får besked, når {navn} bekræfter datoen — så kan I sammen planlægge resten af arytmen.',{navn:f.invModtager}));
}
function gæstBekræft(){
  const f = s.forberedelse; f.invEnigDato=f.dato; f.invStatus='bekræftet'; gem(); tegn();
  flash('I er enige om datoen. Turen er oprettet.', 'puls');
}
function gæstForeslå(){
  const f = s.forberedelse; f.invForslag=forslagsDatoer(f.dato); f.invForslagFra='gæst'; f.invStatus='forhandler'; gem(); tegn();
}
function gæstAfslå(){
  const f = s.forberedelse; f.invStatus='afslået'; gem(); tegn();
}
function brugerBekræftDato(iso){
  const f = s.forberedelse; f.dato=iso; f.invEnigDato=iso; f.invStatus='bekræftet'; gem(); tegn();
  flash('I er enige om '+pænDato(iso)+'. Turen er oprettet.', 'puls');
}
function brugerForeslåNye(){
  const f = s.forberedelse; f.invForslag=forslagsDatoer(f.invForslag[0]||f.dato); f.invForslagFra='bruger'; f.invStatus='forhandler'; gem(); tegn();
}
function invNulstilSammen(){
  const f = s.forberedelse;
  f.invStatus='kladde'; f.invModtager=''; f.invForslag=[]; f.invForslagFra=null; f.invEnigDato=null;
  gem(); tegn();
}

/* ---------- Giv som gave ---------- */
function invGaveKrop(){
  const f = s.forberedelse;
  if(f.invStatus==='sendt'){
    const raaNavn = f.invModtager || t('gave.standardnavn','Din rejsemakker');
    const navn = esc(raaNavn);
    const svar = f.gaveSvar;
    return `
      <div class="mørk-kort"><div class="glød"></div>
        <div class="etiket" style="color:rgba(246,243,234,.6)">${t('gave.sendt','Overraskelsen er sendt')}</div>
        <h3 style="margin-top:4px">${t('gave.inviteret','{navn} er inviteret',{navn:raaNavn})}</h3>
        <p style="margin-top:6px">${svar==='bekræftet' ? t('gave.bekraeftet','{navn} har bekræftet. Nu kan I bare glæde jer.',{navn:raaNavn})
          : svar==='afslået' ? t('gave.kanikke','{navn} kan ikke den dag.',{navn:raaNavn})
          : t('gave.paavej','Invitationen er på vej. Du får en besked, så snart {navn} svarer.',{navn:raaNavn})}</p>
      </div>
      ${svar==='afslået' ? `
      <div class="advarsel" style="margin-top:14px">${ik('klokke')} ${t('gave.kanikkelang','{navn} kan ikke den dag. Aftal en ny dato direkte med hinanden — en overraskelse kan appen ikke forhandle for jer. Tidspunktet kan du rette her i appen bagefter.',{navn:raaNavn})}</div>
      <div class="kort">
        <button class="knap primær bred" onclick="gåTil('turdato')">${ik('kort')} ${t('gave.retdato','Ret dato og tid')}</button>
      </div>` : ''}
      <div class="ob-mail">
        <div class="m-top">${ik('mail')} ${t('gave.til','Til: {mail}',{mail:f.invEmail||f.invModtager||t('invitation.standardnavn','din rejsemakker')})}</div>
        <div class="m-krop"><pre class="mail-vis">${esc(mailKladde(f))}</pre></div>
      </div>
      ${!svar ? `
      <div class="kort">
        <div class="etiket">${t('gave.demo','Prøv modtagerens svar (demo)')}</div>
        <p class="dæmpet" style="font-size:13px;margin:6px 0 12px">${t('gave.saadansvarer','Sådan svarer {navn} på overraskelsen:',{navn:raaNavn})}</p>
        <button class="knap primær bred" onclick="gaveSvar('bekræftet')">${ik('tjek')} ${t('gave.glaedermig','Jeg glæder mig — bekræft')}</button>
        <button class="knap kontur bred" style="margin-top:10px" onclick="gaveSvar('afslået')">${ik('kryds')} ${t('gave.kanikkedeltage','Kan ikke deltage')}</button>
      </div>` : ''}`;
  }
  const mad = forplejningKlar(), bil = bilenKlar(f), pakke = (f.pakkeTjek||[]).length>=pakkePunkter().length;
  const rk = (ok,navn,under,mål)=>`<button class="tjek-punkt ${ok?'klar':''}" onclick="gåTil('${mål}')"><span class="tjek-boks">${ik('tjek')}</span><span class="tjek-krop"><span class="tjek-navn">${navn}</span><span class="tjek-under">${under}</span></span><span class="tjek-pil">${ik('pil')}</span></button>`;
  return `
    <div class="kort guide-brød"><p>${t('gave.brod','<b>Planlæg turen som en overraskelse.</b> {navn} ser ingenting endnu. Gør detaljerne klar, og send så den færdige invitation.',{navn:f.invModtager||t('gave.standardnavn','Din rejsemakker')})}</p></div>
    ${f.invVisMail ? mailFelt(t('gave.sendknap','Send overraskelsen'),'gaveSend()') : `
    <div class="kort">
      <label class="felt-etiket" style="margin-top:0">${t('gave.navn','Modtagerens navn')}</label>
      <input type="text" placeholder="${esc(t('gave.navnplads','Fx Anne'))}" value="${esc(f.invModtager||'')}" oninput="s.forberedelse.invModtager=this.value;s.forberedelse.invMailTekst=null;gem();opdaterInvKnap('invGaveKnap')">
      <label class="felt-etiket">${t('gave.mail','Modtagerens e-mail')}</label>
      <input type="email" placeholder="${esc(t('gave.mailplads','anne@mail.dk'))}" value="${esc(f.invEmail||'')}" oninput="s.forberedelse.invEmail=this.value;gem();opdaterInvKnap('invGaveKnap')">
      <label class="felt-etiket">${t('gave.moedes','Hvor skal I mødes?')} <span class="dæmpet" style="font-weight:400">${t('gave.imailen','(står i mailen)')}</span></label>
      <input type="text" placeholder="${esc(t('gave.moedesplads','Fx hjemme kl. 15'))}" value="${esc(f.invAfhentning||'')}" oninput="s.forberedelse.invAfhentning=this.value;s.forberedelse.invMailTekst=null;gem()">
    </div>
    <div class="sektion"><h3>${t('gave.goerklar','Gør klar i det skjulte')}</h3></div>
    ${rk(mad,'Mad & drikke','Forplejning til turen','mad')}
    ${rk(bil,'Bilen','Strøm, sengetøj og udstyr','bilen')}
    ${rk(pakke,'Pakkeliste','De personlige ting','pakke')}
    <button class="knap primær bred ånde" id="invGaveKnap" style="margin-top:18px" ${f.invModtager&&f.invEmail?'':'disabled'} onclick="gemUnderTrin();s.forberedelse.invVisMail=true;gem();tegn()">${ik('gave')} Se overraskelsen ${ik('pil')}</button>`}
    <div style="text-align:center;margin-top:14px"><button class="knap kontur lille" onclick="invSkift()">${ik('folk')} ${t('invitation.andenmaade','Vælg en anden måde')}</button></div>`;
}
function gaveSend(){
  const f = s.forberedelse; if(!f.invModtager){ flash('Skriv hvem overraskelsen er til.'); return; }
  f.invStatus='sendt'; f.invVisMail=false; f.gaveSvar=null;
  // Overraskelsen er sendt, og dermed er planlægningen slut — forsiden skifter
  // til de tre punkter om at komme afsted (OD 11/8).
  f.planlagt = true; gem();
  nulstilHistorik(); gåTil('hjem');
  infoModal('Gaven er nu sendt, og du har planlagt jeres tur.', 'Til overblikket');
}
/* Svaret på gaven kommer som en besked i appen. Afvises den, skal brugeren
   selv aftale en ny dato — appen kan ikke forhandle på en overraskelse. */
function gaveSvar(svar){
  const f = s.forberedelse; f.gaveSvar = svar; gem(); tegn();
  if(svar==='bekræftet') flash((f.invModtager||'Din rejsemakker')+' glæder sig. I er afsted.', 'puls');
  else flash((f.invModtager||'Din rejsemakker')+' kan ikke den dag — aftal en ny dato direkte med hinanden.', 'klokke');
}

/* =============================================================
   FORBERED TUR — hver sektion er sin egen side, i rækkefølge
   ============================================================= */
/* To faser: 1) planlæg i god tid  2) gør klar på afgangsdagen */
const SEKTIONER = [
  { id:'destination', fase:1, navn:'Destination',      under:'Hvor tager I hen?',        ikon:'nål',    farve:'#eadfcd', ifarve:'#8a5f3e',
    spørg:'Hvor skal turen gå hen?',      forklar:'Sæt en pin på kortet, søg en by — eller vælg et af vores testede steder.' },
  /* Invitation er IKKE længere et trin (OD 13/8). Trinnet "Hvem vil du dele
     denne arytme med?" spærrede vejen: man skulle tage stilling til
     rejsemakkeren, før man måtte planlægge noget som helst. Nu går man fra
     destinationen direkte til overblikket, og invitationen ligger som en rund
     knap i bunden dér. Skærmen findes uændret — den er bare ikke i rækken.
     Låsen består: vælger man aktivt "Planlæg sammen", er forplejning, bil og
     personligt stadig låst indtil rejsemakkeren har bekræftet. Vælger man
     ingenting, låser ingenting — invType er null, og afventerFællesPlan()
     er kun sand for 'sammen'. */
  { id:'mad',         fase:2, navn:'Forplejning',      under:'Tips fra vores egne ture', ikon:'kop',    farve:'#ece8dd', ifarve:'#6b705c',
    spørg:'Uden mad og drikke duer helten ikke', forklar:'Vores egne tips til aftensmad, morgenkaffe og det søde undervejs.' },
  { id:'bilen',       fase:2, navn:'Bil',              under:'Strøm, sengetøj og udstyr', ikon:'bil',   farve:'#e6e6d9', ifarve:'#5f6353',
    spørg:'Er bilen klar?',               forklar:'Strøm, varme, sengetøj og det udstyr I vil have med.' },
  { id:'pakke',       fase:2, navn:'Personligt',       under:'Personlige ting',          ikon:'telt',   farve:'#e8e2d4', ifarve:'#7a6a4f',
    spørg:'Hvad skal I selv have med?',   forklar:'De personlige ting — nattøj, toilettaske og tøj efter destinationen.' }
];
const FASER = {
  1:{ navn:'Find stedet', etiket:'Trin 1 · Destination', intro:'Først stedet. Resten planlægger I bagefter, i det tempo I har lyst til.' },
  2:{ navn:'Planlæg jeres tur', etiket:'Planlæg jeres tur', intro:'Forplejning, bil og det personlige. Når de tre er på plads, samler appen selv pakkelisten.' }
};

/* =============================================================
   LISTERNE SOM TEKSTNØGLER (KN 5/10) — se tekstdata.js
   =============================================================
   Hver tekst i listerne ovenfor får en nøgle, og bag hver tekst ligger
   en getter, der kalder t(). Så kommer en rettet tekst — udgivet eller
   en kladde i editoren — frem, hver gang listen tegnes, og "Ret tekst"
   kan finde den, fordi t() husker, hvad skærmen viste.

   KODEN ER STADIG KILDEN. Listerne står uændret ovenfor; der tages en
   kopi ved opstart (TEKSTLISTE_KODE), og hver gang teksterne skifter,
   bygges listerne forfra ud fra kopien: de faste punkter, minus dem der
   er skjult, plus dem der er tilføjet. Listerne er `const` og bruges
   overalt, så de bygges om PÅ STEDET — ingen ny reference at gå glip af. */
function listeTekst(nøgle){
  if(RED_TEKSTER && RED_TEKSTER[nøgle]){
    const r = RED_TEKSTER[nøgle].tekst;
    return (typeof r === 'string' && r !== '') ? r : null;
  }
  const u = TEKSTER[nøgle];
  return (typeof u === 'string' && u !== '') ? u : null;
}
/* Alle nøgler, der begynder med `sti.ny_` og ender på `.felt` — de
   tilføjede punkter i den liste, i nøglernes orden. */
function tilføjedePunkter(sti, felt){
  const fund = new Set();
  const før = sti + '.ny_', efter = '.' + felt;
  const se = n => { if(n.startsWith(før) && n.endsWith(efter) && listeTekst(n)) fund.add(n.slice(sti.length + 1, n.length - efter.length)); };
  Object.keys(TEKSTER).forEach(se);
  if(RED_TEKSTER) Object.keys(RED_TEKSTER).forEach(se);
  return [...fund].sort();
}
/* Stierne til de lister, man kan tilføje punkter til — så editorens ark
   kan se, om en nøgle hører til et listepunkt. Fyldes af anvendListeTekster. */
let LISTE_STIER = [];
function anvendListeTekster(){
  if(!TEKSTLISTER || !window.ArytmiTekstdata) return;
  const TD = ArytmiTekstdata;
  LISTE_STIER = [];
  for(const [navn, præfiks] of TD.LISTER){
    const live = TEKSTLISTER[navn];
    const kode = JSON.parse(JSON.stringify(TEKSTLISTE_KODE[navn]));
    /* 1 · Forfra fra kopien — på stedet. */
    if(Array.isArray(live)){ live.length = 0; live.push(...kode); }
    else { Object.keys(live).forEach(k => delete live[k]); Object.assign(live, kode); }
    /* 2 · Skjulte faste punkter ud, tilføjede ind. */
    TD.gennemgå(live, præfiks, null, (sti, liste, felt) => {
      LISTE_STIER.push({ sti, felt });
      for(let i = liste.length - 1; i >= 0; i--){
        if(listeTekst(sti + '.' + TD.led(liste[i].id) + '.skjult') === 'ja') liste.splice(i, 1);
      }
      for(const id of tilføjedePunkter(sti, felt)){
        const p = { id: sti.replace(/\./g, '-') + '-' + id, tilføjet: true };
        p[felt] = '';
        if(felt === 'navn'){ p.ikon = 'bil'; p.huske = true; }   // bilens punkter
        if(listeTekst(sti + '.' + id + '.tip')) p.tip = '';
        p.nøgleId = id;
        liste.push(p);
      }
    });
    /* 3 · t() bag hver tekst. Et tilføjet punkt har ingen faldbak i koden —
       dets egen tekst er faldbakken. */
    TD.gennemgå(live, præfiks, (nøgle, faldbak, holder, felt) => {
      if(holder.tilføjet) return;   // dens nøgle sættes herunder, ud fra nøgleId
      Object.defineProperty(holder, felt, { get(){ return t(nøgle, faldbak); }, enumerable: true, configurable: true });
    }, (sti, liste, felt) => {
      liste.forEach(p => {
        if(!p.tilføjet) return;
        for(const f of [felt, 'tip']){
          if(!(f in p)) continue;
          const nøgle = sti + '.' + p.nøgleId + '.' + f;
          Object.defineProperty(p, f, { get(){ return t(nøgle, listeTekst(nøgle) || ''); }, enumerable: true, configurable: true });
        }
      });
    });
  }
}
TEKSTLISTER = { BIL_TYPER, BILEN_GRUPPER, HUND_PUNKTER, PAKKE_PUNKTER, MAD_VALG, MAD_SCENARIE_DETALJER,
  SNACK_VALG, MORGEN_VALG, SEKTIONER, FASER, TUR_FASER, VEN_EJERE, RADIUS_TEKST };
TEKSTLISTE_KODE = JSON.parse(JSON.stringify(TEKSTLISTER));
anvendListeTekster();
/* Overskriften over de tre punkter på overblikket (OD 13/8). Ligger her frem
   for inde i skærmen, så den kan ændres ét sted. */
const PLANLÆG_OVERSKRIFT = 'Planlæg jeres tur her — uden besvær';
function tilFase(n){
  if(!s.forberedelse) return;
  const heltFærdig = n===2 && fremdrift(1).mangler===0;
  s.forberedelse.fase = n;
  gem();
  if(heltFærdig) flash('Planen er klar. Godt gået — nu gør vi klar til afgang.', 'tjek');
  nulstilHistorik(); gåTil(sektionListe(n)[0].id);
}
/* Hvad der skal gemmes af en tur, så den kan gentages senere (OD 30/8).
   Kun de valg, der beskriver turen — ikke afkrydsninger (klarTjek/pakkeTjek):
   en gentaget tur skal pakkes forfra. Invitationen tages heller ikke med;
   den hører til den enkelte gang. */
function turSnapshot(f){
  if(!f) return null;
  return {
    destination: f.destination || null,
    retur: f.retur, returDato: f.returDato || null,
    startNavn: f.startNavn || '', startXY: f.startXY || null,
    radius: f.radius, oplevelser: f.oplevelser || null,
    madValg: [...(f.madValg||[])], snackValg: [...(f.snackValg||[])],
    morgenValg: [...(f.morgenValg||[])], brugValg: [...(f.brugValg||[])],
    brugSet: [...(f.brugSet||[])], morgenSet: !!f.morgenSet,
    bilType: f.bilType || null, bilHuske: [...(f.bilHuske||[])],
    hundMed: !!f.hundMed,
    /* Uden den her holdt hemmeligheden kun, til turen var overstået — og
       dukkede så op i rejsemakkerens log. Politikken på `afholdte_ture`
       læser netop dette felt i `plan`.
       `!== false` og ikke `!!`: samme grund som i turDeles() — mangler
       feltet, er turen ikke delt. */
    privat: f.privat !== false
  };
}
function annullerForberedelse(){
  if(fremmedRække('ture', s.aktivId)){
    const navn = partnerNavn().split(' ')[0];
    flash('Turen er ' + navn + 's. Den kan kun annulleres fra ' + navn + 's telefon.');
    return;
  }
  bekræft('Annullér turen? Både planen og afkrydsningerne nulstilles.', ()=>{
    sletTur(s.aktivId); nulstilHistorik(); gåTil('hjem');
  });
}

/* =============================================================
   1 · DESTINATION
   ============================================================= */
let søgTekst = '';
/* Ægte, interaktivt kort (Leaflet + OpenStreetMap). Genbruger den geografiske
   kalibrering fra xyTilGeo/geoTilXY, så resten af appen (solnedgang, vejr,
   nærmeste-testet-sted) stadig kan regne i det samme x/y-system som før. */
/* ---------- kortene (Leaflet/OSM) ----------
   To kort bruger de samme tre byggeklodser herunder:

     tegnForslagKort()  — de tre forslag, på forslagsskærmen
     (tegnRigtigtKort() — destinationsskærmens kort — er væk 28/9)

   ⚠️ STJERNERNE STÅR KUN PÅ FORSLAGSKORTET (KN 28/9). Før stod alle testede
   steder på destinationskortet, og det kunne nås fra overblikket — så var de
   tre forslag bare en forside for hele kataloget ("det er vigtigt så man
   ikke bare kan gå ind og stjæle alle destinationerne"). Nu ser man de tre,
   mens man vælger, og ikke flere. Er stedet valgt, er det låst: vil man
   skifte, går vejen gennem guiden igen (se destinationsVej()).
   Kataloget ligger stadig på telefonen; det her lukker kun vinduet i
   appen. Serversiden er forslag 6 i docs/indtjening-og-beskyttelse.md. */
function lkortBund(el, valg){
  const map = L.map(el, Object.assign({ attributionControl:true }, valg||{})).setView([56.1,10.5], 7);
  // "Leaflet" og flaget ud (KN 28/9). OpenStreetMap-kreditten bliver — se app.css.
  map.attributionControl.setPrefix(false);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:18, attribution:'© OpenStreetMap'
  }).addTo(map);
  return map;
}
/* Ét af vores steder. Ligger det uden for radius, er det dæmpet og siger det. */
function lkortTestet(map, sted, start, kmMax, fra){
  const geo = testetGeo(sted);
  const km = start ? Math.round(afstandKm(start, geo)) : null;
  const uden = km!=null && km > kmMax;
  const under = km==null ? '' : uden
    ? `<br><span class="lkort-tip-uden">${t('destination.markoerudenfor','ca. {km} km — længere væk, end I valgte',{km})}</span>`
    : `<br><span class="lkort-tip-km">${t('destination.markoerkm','ca. {km} km herfra',{km})}</span>`;
  const ikon = L.divIcon({
    className:'', iconSize:[28,28], iconAnchor:[14,14],
    html:`<div class="lkort-testet${uden?' udenfor':''}${sted.kladde?' kladde':''}">${ik(sted.kladde?'blyant':'stjerne')}</div>`
  });
  L.marker([geo.lat, geo.lon], { icon:ikon, title:sted.navn, opacity: uden?.55:1 }).addTo(map)
    .bindTooltip(esc(sted.navn)+under, { direction:'top', offset:[0,-14] })
    .on('click', e=>{ L.DomEvent.stopPropagation(e); åbnTestet(sted.id, fra); });
  return geo;
}

/* Forslagskortet (KN 28/9): de tre steder og jeres startpunkt, så man kan SE,
   at det ene ligger på Fyn og det andet på den anden side af Lillebælt — ikke
   kun læse "85 km" og "71 km". Et tryk på en stjerne åbner stedet, som et
   tryk på kortet over.

   Det kan trækkes og zoomes (KN 28/9: "interaktivt og ikke låst fast").
   Det var låst først, så siden kunne scrolles hen over det med én finger —
   nu scroller man forbi det uden for kortet. */
let forslagKortInstans = null;
/* Pinnen (KN 28/9: "skal man ikke også stadig kunne pinne sit eget sted på
   kortet?"). Et tryk på kortet sætter en nål med "Vælg dette sted" — først
   knappen gør den til destinationen. Kortet kan trækkes, og et tryk, der
   rammer ved et uheld, skal ikke kunne vælge et sted for en. */
let pinPunkt = null;
function vælgPin(){
  if(!pinPunkt) return;
  const xy = geoTilXY(pinPunkt.lat, pinPunkt.lon);
  sætDestination({ navn:t('forslag.pinnavn','Jeres eget sted'), egen:true,
    lat:pinPunkt.lat, lon:pinPunkt.lon, x:Math.round(xy.x), y:Math.round(xy.y) });
  pinPunkt = null;
  tilOverblik();
}
function tegnForslagKort(res){
  const el = document.getElementById('forslag-kort');
  if(!el || typeof L==='undefined') return;
  if(forslagKortInstans){ forslagKortInstans.remove(); forslagKortInstans = null; }
  const map = lkortBund(el);
  const start = startGeo();
  const kmMax = start ? RADIUS_KM[(s.forberedelse.radius)|0] : null;
  const punkter = res.map(r=>lkortTestet(map, r.t, start, kmMax, 'forslag'));
  if(start){
    L.marker([start.lat, start.lon], { icon: L.divIcon({
      className:'', iconSize:[16,16], iconAnchor:[8,8],
      html:`<div class="lkort-start"></div>` }) })
      .addTo(map).bindTooltip(t('destination.startpunkt','Jeres startpunkt'), { direction:'top', offset:[0,-10] });
    punkter.push(start);
  }
  if(punkter.length){
    map.fitBounds(L.latLngBounds(punkter.map(p=>[p.lat, p.lon])), { padding:[30,30], maxZoom:11 });
  }
  let pin = null;
  pinPunkt = null;
  map.on('click', e=>{
    pinPunkt = { lat:e.latlng.lat, lon:e.latlng.lng };
    if(pin) pin.remove();
    pin = L.marker([pinPunkt.lat, pinPunkt.lon], { icon: L.divIcon({
      className:'', iconSize:[16,16], iconAnchor:[8,8],
      html:`<div class="lkort-bruger"><span class="puls"></span><span class="prik"></span></div>` }) })
      .addTo(map)
      .bindPopup(`<button class="knap primær lille" onclick="vælgPin()">${ik('nål')} ${t('forslag.vaelgpin','Vælg dette sted')}</button>`,
        { className:'lkort-pop', closeButton:false, offset:[0,-8] })
      .openPopup();
  });
  forslagKortInstans = map;
}

function sætDestination(dest){
  if(!s.forberedelse) s.forberedelse = nyForberedelse();
  s.forberedelse.destination = dest;
  gem(); tegn();
  flash(t('destination.satsom','{navn} er sat som destination.',{navn:dest.navn}), 'nål');
}
/* ---------- BYSØGNINGEN (KN 17/9) ----------

   Før: et felt, en Søg-knap og en håndskrevet liste på 25 byer. Kennet
   skrev "odder" og fik "Byen er ikke i prototypens liste endnu" — Odder
   var ikke en af de femogtyve.

   Nu: forslag mens man skriver, ingen knap, og 605 byer fra `byer.js`.
   Samme greb som adressefeltet nedenunder, så de to felter opfører sig
   ens i stedet for at være to forskellige slags søgning på samme skærm.

   ⚠️ DER SPØRGES IKKE UDE I VERDEN. Byerne ligger i appen, og det er
   ikke sparsommelighed — Adressevælgeren KAN ikke finde byer. Den kender
   veje og husnumre: "Odder" giver Odderbjergvej. Se noten i `byer.js`.

   Derfor er der heller ingen pause at vente på. Listen er lokal, og
   svaret kommer, mens fingeren stadig er på tasten. */
let byForslag = [];

/* Destinationssidens ene felt: samme tekst til begge søgninger. */
function stedSkriv(værdi){
  bySkriv(værdi);
  adresseSkriv(værdi);
  // Adresselisten afhænger af, om byerne fandt noget — tegn den om nu,
  // ikke først når registret svarer.
  adresseTegnForslag();
}
function bySkriv(værdi){
  søgTekst = værdi;
  byForslag = (typeof ArytmiByer !== 'undefined') ? ArytmiByer.søg(værdi, 6) : [];
  byTegnForslag();
}

/* Kun listen tegnes om — ikke skærmen. Et fuldt tegn() ved hvert
   tastetryk ville tage fokus fra feltet, og så kunne byen aldrig skrives
   færdig. Samme regel som adresseTegnForslag(); forskellen på at rette i
   kilden og at rette i resultatet står i AGENTS.md. */
function byTegnForslag(){
  const el = $('by-forslag');
  if(!el) return;
  if(!byForslag.length){
    /* Under to tegn er det ikke en søgning endnu, og så skal der ikke stå
       noget. Har man skrevet nok og alligevel ingenting fundet, er DET
       værd at sige. */
    /* Ingen "den by kender vi ikke" her længere (KN 28/9): feltet søger
       også adresser, og det er adresselisten nedenunder, der siger det,
       når INGEN af de to søgninger finder noget. Se adresseTegnForslag(). */
    el.innerHTML = '';
    return;
  }
  el.innerHTML = byForslag.map((b,i) =>
    '<button class="knap blød bred lille" style="margin-top:8px;text-align:left" onclick="vælgBy(' + i + ')">'
    + ik('nål') + ' ' + esc(b.navn)
    + ' <span class="dæmpet" style="font-size:12px">' + b.postnr + '</span></button>').join('');
}

function vælgBy(nr){
  const b = byForslag[nr];
  if(!b) return;
  // Samme regel som vælgAdresse(): valgt i guiden = stedet er fundet.
  const iGuiden = aktivSkærm === 'hvorlangt';
  byForslag = []; søgTekst = '';
  // Feltet søgte også adresser — de hører til det samme, der nu er valgt.
  if(adresseUr){ clearTimeout(adresseUr); adresseUr = null; }
  adresseTekst = ''; adresseForslag = []; adresseVeje = []; adresseBesked = '';
  /* ⚠️ BYEN HAR RIGTIGE lat/lon NU, og det havde den ikke før. Den gamle
     liste bar kun appens omtrentlige x/y, så en by kunne ikke bruges til
     at regne solnedgang ud af. Nu sættes begge — lat/lon er sandheden,
     x/y er den tegning, appen viser den i. Samme regel som for en adresse
     (se AGENTS.md: rigtige lat/lon, når de kendes). */
  const xy = geoTilXY(b.lat, b.lon);
  sætDestination({
    navn: b.navn, egen: true,
    lat: b.lat, lon: b.lon,
    x: Math.round(xy.x), y: Math.round(xy.y)
  });
  if(iGuiden) tilOverblik();
}
/* Destinationens RIGTIGE koordinater, når de kendes.

   Tre slags destinationer, og kun den ene er uden:
     et testet sted   har lat/lon fra indholdet
     en egen adresse  har lat/lon fra adresseregistret
     en pin på kortet har kun appens omtrentlige x/y

   AGENTS.md siger det rent ud: rigtige lat/lon, når de kendes. x/y er en
   tegning af Danmark, ikke en position — solnedgangen på en adresse skal
   ikke regnes ud af et skøn, når adressen selv ved bedre. */
function destGeo(dest){
  if(!dest) return { lat:56.0, lon:10.0 };
  const testet = dest.testetId && TESTEDE.find(t=>t.id===dest.testetId);
  if(testet && Number.isFinite(testet.lat) && Number.isFinite(testet.lon))
    return { lat:testet.lat, lon:testet.lon };
  if(Number.isFinite(dest.lat) && Number.isFinite(dest.lon))
    return { lat:dest.lat, lon:dest.lon };
  return xyTilGeo(dest.x, dest.y);
}

/* ---------- EGEN DESTINATION (KN 13/9) ----------

   "Skriv adressen ind, så de kommende funktioner virker."

   HVORFOR, NÅR MAN ALLEREDE KAN SÆTTE EN PIN: en pin er to tal uden et
   sted. Solnedgangen kan regnes ud af den, men intet andet kan. En
   adresse er det, man kan køre efter, sige højt og genkende igen — og
   det er adresserne, der kan vise os, hvor folk selv tager hen, så nye
   steder kan findes dér, hvor de allerede kører.

   OPSLAGET er Danmarks officielle adresseregister. Ingen nøgle, ingen
   konto, ingen hemmelighed, der kan lække — og det er den samme kilde,
   resten af landet slår op i. Derfor kommer der rigtige lat/lon tilbage
   og ikke et gæt.

   ⚠️ REGISTRET SKIFTEDE DØR 17/9 2026. Det var DAWA
   (api.dataforsyningen.dk/adresser/autocomplete), og **DAWA lukker
   1. oktober 2026 kl. 10** — hele registret, ikke bare ét endepunkt.
   Afløseren hedder Adressevælgeren (adressevaelger.dk) og er bygget
   netop til at overtage autocomplete.

   TO TING ER ANDERLEDES, OG DE FORKLARER, HVORFOR KODEN HERUNDER HAR TO
   TRIN, HVOR DEN FØR HAVDE ÉT:

     1. SØGNINGEN GIVER INGEN KOORDINATER. Den giver en titel og et id.
        Punktet hentes først, når nogen har VALGT en adresse — ét kald i
        stedet for fem, og kun for den ene, der skal bruges.
     2. KOORDINATERNE ER IKKE GRADER. De er EPSG:25832 — meter nord og
        øst. `geo.js` regner dem om, og den fil er også svaret på,
        hvorfor det ikke er noget, man skalerer sig ud af.

   ⚠️ TOKEN ER IKKE EN HEMMELIGHED. Klimadatastyrelsen anbefaler selv, at
   alle bruger `adressevaelger123`, indtil brugerstyringen kommer
   (ultimo 2026 / primo 2027). Den dag skal appen holde op med at spørge
   selv og gå gennem `slaa-adresse-op` i stedet — en nøgle i app.js ligger
   på telefonerne og kan kun skiftes med en ny udgivelse. Det står som en
   åben beslutning i Arytmi-status.md.

   x/y SÆTTES OGSÅ. Det er ikke dobbeltbogholderi: kortet, vejret og
   "nærmeste testede sted" regner stadig i x/y, og et felt, der mangler,
   ville lave tre nye huller for at lukke ét. lat/lon er sandheden,
   x/y er den tegning, appen viser den i.

   ADRESSEN FØLGER MED TUREN OP. sync.js sender hele turobjektet i én
   data-kolonne, så adressen lander i databasen uden en eneste ny tabel.
   Det er dér, nye steder kan findes: hvor kører folk selv hen.

   UDEN DÆKNING: stederne ligger dér, hvor vejen holder op. Slår opslaget
   fejl, bliver det, hun har skrevet, stående, og hun får det at vide —
   i stedet for en tom liste, der ligner "den adresse findes ikke". */
let adresseTekst = '';
let adresseForslag = [];
let adresseBesked = '';
/* Sandt, når registret svarede, men intet fandt — til destinationssidens
   fælles felt, der skal kunne sige det med sine egne ord. */
let adresseIntet = false;
/* Vejene uden husnummer. De kan ikke blive til et sted — en vej er ikke et
   punkt — men de er det eneste rigtige svar på "Testrupvej": HVILKEN
   Testrupvej? Se adresseTegnForslag(). */
let adresseVeje = [];
let adresseUr = null;
/* Registrets egen anbefalede token. Se noten i toppen: den er offentlig
   med vilje og er ikke en hemmelighed, der skal beskyttes. */
const ADRESSE_TOKEN = 'adressevaelger123';
const ADRESSE_REGISTER = 'https://adressevaelger.dk';

/* ÉT OPSLAG I ADRESSEREGISTRET — brugt af både destinationen (trin 3) og
   startpunktet (trin 1, "Hvor starter I fra?"). Kaster ved netværksfejl;
   hvad fladen så siger, bestemmer den selv. */
async function registerSøg(q){
  /* 73 tegn er registrets egen grænse for `tekst`. Længere end det
     svarer den med en fejl, og en fejl her ville se ud som "vi kunne
     ikke nå registret" — altså som et netværksproblem, den ikke er. */
  const svar = await fetch(ADRESSE_REGISTER + '/husnumre/soeg?maksimum=6&token=' + ADRESSE_TOKEN
    + '&tekst=' + encodeURIComponent(q.slice(0, 73)));
  if(!svar.ok) throw new Error('status ' + svar.status);
  const d = await svar.json();
  const fund = (d && Array.isArray(d.fund)) ? d.fund : [];

  /* ⚠️ SVARET BLANDER TRE SLAGS FUND, og kun ét af dem er et sted:

       husnummer               Testrupvej 203, 9600 Aars   → har et punkt
       navngivenvejpostnummer  Testrupvej 8320 Mårslet     → en hel vej
       vejnavn                 Hove Bygade                 → kun et navn

     DAWA svarede kun med det første slags. Adressevælgeren er bygget
     til en flade, der snævrer ind i flere trin; vores er ét felt. */
  /* Registret sorterer efter vejnavnet og ser bort fra resten: "askelunden
     5 odder" gav Høng, Snertinge og Store Heddinge FØR Odder. Derfor
     rykker de forslag frem, der rummer flest af de ord, hun har skrevet —
     byen eller postnummeret er netop det ord, der skiller dem ad. Ellers
     bliver registrets rækkefølge stående. */
  const ord = q.toLowerCase().split(/[\s,]+/).filter(Boolean);
  const træf = tekst => { const lille = tekst.toLowerCase(); return ord.filter(o => lille.includes(o)).length; };
  const forslag = fund
    .filter(a => a && a.type === 'husnummer' && a.id && a.titel)
    .map((a, i) => ({ tekst: String(a.titel), id: String(a.id), træf: træf(String(a.titel)), i }))
    .sort((x, y) => (y.træf - x.træf) || (x.i - y.i))
    .map(a => ({ tekst: a.tekst, id: a.id }));

  /* Vejene beholdes KUN, hvis de ligner det, der blev skrevet. Den
     fonetiske søgning er meget villig: "qqqzzz" svarer med "C
     Steinckesvej". Sagde fladen "qqqzzz findes i 4500 Nykøbing Sj",
     ville den finde på svar — og det er værre end at sige ingenting. */
  const skrab = s => String(s).toLowerCase().replace(/[^a-zæøå0-9]/g,'');
  const nøgle = skrab(q);
  const veje = fund
    .filter(a => a && a.type !== 'husnummer' && a.titel)
    .map(a => String(a.titel))
    .filter(v => skrab(v).includes(nøgle));
  return { forslag, veje };
}

/* Punktet for ét valgt husnummer, i grader. null, hvis det ikke kom. */
async function registerPunkt(id){
  try{
    const svar = await fetch(ADRESSE_REGISTER + '/husnumre/' + encodeURIComponent(id)
      + '?token=' + ADRESSE_TOKEN);
    if(!svar.ok) throw new Error('status ' + svar.status);
    return ArytmiGeo.punktFraSvar(await svar.json());
  }catch(e){ return null; }
}

function adresseSkriv(værdi){
  adresseTekst = værdi; adresseIntet = false;
  if(adresseUr){ clearTimeout(adresseUr); adresseUr = null; }
  if(adresseTekst.trim().length < 3){
    adresseForslag = []; adresseVeje = []; adresseBesked = ''; adresseTegnForslag(); return;
  }
  /* Et opslag pr. tastetryk ville sende tyve forespørgsler af sted for én
     adresse. En kort pause samler dem til ét. */
  adresseUr = setTimeout(adresseHent, 250);
}

async function adresseHent(){
  const q = adresseTekst.trim();
  if(q.length < 3) return;
  if(typeof fetch !== 'function'){
    adresseForslag = []; adresseVeje = [];
    adresseBesked = t('destination.adresseoffline','Vi kan ikke slå adressen op lige nu. Det, du har skrevet, bliver stående — prøv igen, når der er dækning.');
    adresseTegnForslag(); return;
  }
  try{
    const fund = await registerSøg(q);
    adresseForslag = fund.forslag;
    adresseVeje = fund.veje;
    adresseIntet = !(adresseForslag.length || adresseVeje.length);
    adresseBesked = !adresseIntet ? ''
      : t('destination.adresseintet','Den adresse kender registret ikke. Tjek stavemåden — eller sæt en pin på kortet i stedet.');
  }catch(e){
    adresseForslag = []; adresseVeje = [];
    adresseBesked = t('destination.adresseoffline','Vi kan ikke slå adressen op lige nu. Det, du har skrevet, bliver stående — prøv igen, når der er dækning.');
  }
  adresseTegnForslag();
}

/* Kun listen tegnes om — ikke skærmen.

   Et fuldt tegn() ved hvert tastetryk ville tage fokus fra feltet, og så
   kunne adressen aldrig skrives færdig. Det her er skærmens EGEN liste,
   som skærmens egen funktion fylder ud — ikke en efterbehandling af
   noget, tegn() har lavet. Forskellen er hele reglen i AGENTS.md. */
function adresseTegnForslag(){
  const el = $('adr-forslag');
  if(!el) return;
  /* På destinationssiden deler feltet sig med bysøgningen. Har den fundet
     en by, er "den adresse kender registret ikke" og "Odderbjergvej findes
     her" bare støj under det rigtige svar — så står der kun husnumre. */
  const fælles = !!$('by-forslag');
  const byFundet = fælles && byForslag.length > 0;
  const intet = adresseIntet && !!adresseBesked;
  if(adresseBesked && intet && byFundet){ el.innerHTML = ''; return; }
  if(adresseBesked && intet && fælles){
    el.innerHTML = '<p class="dæmpet" style="font-size:12.5px;margin:10px 0 0">'
      + esc(t('destination.stedintet','Vi kan hverken finde en by eller en adresse med det navn. Tjek stavemåden — eller sæt en pin på kortet.')) + '</p>';
    return;
  }
  if(adresseBesked){
    el.innerHTML = '<p class="dæmpet" style="font-size:12.5px;margin:10px 0 0">' + adresseBesked + '</p>';
    return;
  }
  let ud = adresseForslag.map((a,i) =>
    '<button class="knap blød bred lille" style="margin-top:8px;text-align:left" onclick="vælgAdresse(' + i + ')">'
    + ik('nål') + ' ' + esc(a.tekst) + '</button>').join('');

  /* Vejene siges ALTID, når der er nogen — også når der står et forslag
     ovenover. Det er med vilje, og det er den dyrekøbte del:

     "Testrupvej" giver ét forslag, Testrupvej 203 i Aars. Det ser ud som
     svaret. Men der findes Testrupvej i Mårslet, i Hovedgård og i
     Aalestrup — og de har bare ikke et husnummer, der matchede. Ét
     enligt forslag er den farligste slags, fordi det ligner en
     bekræftelse. Så skal de andre veje stå der.

     DAWA fortalte det aldrig. Dér fik man husnumrene 1, 2, 3 fra den
     første vej, der passede, og hørte aldrig om de tre andre. */
  if(adresseVeje.length && !byFundet){
    ud += '<p class="dæmpet" style="font-size:12.5px;margin:10px 0 0">'
      + esc(adresseForslag.length
          ? t('destination.adressevejogsaa','Samme vejnavn findes også her — skriv husnummeret med:')
          : t('destination.adressevej','Skriv også husnummeret. Vejen findes her:'))
      + '<br>' + adresseVeje.slice(0,4).map(esc).join('<br>') + '</p>';
  }
  el.innerHTML = ud;
}

/* ⚠️ DEN HER VENTER PÅ NETTET NU, og det gjorde den ikke før.

   DAWA sendte koordinaterne med i søgningen, så et tryk var bare et tryk.
   Adressevælgeren giver kun et id, og punktet skal hentes. Derfor er der
   et øjeblik mellem trykket og stedet — og det øjeblik skal SIGES, ellers
   ser knappen ud til ikke at virke, og man trykker igen. */
async function vælgAdresse(nr){
  const a = adresseForslag[nr];
  if(!a) return;

  /* Vælges adressen INDE i guiden (trin 3), er stedet dermed fundet, og
     de to trin, der findes et sted FOR dig — ønskerne og de tre forslag —
     har ikke længere et spørgsmål at stille.

     ⚠️ VI GÅR TIL OVERBLIKKET, IKKE TIL KORTET (KN 28/9: "man skal vel
     bare hoppe videre til overblikket da man jo har valgt sit eget sted").
     Før landede man på destinationskortet — med forslagene på — og skulle
     selv trykke videre. Nu gør det samme som at vælge et af vores steder:
     tilOverblik(), ligesom vælgTestetSted().

     Det skal aflæses NU, før vi venter på registret: når svaret kommer,
     kan hun være gået videre til en anden skærm. */
  const iGuiden = aktivSkærm === 'hvorlangt';

  adresseBesked = t('destination.adressehenter','Henter stedet …');
  adresseForslag = []; adresseVeje = [];
  adresseTegnForslag();

  const punkt = await registerPunkt(a.id);

  if(!punkt){
    /* Det, hun har skrevet, bliver stående. En tom liste ville ligne "den
       adresse findes ikke", og det passer ikke — vi nåede den bare ikke.
       Adressen blev fundet; det var punktet, der ikke kom. */
    adresseBesked = t('destination.adressepunkt','Vi fandt adressen, men ikke stedet på kortet. Prøv igen — eller sæt en pin.');
    adresseTegnForslag();
    return;
  }

  const xy = geoTilXY(punkt.lat, punkt.lon);
  adresseBesked = ''; adresseTekst = '';
  søgTekst = ''; byForslag = [];
  sætDestination({
    navn: a.tekst, adresse: a.tekst, egen: true,
    lat: punkt.lat, lon: punkt.lon,
    x: Math.round(xy.x), y: Math.round(xy.y)
  });
  if(iGuiden) tilOverblik();
}
/* ⚠️ HER STOD `værtsKort()` — kortet "Den gode vært siger". Væk 17/9.

   KN: "Ift. den gode vært siger synes jeg ikke det giver mening at have
   dette mere. Og hvor trækker den data fra hvis jeg vælger min egen
   destination?"

   Det andet spørgsmål er svaret på det første. Otte linjer, fire kilder:

     · Solnedgangen         ÆGTE. Regnet af stedets lat/lon og datoen.
     · "Find et sted med    En fast sætning. Den samme hver gang, alle
       udsigt"              steder, altid.
     · Nat og stjerner      demoVejr() — opdigtet af x, y og dagens dato.
                            Temperaturen var mærket "(demo-vejr)".
                            Stjernelinjen var IKKE.
     · Toilet, indkøb,      Hentet fra det nærmeste TESTEDE sted inden
       aftensmad, bager     for 16 enheder i appens x/y.

   Og de 16 enheder er **cirka 24 kilometer**. Det er dér, kortet gik fra
   at være tyndt til at være forkert: valgte man sin egen adresse, arvede
   den et andet steds toilet, indkøb og bager, uden at nogen sagde det.
   Kennets eget skærmbillede viste "Aftensmad: Ja — flere muligheder i
   Skanderborg" — den sætning står på Vestermølle.

   "Nærmeste toilet: Ja" kan altså betyde et toilet en halv times kørsel
   væk. Det er ikke en tynd oplysning; det er en forkert en, og den slags
   koster mere end den vejer, når nogen står i en skov og tror på den.

   Solnedgangen var den ene linje, der var ægte hele vejen. Den er ikke
   væk — den er flyttet op under datoen på heroen, hvor man kigger i
   forvejen. Se `solLinje()`.

   Resten ligger i git. Skal faciliteterne tilbage en dag, skal de komme
   fra stedet selv, ikke fra naboen. */
/* Hvor godt passer et testet sted til trin 4? Kun steder med rigtigt
   indhold har ønsker på sig — pladsholderne (t2-t10) har ingen, og skal
   derfor ikke lade som om de matcher. */
const ØNSKE_ORD = { solopgang:'Solopgang', solnedgang:'Solnedgang', vand:'Vand', land:'Land', isoleret:'Isoleret', livligt:'Livligt' };

/* Passer stedets kategori på det, kunden har valgt? (KN 24/9, 0041)

   Kunden vælger stadig ét af to. STEDET kan nu også være `begge` — og på
   lyset `ingen`, et sted hvor man hverken ser solen stå op eller gå ned.

   ⚠️ TOM ER IKKE INGEN. Tom betyder, at ingen har kategoriseret stedet, og
   Kennets regel er, at det så tæller som begge: stedet dukker op for begge
   ønsker i stedet for at forsvinde fra dem. `ingen` er et bevidst valg og
   passer aldrig.

   Stemningen har hverken begge eller ingen. Der skal den ramme præcist. */
function ønskePasser(gruppe, sted, valg){
  const v = (sted.ønsker && sted.ønsker[gruppe]) || '';
  if(gruppe === 'stemning') return v === valg;
  if(v === 'ingen') return false;
  return v === '' || v === 'begge' || v === valg;
}
function ønskeMatch(t){
  const o = s.forberedelse && s.forberedelse.oplevelser;
  if(!o) return null;
  const nøgler = ['lys','natur','stemning'].filter(k=>o[k]);
  if(!nøgler.length) return null;
  const ramte = nøgler.filter(k=>ønskePasser(k, t, o[k]));
  // `ramte` er KUNDENS ord for det, der passede - aldrig stedets egen
  // værdi, som nu kan være "begge" og ikke er et ønske, man kan vise.
  return { træf: ramte.length, ud_af: nøgler.length, ramte: ramte.map(k=>ØNSKE_ORD[o[k]]) };
}
/* Opsummering af trin 3 + 4, så valgene er synlige på kortet */
function valgChips(){
  const f = s.forberedelse;
  if(!f) return '';
  const o = f.oplevelser || {};
  const ønsker = ['lys','natur','stemning'].filter(k=>o[k]).map(k=>ØNSKE_ORD[o[k]].toLowerCase());
  const linje = [RADIUS_TEKST[f.radius|0].toLowerCase()+(f.startNavn?' fra '+esc(f.startNavn):'')]
    .concat(ønsker).join(' · ');
  return `<div class="valg-linje">${ik('gps')}<span>${linje}</span>
    <button onclick="gåTil('hvorlangt')">${t('faelles.ret','Ret')}</button></div>`;
}
/* ⚠️ DESTINATIONSSKÆRMEN ER VÆK (KN 28/9: "Hvad skal vi så egentlig med
   denne side mere?"). Da kortet ikke længere viste forslagene, kunne den
   det samme som trin 3 — plus en pin og "Brug min placering". Søgefeltet
   er flyttet til trin 3; pin og GPS-destination er ikke. 'destination'
   findes stadig som SEKTION (fase 1's ene opgave, sektionKlar()), bare
   ikke som skærm. Koden ligger i git før 28/9. */
/* Hvor "tilbage" fører hen fra et sted: listen med tre forslag
   eller kortet, alt efter hvor man kom fra. */
let testetRetur = 'forslag';
function åbnTestet(id, fra){ testetRetur = fra || 'forslag'; gåTil('testet-'+id); }
/* Køretid som skøn: vi har ikke rutedata i prototypen, kun fugleflugt.
   70 km/t er et fair gennemsnit på danske landeveje inkl. de sidste
   grusveje. Skønnet er mærket som skøn — ikke som en rutebeskrivelse. */
function køretid(km){
  /* Gulv på 5 min (14/8): under ca. 3 km rundede formlen ned til 0, og
     "2 km · 0 min" stod på kortet som om turen var gratis. Det gjorde ikke
     noget, så længe køretiden kun lå på destinationssiden — den står nu på
     forslagskortet, hvor de nære steder er dem, man ser først. */
  const min = Math.max(5, Math.round(km / 70 * 60 / 5) * 5);
  if(min < 60) return t('destination.minutter','{min} min',{min});
  const timer = Math.floor(min/60), r = min%60;
  return r ? t('destination.timerogmin','{timer} t {min} min',{timer,min:r})
           : (timer>1 ? t('destination.timer','{timer} timer',{timer}) : t('destination.time','{timer} time',{timer}));
}
/* Praktisk på stedet — som gitter, ikke som brødtekst (14/8).
   Felterne har ligget i datamodellen siden rekognosceringsturen og blev vist
   som fire linjer tekst nederst på siden, altså som noget man skulle LÆSE.
   Nu står de som fire felter, man kan scanne på to sekunder.
   Alle fire vises altid: at vi ikke har noteret et toilet, er også en
   oplysning — og det er tydeligere som et tomt felt end som en manglende
   linje, man ikke kan vide manglede. */
/* KN 24/9: "Fjern indkøb, morgenmad og aftensmad fra ruterne." Kun toilettet
   er tilbage. Felterne står stadig i databasen og i bundtet (fac_handel,
   fac_aftensmad, fac_morgen) — de vises bare ikke. Slet ikke, parkér. */
function faciliteterKort(sted){
  const toilet = (sted.faciliteter || {}).toilet;
  return `<div class="sektion" style="margin-bottom:8px"><h3>${t('destination.praktisk','Praktisk på stedet')}</h3></div>
  <div class="fakta-net en">
    <div class="fakta">${ik('toilet')}<div class="fakta-krop">
      <span class="fakta-navn">${t('destination.toilet','Toiletfaciliteter')}</span>
      <span class="fakta-værdi${toilet?'':' tom'}">${toilet?esc(toilet):t('destination.ikkenoteret','Ikke noteret')}</span>
    </div></div>
  </div>
  ${toilet?'':`<p class="dæmpet" style="margin:-8px 0 16px">${t('destination.ingentoilet','Vi noterede ikke et toilet her. Regn med, at I selv skal have det nødvendige med.')}</p>`}`;
}

/* STJERNERNE (KN 24/9). I sætter dem i bagrummet efter skalaen herunder —
   den SAMME skala står ved vælgeren i `arytmi-landing/admin`. Rettes den
   ene, skal den anden rettes med.

   Kennets krav til fem: god udsigt, minimal trafik og toilet. Resten af
   skalaen tæller de tre ned, så et tal altid kan forklares med de samme
   tre ting.

   Hvert trin står som sit eget t()-kald og ikke i en tabel med nøglen i en
   variabel: vaerktoej/hent-noegler.mjs læser kun bogstavelige kald, og en
   tekst, den ikke kan se, kan OD ikke rette fra bagrummet. */
function stjerneSkala(){
  return [
    [5, t('destination.stjerner5','Det hele: god udsigt, minimal trafik og toilet.')],
    [4, t('destination.stjerner4','To af de tre.')],
    [3, t('destination.stjerner3','Én af de tre, og et sted vi gerne kommer tilbage til.')],
    [2, t('destination.stjerner2','Ingen af de tre, men en rolig nat.')],
    [1, t('destination.stjerner1','En nødløsning, når alt andet er fuldt.')]
  ];
}
function stjerneTegn(n){
  return `<span class="stjerner" role="img" aria-label="${esc(t('destination.stjernearia','{n} af 5 stjerner',{n}))}">${
    [1,2,3,4,5].map(i=>`<span class="${i<=n?'fuld':'tom'}">★</span>`).join('')}</span>`;
}
function visStjerneSkala(){
  infoModal(`<b>${t('destination.stjerneskala','Sådan giver vi stjerner')}</b><br><br>`
    + stjerneSkala().map(([n,tekst])=>`${stjerneTegn(n)}<br>${tekst}`).join('<br><br>'),
    t('faelles.forstaaet','Forstået'));
}
function vurderingKort(sted){
  if(!sted.stjerner) return '';
  return `<div class="dom vurdering">
    <div class="dom-titel">${t('destination.vurdering','Vores vurdering')}</div>
    <div class="vurdering-linje">${stjerneTegn(sted.stjerner)}
      <button class="tekst-knap" onclick="visStjerneSkala()">${t('destination.stjernerhvad','Hvad betyder stjernerne?')}</button>
    </div>
  </div>`;
}
/* "Kort fortalt" — dommen over prosaen (14/8).
   Beskrivelserne er det bedste i appen, og der er ikke ændret ét ord i dem.
   Men de gjorde kun det ene af de to, en god tekst skal: de var bløde på
   mennesket uden at være faste på sagen. Linjen her leverer fakta, så
   fortællingen nedenunder får lov at være fortælling.
   Kun udfyldte felter kommer med — står der ingenting, vises linjen ikke. */
function kortFortalt(sted, km){
  const d = [];
  if(sted.ord) d.push(esc(sted.ord));
  if(km!=null) d.push(`${km} km <i>·</i> ${esc(køretid(km))}`);
  if(sted.underlag) d.push(esc(sted.underlag));
  const wc = toiletKort(sted.faciliteter && sted.faciliteter.toilet);
  if(wc) d.push(wc.replace(/<\/?b>/g,''));
  if(sted.godTilBørn) d.push(esc(t('destination.boern','God til børn')));
  if(d.length < 2) return '';
  return `<div class="dom">
    <div class="dom-titel">${t('destination.kortfortalt','Kort fortalt')}</div>
    <div class="dom-linje">${d.join(' <i>·</i> ')}</div>
  </div>`;
}
/* Billederne fra rekognosceringsturen får hele skærmen (OD 13/8). Før lå det
   første som et 210px bånd og resten som frimærker på 132px — seks billeder fra
   en tur, gemt væk. Nu ét stående 3:4-galleri man swiper i, med stedets navn
   liggende fast ovenpå og prikker der viser hvor man er.
   Teksten har pointer-events:none, så et træk hen over den stadig bladrer. */
function stedGalleri(sted){
  const b = sted.billeder || [];
  const overlay = `
    <div class="sg-tekst">
      ${!sted.klar?`<span class="sg-mærkat">${t('destination.maaske','Måske — vi tester igen')}</span>`
        : sted.anbefalet?`<span class="sg-mærkat anbefalet">${t('destination.anbefalet','Anbefalet af Arytmi')}</span>`:''}
      ${sted.klar && sted.godTilBørn?`<span class="sg-mærkat">${t('destination.boern','God til børn')}</span>`:''}
      <h1 class="sg-navn">${esc(sted.navn)}</h1>
      ${sted.kort?`<div class="sg-under">${esc(sted.kort)}</div>`:''}
    </div>`;
  if(!b.length){
    return `<div class="sted-galleri uden-foto">
      <span class="sg-vandmærke">${ik('stjerne')}</span>
      ${overlay}
      <div class="sg-ingen">${t('destination.ingenbilleder','Vi nåede ikke at få billeder med hjem herfra — de kommer.')}</div>
    </div>`;
  }
  return `<div class="sted-galleri">
    <div class="sg-spor" id="sg-${sted.id}" onscroll="sgPrik('${sted.id}')">
      ${b.map((f,i)=>`<img src="${f}" alt="${t('destination.billedalt','{navn} — billede {nr} af {ialt}',{navn:sted.navn,nr:i+1,ialt:b.length})}"
        width="1050" height="1400" ${i?'loading="lazy"':'fetchpriority="high"'} decoding="async"
        onclick="visFoto('${sted.id}',${i})">`).join('')}
    </div>
    ${overlay}
    ${b.length>1?`<div class="sg-prikker" id="sgp-${sted.id}">${b.map((_,i)=>
      `<span class="${i?'':'på'}"></span>`).join('')}</div>`:''}
  </div>`;
}
/* Hvilket billede står man på. Regnes ud fra scroll-positionen, så prikkerne
   følger fingeren i stedet for at skulle klikkes. */
function sgPrik(id){
  const spor = $('sg-'+id), prikker = $('sgp-'+id);
  if(!spor || !prikker) return;
  const i = Math.round(spor.scrollLeft / spor.clientWidth);
  [...prikker.children].forEach((p,n)=>p.classList.toggle('på', n===i));
}
function visFoto(id, i){
  const t = TESTEDE.find(x=>x.id===id); if(!t) return;
  const b = t.billeder || []; if(!b[i]) return;
  const el = document.createElement('div');
  el.className = 'foto-lup';
  el.innerHTML = `<img src="${b[i]}" alt="${esc(t.navn)}">
    <div class="lup-tæl">${i+1} / ${b.length}</div>`;
  el.onclick = () => el.remove();
  document.body.appendChild(el);
}
function skærmTestet(id){
  const sted = TESTEDE.find(x=>x.id===id);
  if(!sted){ gåTil('hjem'); return; }
  const start = startGeo();
  const km = start ? Math.round(afstandKm(start, testetGeo(sted))) : null;
  const m = ønskeMatch(sted);
  const bill = sted.billeder || [];
  const linjer = [];
  if(km!=null){
    const kmMax = RADIUS_KM[(s.forberedelse.radius)|0];
    linjer.push(`<div class="vært-række">${ik('gps')}<div class="v-tekst">${t('destination.kmfra','Ca. {km} km fra {sted}',{km,sted:s.forberedelse.startNavn})}${km>kmMax?` — <b>${t('destination.laengerevaek','længere væk, end I valgte')}</b>`:''}</div></div>`);
    linjer.push(`<div class="vært-række">${ik('bil')}<div class="v-tekst">${t('destination.ibil','Ca. <b>{tid}</b> i bil',{tid:køretid(km)})} <span class="dæmpet" style="font-size:12.5px">${t('destination.skoen','(skønnet ud fra fugleflugt ved 70 km/t)')}</span></div></div>`);
  }
  if(m) linjer.push(`<div class="vært-række">${ik('stjerne')}<div class="v-tekst">${t('destination.passerpaa','Passer på {traef} af jeres {udaf} ønsker',{traef:m.træf,udaf:m.ud_af})}${m.træf?': '+m.ramte.map(o=>o.toLowerCase()).join(' · '):''}</div></div>`);
  $('indhold').innerHTML = `<div class="side anim">
    ${skærmTop(sted.navn,testetRetur, sted.kladde
      ? t('destination.kladde','Kladde — kun I kan se den')
      : sted.klar?t('destination.testetstjerne','Testet af Arytmi ★'):t('destination.maaske','Måske — vi tester igen'))}
    ${editorTil()?`<button class="knap kontur bred" style="margin-bottom:14px" onclick="gåTil('red-sted-${esc(sted.id)}')">${ik('blyant')} ${t('editor.retsted','Ret stedet')}</button>`:''}
    ${sted.kladde?`<div class="advarsel">${ik('blyant')} ${t('destination.kladdebrod','Den her er ikke udgivet endnu. Den står kun på jeres egne telefoner — en kunde ser den ikke, før I trykker Udgiv i bagrummet.')}</div>`:''}
    ${linjer.length?`<div class="kort"><div class="etiket">${t('destination.forjerestur','For jeres tur')}</div>${linjer.join('')}</div>`:''}
    ${stedGalleri(sted)}
    ${vurderingKort(sted)}
    ${kortFortalt(sted, km)}
    <div class="kort guide-brød"><p>${esc(sted.beskrivelse||'')}</p></div>
    ${faciliteterKort(sted)}
    <button class="knap primær bred" onclick="vælgTestetSted('${sted.id}')">${t('destination.vaelgsted','Vælg dette sted')} ${ik('pil')}</button>
    <div style="text-align:center;margin-top:10px"><button class="knap kontur lille" onclick="tilbage('${testetRetur}')">${ik('tilbage')} ${testetRetur==='forslag'?(s.forberedelse && s.forberedelse.flereForslag ? t('destination.deandre','Se de andre forslag') : t('destination.deandreto','Se de andre to')):t('faelles.tilbage','Tilbage')}</button></div>
  </div>`;
}
function vælgTestetSted(id){
  const t = TESTEDE.find(x=>x.id===id);
  if(!t) return;
  sætDestination({ navn:t.navn, x:t.x, y:t.y, testetId:t.id });
  tilOverblik();
}
/* Stedet er valgt — så er trin 1 forbi (OD 13/8). Før gik man videre til
   "hvem vil du dele denne arytme med?"; nu lander man på overblikket, hvor
   man selv vælger, hvad man har lyst til at tage fat på.
   gåTilErstat: destinationssiden er brugt op og skal ikke ligge i vejen,
   når man trykker tilbage fra overblikket. */
function tilOverblik(){
  if(s.forberedelse) s.forberedelse.fase = 2;
  gem();
  nulstilHistorik();
  gåTilErstat('hjem');
}

/* =============================================================
   3 · BILEN — først hvilken bil, så foldbare emner i to grupper
   ============================================================= */
/* Hvilke emner der står foldet ud. Ren visningstilstand: den skal hverken
   gemmes eller ligge i historikken — at folde en tekst ud er en oplysning,
   ikke et skridt man skal kunne gå tilbage fra. */
let åbneBilEmner = {};
function bilFold(id){ åbneBilEmner[id] = !åbneBilEmner[id]; tegn(); }
/* "Tilføj til tur"-knappen er væk (KN 30/8, efter OD's spørgsmål): valgene
   blev allerede gemt ved hvert tryk, så knappen bekræftede kun noget, der var
   sket. Næste/Færdig gør arbejdet nu. */
function vælgBilType(id){
  if(!s.forberedelse) s.forberedelse = nyForberedelse();
  s.forberedelse.bilType = id;
  gem(); tegn();
}
/* KLIMAANLÆGGET (OD 4/10). Kun for "Anden bil": en elbil holder temperaturen
   på batteriet, en benzin- eller dieselbil gør det kun, hvis anlægget kan køre
   uden motoren. Svaret folder sin tekst ud under knapperne. */
function bilKlimaKort(f){
  const svar = f.bilKlima || null;
  return `
    <div class="sektion"><h3>${t('bilen.klimaspm','Har din bil klimaanlæg, som kan køre, uden at bilen er tændt?')}</h3></div>
    <div class="seg-valg">
      <button class="seg-knap ${svar==='nej'?'valgt':''}" onclick="vælgBilKlima('nej')"><span>${t('faelles.nej','Nej')}</span></button>
      <button class="seg-knap ${svar==='ja'?'valgt':''}" onclick="vælgBilKlima('ja')"><span>${t('faelles.ja','Ja')}</span></button>
    </div>
    ${svar ? `<div class="kort guide-brød" style="margin-top:12px"><p style="margin:0">${svar==='nej'
      ? t('bilen.klimanej','Forudsætningen for en god nattesøvn og et godt ophold er, at I kan temperere bilen. I de kolde måneder skal I kunne holde jer varme, og om sommeren skal I ikke steges. Derudover skal I også have ilt nok, så I ikke vågner med hovedpine. Find gode råd i e-bogen, kapitel 6.')
      : t('bilen.klimaja','Super. Det er en god forudsætning for at kunne holde temperaturen og iltniveauet i bilen. Husk at teste systemet, inden I tager afsted. Læs e-bogen for gode råd.')}</p></div>` : ''}`;
}
function vælgBilKlima(svar){
  if(!s.forberedelse) s.forberedelse = nyForberedelse();
  s.forberedelse.bilKlima = svar;
  gem(); tegn();
}
/* Vælg til/fra — punktet følger med over på pakkelisten. Ingen flash pr. tryk
   (OD 30/8): når man sidder og vælger ti ting i træk, bliver en besked hver
   gang til støj, ikke til hjælp. */
function bilHusk(id){
  if(!s.forberedelse) s.forberedelse = nyForberedelse();
  const h = s.forberedelse.bilHuske || (s.forberedelse.bilHuske = []);
  const i = h.indexOf(id);
  if(i>=0) h.splice(i,1); else h.push(id);
  gem(); tegn();
}
/* Bilen er tre trin (OD 30/8), ét pr. gruppe i BILEN_GRUPPER — før lå alle
   tre lister under hinanden på én lang side sammen med instrumentbrættet.
   Ruterne er 'bilen', 'bilen-1' og 'bilen-2'; kun 'bilen' er en SEKTIONER-
   sektion, så header/fod/lås virker uændret. Instrumentbrættet ("Sådan står
   bilen") er væk: de fire felter fortalte enten noget, appen ikke kan vide
   (strøm), eller noget der allerede står på destinationssiden (km, underlag). */
function skærmBilen(nr){
  const f = s.forberedelse || nyForberedelse();
  const huske = f.bilHuske || [];

  // Trin 0: hvilken bil? Resten handler om strøm og plads, og begge dele ser
  // forskellige ud alt efter svaret — så spørgsmålet kommer først.
  if(!f.bilType){
    return void ($('indhold').innerHTML = `<div class="side anim">
      ${sektionHeader('bilen')}
      <div class="kort guide-brød">
        <p>${t('bilen.spm','Først: hvad kører I i? Det afgør, hvordan I får strøm til natten.')}</p>
        <p class="citat" style="margin-bottom:0">${t('bilen.tip','Tip: Du kan læse mere i Arytmi e-bogen "Hvor kan vi sove i bilen i nat"')}</p>
      </div>
      ${BIL_TYPER.map(t=>`
        <button class="res-kort" onclick="vælgBilType('${t.id}')">
          <span class="res-ikon">${ik('bil')}</span>
          <span class="res-krop"><span class="res-navn">${t.navn}</span><span class="res-meta">${t.under}</span></span>
          <span class="tjek-pil">${ik('pil')}</span>
        </button>`).join('')}
      ${sektionFod('bilen')}
    </div>`);
  }

  const antal = BILEN_GRUPPER.length;
  const i = Math.min(antal-1, Math.max(0, parseInt(nr,10) || 0));
  const g = BILEN_GRUPPER[i];
  const sidste = i === antal-1;
  const valgtType = BIL_TYPER.find(t=>t.id===f.bilType) || BIL_TYPER[0];
  const prikker = BILEN_GRUPPER.map((x,n)=>`<span class="sek-prik ${n===i?'aktiv':''}"></span>`).join('');
  /* Tryk på rækken vælger til/fra; info-ikonet folder teksten ud. De to er
     adskilt (stopPropagation), så man ikke fravælger et punkt ved et uheld,
     når man bare ville læse mere. Info-ikonet vises kun, hvis punktet HAR en
     tekst — sengetøjet har ingen (OD 30/8). */
  /* Anden bil (KN 5/10): "Strøm" er fjernet — strømmen er et elbil-spørgsmål —
     og varmens infotekst vises ikke, fordi spørgsmålet om klimaanlæg ovenover
     siger det samme. */
  const anden = f.bilType === 'andet';
  const punkter = g.punkter.filter(p => !(anden && p.id === 'strøm'));
  const emne = (p)=>{
    const åben = !!åbneBilEmner[p.id];
    const brød = (anden && p.id === 'varme') ? '' : p.brød;
    const husket = huske.includes(p.id);
    return `
      <div class="liste-punkt" onclick="bilHusk('${p.id}')" style="cursor:pointer">
        <div class="tjekboks ${husket?'markeret':''}"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
        <div class="navn">${p.navn}${p.tip?`<div class="dæmpet" style="font-size:12.5px;margin-top:2px">${esc(p.tip)}</div>`:''}</div>
        ${brød?`<button class="bil-info" onclick="event.stopPropagation();bilFold('${p.id}')" aria-label="Mere om ${esc(p.navn)}">${ik('info')}</button>`:''}
      </div>
      ${åben&&brød?`<div class="bil-krop">
        <p>${brød}</p>
      </div>`:''}`;
  };

  $('indhold').innerHTML = `<div class="side anim">
    ${i===0 ? sektionHeader('bilen', true) : madTrinTop(g.navn, '', `Bilen · ${i+1}/${antal}`)}
    <div class="sek-prikker">${prikker}</div>
    ${i===0?`<div class="liste">
      <div class="liste-punkt">
        <span style="color:var(--rav);flex-shrink:0">${ik('bil')}</span>
        <div class="navn">${valgtType.navn}<div class="dæmpet" style="font-size:12.5px;margin-top:2px">${valgtType.under}</div></div>
        <button class="knap kontur lille" onclick="vælgBilType(null)">Skift</button>
      </div>
    </div>
    ${f.bilType==='andet' ? bilKlimaKort(f) : ''}
    <div class="sektion"><h3>${esc(g.navn)}</h3></div>`:''}
    ${g.under?`<p class="dæmpet" style="margin:-4px 0 12px;font-size:13px">${g.under}</p>`:''}
    ${vælgAlleLinje('bilHuske', [...punkter, ...(g.åben ? egne(g.åben) : [])])}
    <div class="liste">
      ${punkter.map(emne).join('')}
      ${g.åben ? egne(g.åben).map(p=>egetBilEmne(g.åben,p,huske)).join('')
                 + egetFeltRække(g.åben, g.åbenTekst || 'Skriv dit eget punkt') : ''}
    </div>
    ${i===0
      ? sektionFod('bilen', "gåTil('bilen-1')")
      : madTrinFod('bilen'+(i===1?'':'-'+(i-1)), sidste?'Færdig':'Næste',
                   sidste ? 'bilenFærdig()' : `gåTil('bilen-${i+1}')`)}
  </div>`;
}
/* Sidste trin på Bilen. Markerer sektionen som gennemgået (bilenKlar) og
   sender tilbage til overblikket — samme mønster som forplejningFærdig(). */
function bilenFærdig(){
  if(!s.forberedelse) s.forberedelse = nyForberedelse();
  s.forberedelse.set.bilen = true; gem(); tegn();
  valgModal('Alt til bilen er nu tilføjet pakkelisten.', [
    { tekst:'Til overblik',           aktion:()=>tilbageTil('hjem') },
    { tekst:'Fortsæt til personligt', primær:true, aktion:()=>gåTil('pakke') }
  ]);
}
/* Et hygge-punkt, man selv har skrevet. Det har ingen brødtekst at folde ud —
   kun en tjekboks til at tilføje/fjerne det fra turen og et kryds til at
   slette det helt (KN 27/8: samme tjekboks-mønster som de faste punkter, så
   man ikke skal åbne noget for at tilføje det). Modsat appens egne punkter
   overlever det turen, så det står der næste gang. */
function egetBilEmne(liste, p, huske){
  const husket = huske.includes(p.id);
  return `<div class="liste-punkt" onclick="bilHusk('${p.id}')" style="cursor:pointer">
    <div class="tjekboks ${husket?'markeret':''}"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
    <div class="navn">${esc(p.tekst)}</div>
    <button class="eget-fjern" onclick="event.stopPropagation();fjernEgetPunkt('${liste}','${p.id}')" aria-label="${esc(t('faelles.fjernpunkt','Fjern punkt'))}">${ik('kryds')}</button>
  </div>`;
}

/* =============================================================
   4 · FORPLEJNING — madscenarier → snacks og drikkevarer → (morgenmad, kun
   flerdages-ture). Det man vælger undervejs lander på pakkelisten: grejet
   under "Madudstyr", maden og drikkevarerne under "Handleliste".
   ============================================================= */
function forplejningKlar(){
  const f = s.forberedelse;
  return !!(f && ((f.madValg&&f.madValg.length) || (f.snackValg&&f.snackValg.length)));
}
/* Alt der skal KØBES — mad, snacks og drikkevarer. Går på turplanen og på
   pakkelistens handleliste. Selve grejet ligger i madScenarieUdstyr(). */
function valgtForplejning(){
  const f = s.forberedelse; if(!f) return [];
  return [
    ...(f.madValg||[]).map(id=>MAD_VALG.find(x=>x.id===id)),
    ...(f.snackValg||[]).map(id=>SNACK_VALG.find(x=>x.id===id))
  ].filter(Boolean);
}
/* De punkter man har valgt under "Det skal I bruge" i sine madscenarier —
   både de faste og dem man selv har skrevet. Alt samles under ÉN gruppe,
   "Madudstyr" (OD 30/8: pakkelisten skal ikke vise scenariets navn, den skal
   vise hvad slags ting det er). */
function madScenarieValgte(){
  const f = s.forberedelse; if(!f) return [];
  const valgte = f.brugValg || [];
  return (f.madValg||[]).flatMap(id => {
    const d = MAD_SCENARIE_DETALJER[id];
    if(!d) return [];
    return [...d.brug, ...egne('mad-'+id)].filter(p=>valgte.includes(p.id));
  });
}
/* Grejet fra scenarierne. Punkter mærket handle:true er mad, ikke grej — de
   hører på handlelisten og filtreres fra her (OD 31/8: tapasretter, dip og
   brød skal købes, ikke pakkes). Egne punkter har aldrig handle, så de
   lander som før i køkkenet. */
function madScenarieUdstyr(){
  return madScenarieValgte().filter(p=>!p.handle).map(p=>({ ...p, gruppe:'Madudstyr' }));
}
function madScenarieMad(){
  return madScenarieValgte().filter(p=>p.handle).map(p=>({ ...p, gruppe:'Handleliste' }));
}
/* Morgenmad-trinnets valgte punkter (faste + selvskrevne) lander på
   pakkelisten under Madudstyr sammen med scenariernes grej (OD 30/8).
   Egne punkter tælles nu med på samme vilkår som de faste — de skal stå i
   morgenValg (KN 4/9). forvælgMorgen() sørger for, at de starter valgt. */
function morgenUdstyr(){
  const f = s.forberedelse; if(!f) return [];
  const valgte = f.morgenValg || [];
  return [...MORGEN_VALG, ...egne('morgen')]
    .filter(p=>valgte.includes(p.id))
    .map(p=>({ ...p, gruppe:'Madudstyr' }));
}
/* Flerdages-tur (Hjem igen ≠ samme dag) får et morgenmads-trin ind i flowet. */
function flerdagsTur(){ const f=s.forberedelse; return !!(f && f.retur && f.retur!=='samme'); }
function madTrinTop(titel, under, etiket){
  return `<div class="trin-top">
    <div class="etiket-række"><div class="etiket">${etiket||t('mad.etiket','Mad &amp; drikke')}</div></div>
    <h1 style="font-size:22px">${titel}</h1>
  </div>
  ${under?`<p class="dæmpet" style="margin:2px 0 14px">${under}</p>`:''}`;
}
/* Tilbage følger historikken — fallback bruges kun, hvis man er landet
   direkte på siden uden at komme et sted fra. */
/* tilbageLabel bruges af madscenarie-siden, hvor venstre knap ikke hedder
   "Tilbage", men "Se et andet madscenarie" (OD 31/8). Handlingen er den samme —
   ét skridt tilbage — det er kun ordet, der siger, hvad der ligger derinde. */
function madTrinFod(tilbageFald, næsteLabel, næsteAktion, tilbageLabel){
  return `<div style="margin-top:18px">
    <div class="fod-nav">
      <button class="knap kontur lille" onclick="tilbage('${tilbageFald}')">${ik('tilbage')} ${tilbageLabel||t('faelles.tilbage','Tilbage')}</button>
      <button class="knap kontur lille" onclick="${næsteAktion}">${næsteLabel} ${ik('pil')}</button>
    </div>
  </div>`;
}
/* Multi-valg-liste, samme visuelle sprog som Bilen/Pakkeliste — man trykker
   en ting for at markere den relevant, ikke for at "krydse den af". */
function valgListe(punkter, valgte, toggleFn){
  return `<div class="liste">
    ${punkter.map(p=>{
      const markeret = valgte.includes(p.id);
      return `<div class="liste-punkt" onclick="${toggleFn}('${p.id}')" style="cursor:pointer">
        <div class="tjekboks ${markeret?'markeret':''}"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
        <div class="navn">${esc(p.tekst)}${p.tip?`<div class="dæmpet" style="font-size:12.5px;margin-top:2px">${esc(p.tip)}</div>`:''}</div>
      </div>`;
    }).join('')}
  </div>`;
}
function toggleValg(arrNavn, id){
  if(!s.forberedelse) s.forberedelse = nyForberedelse();
  const arr = s.forberedelse[arrNavn] || (s.forberedelse[arrNavn]=[]);
  const i = arr.indexOf(id);
  if(i>=0) arr.splice(i,1); else arr.push(id);
  gem(); tegn();
}
function toggleSnackValg(id){ toggleValg('snackValg', id); }
function toggleMorgenValg(id){ toggleValg('morgenValg', id); }
/* Vælg alle / Fravælg alle over en emneliste (KN 4/9). Ét sted, så alle
   listerne opfører sig ens — og ordet følger listens tilstand: er alt valgt,
   er det eneste fornuftige greb at fravælge. Id'erne følger med i onclick som
   én streng adskilt af |, så hver liste kan sende sit eget udsnit uden at
   funktionen skal vide, hvor punkterne kom fra.
   'scenarie' bruges kun af madscenarierne: et punkt kan først nå pakkelisten,
   når selve scenariet ligger på turen — samme regel som i toggleBrugValg(). */
function vælgAlleLinje(arrNavn, punkter, scenarie){
  if(!punkter.length) return '';
  const valgte = (s.forberedelse && s.forberedelse[arrNavn]) || [];
  const alle = punkter.every(p=>valgte.includes(p.id));
  const ids = punkter.map(p=>p.id).join('|');
  return `<div class="vælg-alle">
    <button class="som-link" onclick="skiftAlleValg('${arrNavn}','${ids}'${scenarie?`,'${scenarie}'`:''})">${alle?t('faelles.fravaelgalle','Fravælg alle'):t('faelles.vaelgalle','Vælg alle')}</button>
  </div>`;
}
function skiftAlleValg(arrNavn, ids, scenarie){
  if(!s.forberedelse) s.forberedelse = nyForberedelse();
  const f = s.forberedelse;
  const liste = String(ids).split('|');
  const arr = f[arrNavn] || (f[arrNavn] = []);
  if(liste.every(id=>arr.includes(id))){
    f[arrNavn] = arr.filter(id=>!liste.includes(id));
  } else {
    liste.forEach(id=>{ if(!arr.includes(id)) arr.push(id); });
    if(scenarie && !(f.madValg||[]).includes(scenarie)) (f.madValg = f.madValg||[]).push(scenarie);
  }
  gem(); tegn();
}
/* Egne morgenpunkter er FORVALGT, første gang morgentrinnet åbnes på en tur
   (KN 4/9) — samme greb som forvælgBrug() i madscenarierne. Markøren
   f.morgenSet sørger for, at et punkt, man bevidst har fravalgt, ikke bliver
   sat på igen, næste gang siden tegnes. De FASTE punkter forvælges ikke; dem
   tager man selv stilling til, som man altid har gjort. */
function forvælgMorgen(){
  const f = s.forberedelse; if(!f || f.morgenSet) return;
  f.morgenSet = true;
  const arr = f.morgenValg || (f.morgenValg = []);
  egne('morgen').forEach(p=>{ if(!arr.includes(p.id)) arr.push(p.id); });
  gem();
}
/* Et enkelt punkt fra et madscenaries "Det skal I bruge" (30/8). Vælger man
   noget under et scenarie, man endnu ikke har tilføjet turen, tilføjes
   scenariet automatisk — ellers ville afkrydsningen ikke kunne nå pakkelisten,
   fordi madScenarieUdstyr() kun kigger på scenarier i f.madValg. */
function toggleBrugValg(scenarieId, punktId){
  if(!s.forberedelse) s.forberedelse = nyForberedelse();
  const f = s.forberedelse;
  const arr = f.brugValg || (f.brugValg = []);
  const i = arr.indexOf(punktId);
  if(i>=0) arr.splice(i,1);
  else {
    arr.push(punktId);
    if(!(f.madValg||[]).includes(scenarieId)) (f.madValg = f.madValg||[]).push(scenarieId);
  }
  gem(); tegn();
}

/* Forplejningens FØRSTE skærm (30/8). Mellemsiden med Tidsplan/Mad/Drikke er
   væk — fra overblikket lander man direkte her. Ruten hedder stadig 'mad', så
   sektionHeader/sektionFod, låsen i sektionFod og de øvrige call sites virker
   uændret; det er kun indholdet, der er skiftet ud. */
function skærmMadValg(){
  if(s.forberedelse && !s.forberedelse.set.mad){ s.forberedelse.set.mad = true; gem(); }
  const f = s.forberedelse || nyForberedelse();
  const valgte = f.madValg || [];
  $('indhold').innerHTML = `<div class="side anim">
    ${sektionHeader('mad')}
    <div class="kort guide-brød">
      <p>${t('mad.valgbrod','Måltidslogistik er en svær disciplin, når det kommer til arytmer. Derfor har vi lavet det, vi kalder et "arytmisk madscenarie": det samler det, I skal bruge, og giver jer vores bedste erfaringer med på vejen.')}</p>
    </div>
    <div class="sektion"><h3>${t('mad.scenarieoverskrift','Arytmiske madscenarier')}</h3></div>
    <div class="liste">
      ${MAD_VALG.map(p=>{
        const d = MAD_SCENARIE_DETALJER[p.id];
        const tilføjet = valgte.includes(p.id);
        /* Ingen tjekboks her (OD 30/8) — man skal ÅBNE scenariet og læse med,
           ikke krydse af på må og få. Mærket er det eneste, der viser, hvad
           man allerede har taget med. */
        return `<div class="liste-punkt" onclick="gåTil('mad-scenarie-${p.id}')" style="cursor:pointer">
          <span class="mad-nr">${d?d.nr:''}</span>
          <div class="navn">${esc(p.tekst)}</div>
          ${tilføjet?`<span class="bil-mærke">${ik('tjek')} Tilføjet</span>`:''}
          <span class="tjek-pil">${ik('pil')}</span>
        </div>`;
      }).join('')}
    </div>
    ${sektionFod('mad')}
  </div>`;
}
/* ---- Madscenarie-detalje. Rækkefølgen er OD's (30/8): teksten først, så
   tippet, og "Det skal I bruge" NEDERST — man skal have læst, hvad scenariet
   går ud på, før man tager stilling til grejet. Punkterne kan nu vælges
   enkeltvis, og man kan skrive sine egne til. ---- */
/* Punkterne er FORVALGT, første gang man åbner et scenarie (OD 31/8) — man
   fravælger det, man ikke skal bruge, i stedet for at samle listen op fra
   ingenting. Markøren f.brugSet husker, hvilke scenarier der er forvalgt, så
   et scenarie, hvor man bevidst har fjernet alt, ikke fyldes op igen næste gang
   siden tegnes. Selve scenariet lægges IKKE på turen her — det sker først, når
   man trykker "Tilføj og fortsæt planlægning". */
function forvælgBrug(id){
  const f = s.forberedelse; if(!f) return;
  const sat = f.brugSet || (f.brugSet = []);
  if(sat.includes(id)) return;
  sat.push(id);
  const d = MAD_SCENARIE_DETALJER[id];
  if(d){
    const arr = f.brugValg || (f.brugValg = []);
    d.brug.forEach(p=>{ if(!arr.includes(p.id)) arr.push(p.id); });
  }
  gem();
}
/* "Tilføj og fortsæt planlægning": nu lægges scenariet på turen, så det
   valgte kan nå pakkelisten, og man går videre til snacks. */
function tilføjScenarieOgVidere(id){
  if(!s.forberedelse) s.forberedelse = nyForberedelse();
  const f = s.forberedelse;
  if(!(f.madValg||[]).includes(id)) (f.madValg = f.madValg||[]).push(id);
  gem();
  gåTil('mad-snacks');
}
function skærmMadScenarie(id){
  const scenarie = MAD_VALG.find(x=>x.id===id);
  const d = MAD_SCENARIE_DETALJER[id];
  if(!scenarie || !d){ gåTil('mad'); return; }
  if(!s.forberedelse) s.forberedelse = nyForberedelse();
  forvælgBrug(id);
  const f = s.forberedelse;
  const valgte = f.brugValg || [];
  const egneListe = 'mad-'+id;
  const afsnit = tekst => (Array.isArray(tekst)?tekst:[tekst]).map(t=>`<p>${esc(t)}</p>`).join('');
  const brugRk = p => `
    <div class="liste-punkt" onclick="toggleBrugValg('${id}','${p.id}')" style="cursor:pointer">
      <div class="tjekboks ${valgte.includes(p.id)?'markeret':''}"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
      <div class="navn">${esc(p.tekst)}${p.tip?`<div class="dæmpet" style="font-size:12.5px;margin-top:2px">${esc(p.tip)}</div>`:''}</div>
    </div>`;
  $('indhold').innerHTML = `<div class="side anim">
    ${skærmTop(d.tagline, 'mad', d.nr+' · '+scenarie.tekst.toUpperCase())}
    <div class="kort guide-brød">${afsnit(d.intro)}</div>
    ${d.tip?`<div class="kort"><div class="etiket">${t('mad.tip','Tip')}</div>${afsnit(d.tip)}</div>`:''}
    <div class="sektion"><h3>${t('mad.saadangoervi','Sådan gør vi')}</h3></div>
    <div class="dæmpet" style="margin-bottom:14px">${afsnit(d.sådanGørVi)}</div>
    <div class="sektion"><h3>${t('mad.lilleekstra','Det lille ekstra')}</h3></div>
    <div class="dæmpet" style="margin-bottom:14px">${afsnit(d.lilleEkstra)}</div>
    ${d.efter?`<div class="sektion"><h3>${t('mad.eftermaaltidet','Efter måltidet')}</h3></div><div class="dæmpet" style="margin-bottom:14px">${afsnit(d.efter)}</div>`:''}
    <div class="sektion"><h3>${esc(d.brugTitel||t('mad.detskalibruge','Det skal I bruge'))}</h3></div>
    <p class="dæmpet" style="margin:0 0 6px">${t('mad.fravaelgbrod','Fravælg de punkter herunder, I ikke skal bruge, og tilføj nederst det, I gerne vil have med.')}</p>
    ${d.brugIntro?`<p class="dæmpet" style="margin:0 0 10px">${esc(d.brugIntro)}</p>`:''}
    ${vælgAlleLinje('brugValg', [...d.brug, ...egne(egneListe)], id)}
    <div class="liste">
      ${d.brug.map(brugRk).join('')}
      ${egne(egneListe).map(p=>egetBrugRække(id, p, valgte)).join('')}
      ${egetFeltRække(egneListe,t('mad.medbringeplads','Vi tager også med …'))}
    </div>
    ${madTrinFod('mad',t('mad.tilfoejfortsaet','Tilføj og fortsæt planlægning'),`tilføjScenarieOgVidere('${id}')`,t('mad.andetscenarie','Se et andet madscenarie'))}
  </div>`;
}
/* Et punkt man selv har skrevet under et scenarie. Samme tjekboks som de
   faste, plus et kryds til at slette det helt — det huskes ellers til næste
   tur ligesom de andre egne punkter. */
function egetBrugRække(scenarieId, p, valgte){
  return `<div class="liste-punkt" onclick="toggleBrugValg('${scenarieId}','${p.id}')" style="cursor:pointer">
    <div class="tjekboks ${valgte.includes(p.id)?'markeret':''}"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
    <div class="navn">${esc(p.tekst)}</div>
    <button class="eget-fjern" onclick="event.stopPropagation();fjernEgetPunkt('mad-${scenarieId}','${p.id}')" aria-label="${esc(t('faelles.fjernpunkt','Fjern punkt'))}">${ik('kryds')}</button>
  </div>`;
}
/* ---- Trin 2: Snacks og drikkevarer — ÉN liste (OD 30/8). De to grupper
   "Til turen"/"Til aftenen" er væk; det er alligevel én indkøbstur. ---- */
function skærmMadSnacks(){
  const f = s.forberedelse || nyForberedelse();
  const valgte = f.snackValg || [];
  const næsteMål = flerdagsTur() ? 'mad-morgen' : null;
  $('indhold').innerHTML = `<div class="side anim">
    ${madTrinTop(t('mad.snackstitel','Snacks og drikkevarer'))}
    <div class="kort guide-brød">
      <p>${t('mad.snacksbrod','Det absolut vigtigste på enhver tur: snacks og hygge.')}</p>
    </div>
    <div class="sektion"><h3>${t('mad.overveje','Det skal I overveje')}</h3></div>
    ${vælgAlleLinje('snackValg', SNACK_VALG.filter(p=>!p.del))}
    ${valgListe(SNACK_VALG.filter(p=>!p.del), valgte, 'toggleSnackValg')}
    <div class="sektion" style="margin-top:20px"><h3>${t('mad.hvisikkeplanlagt','Har I ikke planlagt mad, mangler I måske:')}</h3></div>
    ${vælgAlleLinje('snackValg', SNACK_VALG.filter(p=>p.del===2))}
    ${valgListe(SNACK_VALG.filter(p=>p.del===2), valgte, 'toggleSnackValg')}
    ${madTrinFod('mad', næsteMål?t('faelles.naeste','Næste'):t('faelles.faerdig','Færdig'), næsteMål?`gåTil('${næsteMål}')`:'forplejningFærdig()')}
  </div>`;
}
/* ---- Trin 3: Morgenmad (kun flerdages-ture) — rent informativt, ingen valg ---- */
function skærmMadMorgen(){
  const f = s.forberedelse || nyForberedelse();
  forvælgMorgen();
  const valgte = f.morgenValg || [];
  const afsnit = tekst => (Array.isArray(tekst)?tekst:[tekst]).map(t=>`<p>${esc(t)}</p>`).join('');
  const valgRk = p => `<div class="liste-punkt" onclick="toggleMorgenValg('${p.id}')" style="cursor:pointer">
    <div class="tjekboks ${valgte.includes(p.id)?'markeret':''}"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
    <div class="navn">${esc(p.tekst)}${p.tip?`<div class="dæmpet" style="font-size:12.5px;margin-top:2px">${esc(p.tip)}</div>`:''}</div>
  </div>`;
  $('indhold').innerHTML = `<div class="side anim">
    ${madTrinTop(t('mad.morgentitel','Til morgenen'))}
    <div class="kort guide-brød">
      <p>${t('mad.morgenbrod1','Tænk altid et måltid frem. Nogle gange er det om morgenen, at programmet for alvor starter. Andre gange kører vi videre — eller hjem.')}</p>
      <p>${t('mad.morgenbrod2','Derfor kan morgenmaden være alt fra ingenting til en kop kaffe eller en banan og et glas vand, indtil vi lander det næste sted.')}</p>
    </div>
    <div class="sektion"><h3>${t('mad.saadangoervi','Sådan gør vi')}</h3></div>
    <p class="dæmpet" style="margin-bottom:14px">${t('mad.morgensaadan','Vi elsker solopgange — og at putte os under dynen, mens bagagerummet står åbent og lukker naturen ind.')}</p>
    <div class="sektion"><h3>${t('mad.voreserfaring','Vores erfaring')}</h3></div>
    <div class="dæmpet" style="margin-bottom:14px">${afsnit([
      t('mad.morgenerfaring1','Morgener er meget rituelle og forskellige fra person til person. Derfor kan I selv tilføje det, I har brug for, i de åbne felter herover.'),
      t('mad.morgenerfaring2','Vi elsker god kaffe og morgenbrød, så vi finder oftest en bager eller en café i området.')
    ])}</div>
    <div class="sektion"><h3>${t('mad.lilleekstra','Det lille ekstra')}</h3></div>
    <div class="dæmpet" style="margin-bottom:20px">${afsnit([
      t('mad.morgenekstra1','Der er virkelig mange gode brunchsteder i Danmark.'),
      t('mad.morgenekstra2','Husk punktet Personligt, så I ikke skal på café med strithår og morgenånde.')
    ])}</div>
    <!-- Huskelisten står NEDERST og teksten over (OD 31/8) — samme rækkefølge
         som madscenarierne fik 30/8: læs først, tag stilling bagefter. -->
    <div class="sektion"><h3>${t('mad.taenkover','Tænk over disse ting')}</h3></div>
    ${vælgAlleLinje('morgenValg', [...MORGEN_VALG, ...egne('morgen')])}
    <div class="liste">
      ${MORGEN_VALG.map(valgRk).join('')}
      ${egne('morgen').map(p=>egetMorgenRække(p, valgte)).join('')}
      ${egetFeltRække('morgen',t('mad.egetpunktplads','Skriv jeres eget punkt'))}
    </div>
    ${madTrinFod('mad-snacks',t('faelles.faerdig','Færdig'),'forplejningFærdig()')}
  </div>`;
}
/* Sidste trin i forplejningen. Det man har valgt, lander på pakkelisten — det
   skal siges tydeligt, ikke bare ske. Planlægger man i skjul (gave), kom man
   fra invitationens egen liste og skal tilbage dertil; ellers hjem til
   overblikket. */
function forplejningFærdig(){
  const f = s.forberedelse;
  const tilGave = f && f.invType==='gave' && f.invStatus!=='sendt';
  if(tilGave){
    tilbageTil('invitation');
    infoModal('Tingene er nu føjet til jeres pakkeliste.', 'Videre');
    return;
  }
  /* Vi bliver stående på forplejningen bag modalen, indtil man har valgt vej —
     før hoppede appen hjem til overblikket og fortalte det bagefter. */
  valgModal('Forplejning på din arytme er nu planlagt. Emnerne er tilføjet pakkelisten. Du kan nu fortsætte planlægningen omkring bilen.', [
    { tekst:'Til overblik',        aktion:()=>tilbageTil('hjem') },
    { tekst:'Fortsæt planlægning', primær:true, aktion:()=>gåTil('bilen') }
  ]);
}

/* =============================================================
   5 · PAKKE — personlige ting
   ============================================================= */
/* Ingen strøget-streg her (KN 27/8): dette er stadig planlægning — punktet
   tilføjes turen, når det vælges. Det krydsede/strøgede hører kun til på
   "Klar til at pakke" (skærmKlarListe), som er en helt anden liste. */
function pakkeRække(p, tjek){
  const markeret = tjek.includes(p.id);
  return `
  <div class="liste-punkt" onclick="pakkeTjek('${p.id}')" style="cursor:pointer">
    <div class="tjekboks ${markeret?'markeret':''}"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
    <div class="navn">${esc(p.tekst)}${p.tip?`<div class="dæmpet" style="font-size:12.5px;margin-top:2px">${esc(p.tip)}</div>`:''}</div>
  </div>`;
}
/* Egne punkter: hver gang man har skrevet ét, dukker et nyt tomt felt op —
   så listen kan vokse uden at man skal trykke "tilføj felt" først.
   14/8: virker nu på tre lister (pakke · hygge · hund) og gemmer i
   s.egneTing, så det skrevne ligger der til næste tur. Udkastet i feltet
   holdes derimod i en almindelig variabel: det er ren visningstilstand,
   der kun skal overleve en gentegning, ikke en genstart. */
let egneUdkast = {};
/* Id'et kom før fra en tæller, der startede på Date.now() og aldrig blev
   gemt. På én telefon holder det. To telefoner, der starter appen i det samme
   sekund, ville lave de samme id'er til vidt forskellige punkter — og når de
   to skal dele en pakkeliste, er det præcis dét, der går galt. M.nytId()
   lægger fire tilfældige tegn efter tiden. */
/* Hvilken valgliste et selvskrevet punkt hører hjemme i. Bruges til at
   markere det som VALGT med det samme (OD 30/8: "lige nu skal jeg trykke igen
   for at aktivere det") — at skrive noget ind ER at vælge det.
   'morgen' kom til 4/9: egne morgenpunkter følger nu morgenValg som alle de
   andre lister. Før tog morgenUdstyr() dem med ubetinget, og så kunne man
   ikke lade ét punkt blive hjemme på en enkelt tur uden at slette det helt. */
function egenValgliste(liste){
  if(liste.startsWith('mad-')) return 'brugValg';
  if(liste === 'hygge' || liste === 'need') return 'bilHuske';
  if(liste === 'morgen') return 'morgenValg';
  if(liste === 'pakke' || liste === 'hund') return 'pakkeTjek';
  return null;
}
function tilføjEgetPunkt(liste, værdi){
  const tekst = (værdi||'').trim();
  if(!tekst) return;
  if(!s.egneTing) s.egneTing = tommeEgneTing();
  if(!s.egneTing[liste]) s.egneTing[liste] = [];
  // Samme punkt to gange hjælper ingen — og det sker, når man trykker Enter
  // og "Tilføj" lige efter hinanden.
  // Uden forskel på mellemrum (5/10): "Pynte puder" og "Pyntepuder" er det samme
  // punkt — samme regel som afdublér() i sync.js.
  const ens = x => String(x||'').toLowerCase().replace(/\s+/g,'');
  let punkt = s.egneTing[liste].find(p=>ens(p.tekst)===ens(tekst));
  if(!punkt){
    punkt = { id:M.nytId('eget-'+liste+'-'), tekst };
    s.egneTing[liste].push(punkt);
  }
  // ... og markér det som valgt med det samme.
  const mål = egenValgliste(liste);
  const f = s.forberedelse;
  if(mål && f){
    const arr = f[mål] || (f[mål] = []);
    if(!arr.includes(punkt.id)) arr.push(punkt.id);
    // Et scenarie-punkt kan kun nå pakkelisten, hvis scenariet selv er med.
    if(mål==='brugValg'){
      const sid = liste.slice(4);
      if(!(f.madValg||[]).includes(sid)) (f.madValg = f.madValg||[]).push(sid);
    }
  }
  egneUdkast[liste] = '';
  gem(); tegn();
  const felt = $('eget-nyt-'+liste); if(felt) felt.focus();
}
function fjernEgetPunkt(liste, id){
  if(s.egneTing && s.egneTing[liste]) s.egneTing[liste] = s.egneTing[liste].filter(p=>p.id!==id);
  const f = s.forberedelse;
  if(f){
    f.pakkeTjek = (f.pakkeTjek||[]).filter(x=>x!==id);
    f.bilHuske  = (f.bilHuske||[]).filter(x=>x!==id);
    f.brugValg  = (f.brugValg||[]).filter(x=>x!==id);
    f.morgenValg = (f.morgenValg||[]).filter(x=>x!==id);
    /* klarTjek gemmer id'et PRÆFIKSET (p-, b-, ms-, mo-), så et rent
       !==id-filter ramte aldrig — punktet blev slettet, men lå og talte med
       som "pakket" på klar-listen. */
    const præfiks = ['p-','b-','ms-','mo-','s-'].map(x=>x+id);
    f.klarTjek  = (f.klarTjek||[]).filter(x=>!præfiks.includes(x));
  }
  gem(); tegn();
}
/* Rækken med det tomme felt. Ét sted, så pakkelisten, hyggelisten og hunden
   opfører sig ens — det var i forvejen den eneste rigtige måde at tilføje
   noget på i appen. */
function egetFeltRække(liste, pladsholder){
  return `<div class="liste-punkt eget-nyt-række">
    <span style="color:var(--rav);flex-shrink:0">${ik('plus')}</span>
    <input id="eget-nyt-${liste}" class="eget-felt" type="text" placeholder="${esc(pladsholder)}"
           value="${esc(egneUdkast[liste]||'')}"
           oninput="egneUdkast['${liste}']=this.value"
           onkeydown="if(event.key==='Enter'){event.preventDefault();tilføjEgetPunkt('${liste}',this.value)}">
    <button class="eget-tilføj" onclick="tilføjEgetPunkt('${liste}',$('eget-nyt-${liste}').value)">${t('faelles.tilfoej','Tilføj')}</button>
  </div>`;
}
/* Én række på pakkelisten — også for dem, man selv har skrevet. Egne punkter
   har et kryds til at fjerne dem igen; appens egne har ikke. */
function egenRække(liste, p, tjek){
  return `<div class="liste-punkt">
    <div class="tjekboks ${tjek.includes(p.id)?'markeret':''}" onclick="pakkeTjek('${p.id}')" style="cursor:pointer"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
    <div class="navn" onclick="pakkeTjek('${p.id}')" style="cursor:pointer">${esc(p.tekst)}</div>
    <button class="eget-fjern" onclick="fjernEgetPunkt('${liste}','${p.id}')" aria-label="${esc(t('faelles.fjernpunkt','Fjern punkt'))}">${ik('kryds')}</button>
  </div>`;
}
/* Samme egne-punkter-mekanik som pakke/hygge/hund. Punktet har nu sin egen
   tjekboks (KN 4/9): appen husker det fra tur til tur og sætter det på igen —
   men man skal kunne fravælge det på DENNE tur uden at miste det. Krydset er
   stadig det eneste, der får appen til at glemme punktet helt. */
function egetMorgenRække(p, valgte){
  const markeret = (valgte||[]).includes(p.id);
  return `<div class="liste-punkt" onclick="toggleMorgenValg('${p.id}')" style="cursor:pointer">
    <div class="tjekboks ${markeret?'markeret':''}"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
    <div class="navn">${esc(p.tekst)}</div>
    <button class="eget-fjern" onclick="event.stopPropagation();fjernEgetPunkt('morgen','${p.id}')" aria-label="${esc(t('faelles.fjernpunkt','Fjern punkt'))}">${ik('kryds')}</button>
  </div>`;
}
function sætHundMed(på){
  if(!s.forberedelse) s.forberedelse = nyForberedelse();
  s.forberedelse.hundMed = på;
  /* Slår man hunden fra igen, skal dens afkrydsninger ikke blive hængende og
     tælle med i "6 af 6 pakket". */
  if(!på){
    const hundeId = new Set([...HUND_PUNKTER, ...egne('hund')].map(p=>p.id));
    s.forberedelse.pakkeTjek = (s.forberedelse.pakkeTjek||[]).filter(x=>!hundeId.has(x));
  }
  gem(); tegn();
}
function skærmPakke(){
  const f = s.forberedelse || nyForberedelse();
  const tjek = f.pakkeTjek || [];
  const hund = [...HUND_PUNKTER, ...egne('hund')];
  const hundKlaret = hund.filter(p=>tjek.includes(p.id)).length;
  $('indhold').innerHTML = `<div class="side anim">
    ${sektionHeader('pakke')}
    <div class="kort guide-brød">
      <p>${t('pakke.brod1','Når man tager på arytme i bilen, gælder det om at pakke så lidt og så let som muligt — uden at glemme det, man har brug for.')}</p>
      <p>${t('pakke.brod2','Herunder er de ting, der er vigtige på turen. Kryds dem af, efterhånden som de er pakket.')}</p>
      <p class="citat" style="margin-bottom:0">${t('pakke.brod3','Obs: Giver du arytmen som gave, kommer de personlige punkter også på din ledsagers huskeliste.')}</p>
    </div>
    ${vælgAlleLinje('pakkeTjek', [...PAKKE_PUNKTER, ...egne('pakke')])}
    <div class="liste">
      ${PAKKE_PUNKTER.map(p=>pakkeRække(p,tjek)).join('')}
      ${egne('pakke').map(p=>egenRække('pakke',p,tjek)).join('')}
      ${egetFeltRække('pakke',t('pakke.egetplads','Skriv dit eget punkt'))}
    </div>

    <!-- Hunden (OD 13/8): egen foldbar rubrik, så den ikke fylder for dem,
         der ikke har hund med. Punkterne tæller først med, når den er slået til.
         OD 4/10: "Vi har hund med" er overskriften, listen er huskelisten. -->
    <div class="sektion" style="margin-top:22px"><h3>${t('pakke.hundmed','Vi har hund med')}</h3></div>
    <div class="liste">
      <div class="liste-punkt bil-emne" onclick="sætHundMed(${f.hundMed?'false':'true'})" style="cursor:pointer">
        <span style="color:var(--rav);flex-shrink:0">${ik('hund')}</span>
        <div class="navn">${t('pakke.hundliste','Huskeliste til hunden')}
          <div class="dæmpet" style="font-size:12.5px;margin-top:2px">${f.hundMed
            ? t('pakke.hundvalgt','{antal} af {ialt} valgt',{antal:hundKlaret,ialt:hund.length})
            : t('pakke.hundtryk','Tryk for at føje hundens ting til listen')}</div>
        </div>
        <span class="bil-pil ${f.hundMed?'åben':''}">${ik('pil')}</span>
      </div>
      ${f.hundMed ? `
      <div class="bil-krop" style="padding-bottom:0;border-bottom:none">
        ${vælgAlleLinje('pakkeTjek', [...HUND_PUNKTER, ...egne('hund')])}
        ${HUND_PUNKTER.map(p=>pakkeRække(p,tjek)).join('')}
        ${egne('hund').map(p=>egenRække('hund',p,tjek)).join('')}
        ${egetFeltRække('hund',t('pakke.hundplads','Andet til hunden'))}
      </div>` : ''}
    </div>

    ${sektionFod('pakke')}
  </div>`;
}
function pakkeTjek(id){
  if(!s.forberedelse) s.forberedelse = nyForberedelse();
  const t = s.forberedelse.pakkeTjek;
  const i = t.indexOf(id);
  if(i>=0) t.splice(i,1); else t.push(id);
  gem(); tegn();
}

/* =============================================================
   LOG SPONTAN TUR / ANMELDELSE — én pop-up, to indgange
   =============================================================
   Fuldskærms-anmeldelsen er væk (KN 4/9). Den lå bag knappen "Vil du gemme
   din tur", og den knap findes ikke længere — turene logges selv. Tilbage er
   ét lille skema med dato, sted og de tre spørgsmål, og det bruges to steder:

     logSpontanModal()    — turen I bare tog, skrevet ind bagefter (Arytme log)
     logSpontanModal(id)  — anmeld eller ret turen med det id (Dine arytmer)

   Kladden lever i en almindelig variabel og ikke i s: den skal overleve en
   gentegning af selve pop-uppen, ikke en genstart af appen. */
let spontanKladde = null;
/* Én afholdt tur, slået op på sit id. Turene blev før adresseret med deres
   plads i arrayet — læg en tur ind foran, og alle tal peger ét sted forkert.
   Med to telefoner ville det flette to menneskers minder sammen. */
function turMedId(id){
  return s.ture.find(t=>t.id===id) || null;
}
function logSpontanModal(id){
  const gammel = document.getElementById('spontan-modal');
  if(gammel) gammel.remove();
  const redigerer = typeof id === 'string' && !!id;
  const t = redigerer ? turMedId(id) : null;
  if(redigerer && !t) return;
  spontanKladde = t
    ? { id, dato: t.dato || '', sted: t.sted || '',
        destination: (t.score && t.score.destination) || 0,
        komfort: (t.score && t.score.komfort) || 0,
        app: (t.score && t.score.app) || 0,
        hygge: (t.score && t.score.hygge) || 0,
        kommentar: t.kommentar || '', godt: t.godt || '', bedre: t.bedre || '' }
    : { id: null, dato: new Date().toISOString().slice(0,10), sted: '',
        destination: 0, komfort: 0, app: 0, hygge: 0, kommentar: '', godt: '', bedre: '' };
  const div = document.createElement('div');
  div.id = 'spontan-modal';
  div.className = 'modal-bag';
  div.innerHTML = '<div class="modal-kort spontan-kort" id="spontan-kort"></div>';
  document.body.appendChild(div);
  div.addEventListener('click', e => { if(e.target === div) lukSpontanModal(); });
  tegnSpontanModal();
}
function lukSpontanModal(){
  const div = document.getElementById('spontan-modal');
  if(div) div.remove();
  spontanKladde = null;
}
/* Tekstfelterne gemmer UDEN gentegning — ellers mister man markøren midt i en
   sætning (samme grund som gemMinde() i loggen). Prikkerne skal derimod tegnes
   om, for det er dem, der viser svaret. */
function spontanFelt(felt, værdi){ if(spontanKladde) spontanKladde[felt] = værdi; }
function spontanBedøm(felt, tal){ if(spontanKladde){ spontanKladde[felt] = tal; tegnSpontanModal(); } }
function tegnSpontanModal(){
  const kort = document.getElementById('spontan-kort');
  const k = spontanKladde;
  if(!kort || !k) return;
  /* Stjerner, ikke prikker (KN 5/10). Knappen er stadig ét tal, så en
     skærmlæser hører "3 af 5" og ikke fem gange "stjerne". */
  const bedøm = (felt, tekst) => `
    <div class="bedøm-række"><span style="font-size:14px;flex:1">${tekst}</span>
      <div class="stjerne-valg" role="group" aria-label="${esc(tekst)}">${[1,2,3,4,5].map(tal =>
        `<button class="${k[felt] >= tal ? 'valgt' : ''}" aria-label="${esc(t('destination.stjernearia','{n} af 5 stjerner',{n:tal}))}" aria-pressed="${k[felt] === tal}" onclick="spontanBedøm('${felt}',${tal})">★</button>`).join('')}
      </div>
    </div>`;
  kort.innerHTML = `
    <div class="etiket">${k.id === null ? t('faelles.logspontan','Log en spontan tur') : t('turen.anmeldturen','Anmeld turen')}</div>
    <p style="margin:6px 0 4px">${k.id === null
      ? t('loggen.spontanbrod','Turen, I bare tog. Skriv den ind, så tæller den med i året.')
      : t('loggen.anmeldbrod','Anmeldelsen er kun til jer selv — brug den, når I planlægger de næste ture.')}</p>
    <label class="felt-etiket">${t('loggen.dato','Dato')}</label>
    <input type="date" value="${k.dato}" onchange="spontanFelt('dato',this.value)">
    <label class="felt-etiket">${t('loggen.destination','Destination')}</label>
    <input type="text" placeholder="${esc(t('loggen.stedplads','Hvor kørte I hen?'))}" value="${esc(k.sted)}" oninput="spontanFelt('sted',this.value)">
    <div style="border-top:1px solid var(--linje);margin:18px 0 0"></div>
    ${bedøm('destination',t('loggen.spmdestination','Hvor god var destinationen?'))}
    ${bedøm('komfort',t('loggen.spmkomfort','Hvor god var komforten?'))}
    ${bedøm('hygge',t('loggen.spmhygge','Hvor hyggelig var turen for jer?'))}
    <!-- To felter i stedet for én kommentar (KN og OD 5/10). En kommentar
         skrevet før står urørt på turen og vises stadig på kortet. -->
    <label class="felt-etiket">${t('loggen.godt','Hvad var godt?')}</label>
    <textarea placeholder="${esc(t('loggen.godtplads','Fx udsigten, roen, kaffen'))}" oninput="spontanFelt('godt',this.value)">${esc(k.godt)}</textarea>
    <label class="felt-etiket">${t('loggen.bedre','Hvad kunne være bedre?')}</label>
    <textarea placeholder="${esc(t('loggen.bedreplads','Fx mere læ, eller tidligere afsted'))}" oninput="spontanFelt('bedre',this.value)">${esc(k.bedre)}</textarea>
    <div class="modal-knapper">
      <button class="knap kontur bred" onclick="lukSpontanModal()">${t('faelles.fortryd','Fortryd')}</button>
      <button class="knap primær bred" onclick="gemSpontanTur()">${t('faelles.gem','Gem')}</button>
    </div>`;
}
function gemSpontanTur(){
  const k = spontanKladde;
  if(!k) return;
  if(!k.dato){ flash(t('loggen.manglerdato','Vælg en dato for turen.'), 'klokke'); return; }
  /* `app` spørges der ikke om mere, men et gammelt svar sendes uændret med —
     ellers ville en rettet hygge slette det på serveren. */
  const harScore = !!(k.destination || k.komfort || k.hygge || k.app);
  const ny = {
    sted: (k.sted || '').trim() || 'Spontan tur',
    dato: k.dato,
    score: harScore ? { destination:k.destination, komfort:k.komfort, app:k.app, hygge:k.hygge } : null,
    kommentar: (k.kommentar || '').trim(),
    godt: (k.godt || '').trim(),
    bedre: (k.bedre || '').trim()
  };
  const førstegang = k.id === null;
  if(førstegang){
    s.ture.unshift({ id: M.nytId('t'), ...ny, minde: '', plan: null });
  } else {
    // minde og plan er turens egne — de må ikke ryge, fordi man retter en score
    const tur = turMedId(k.id);
    if(tur) Object.assign(tur, ny);
  }
  gem(); lukSpontanModal();
  nulstilHistorik(); gåTil('log');
  flash(førstegang ? 'Turen er logget.' : 'Anmeldelsen er gemt.', 'tjek');
}

/* Det man selv skriver om turen bagefter — "bryllupsdag i solen", "alt
   kiksede men fantastisk udsigt" (OD 30/8). Gemmes pr. tur i loggen og kan
   rettes når som helst. */
function gemMinde(id, værdi){
  const t = turMedId(id);
  if(!t) return;
  t.minde = værdi;
  gem();   // ingen tegn(): så mister feltet fokus midt i en sætning
}
/* Gentag tur: bygger en ny forberedelse ud fra det, turen bestod af, og
   sender brugeren gennem flowet igen — nu med mulighed for at rette.
   Datoen sættes IKKE, så man selv vælger hvornår. Ture logget før 30/8 har
   intet snapshot og får ingen knap. */
function gentagTur(id){
  const t = turMedId(id);
  if(!t || !t.plan){ flash('Denne tur blev gemt, før appen kunne gentage ture.', 'klokke'); return; }
  if(s.forberedelse){
    bekræft('Du har allerede en tur i gang. Skal den erstattes af denne?', ()=>startGentagelse(t));
    return;
  }
  startGentagelse(t);
}
function startGentagelse(t){
  s.forberedelse = nyForberedelse({ ...t.plan, fase:2 });
  gem(); nulstilHistorik(); gåTil('hjem');
  flash('Turen er hentet frem igen — ret det, I vil have anderledes.', 'tjek');
}

/* =============================================================
   LOG
   ============================================================= */
function bølge(n){ return `<span class="bølger">${'●'.repeat(n||0)}${'○'.repeat(5-(n||0))}</span>`; }
/* Året som et ur: hver afholdt tur er en prik dér, hvor den ligger på årets
   runde. Hjulet bor nu i loggens header oven på hero-scenen (KN 4/9) — før
   fyldte det et helt kort midt i listen. Derfor lyse streger på mørk bund, og
   diameteren gives med som argument i stedet for at være låst til 232 px. */
/* Regnereglerne for "er turen klar" bor i forplejningKlar(), bilenKlar() og
   planTrinKlaret() — og de læser alle sammen s.forberedelse. For at kunne vise
   status på en tur, man IKKE sidder i, peger vi kort aktivId derhen og stiller
   det samme spørgsmål. Det er med vilje frem for at skrive reglerne af én gang
   til: to sæt regler ville drive fra hinanden, første gang OD ændrer en af dem. */
function medTur(a, fn){
  const før = s.aktivId;
  s.aktivId = a.id;
  try { return fn(); } finally { s.aktivId = før; }
}
/* ÉN kilde til, hvor langt turen er (KN 6/9).
   Før havde kortet i loggen TO: linjen spurgte klarKlaret() ("Klar til at tage
   afsted"), mens knappen spurgte planTrinKlaret() ("Færdiggør planlægning").
   De to kan være uenige — pakkelisten bygges af det, man HAR valgt, mens
   planTrinKlaret() kræver, at alle tre planlægningstrin er hakket helt af. Så
   kunne der stå "Klar til at tage afsted" over en knap, der bad om at få
   planlægningen færdiggjort.

   Rækkefølgen er nu en trappe, man ikke kan gå baglæns på:
     alt pakket        → planlægningen er per definition også ovre
     f.planlagt        → man har selv trykket "Afslut planlægning"
     planTrinKlaret()  → alle tre trin er hakket af hver for sig */
function turStatus(a){
  return medTur(a, ()=>{
    const items = tjeklisteData();
    const pakketFærdig = klarKlaret();
    return {
      klaret: items.filter(i=>i.klar).length,
      total: items.length,
      færdig: pakketFærdig || !!a.planlagt || planTrinKlaret(),
      /* Pakkelisten krydses af i klarTjek — ikke i pakkeTjek, som er
         planlægningens Personligt-liste. De to blev forvekslet her og i
         pakkeOpsummering(), så tælleren viste "6 af 19", mens selve
         pakkelisten sagde "0 af 19". */
      pakket: pakkeListe().filter(p=>(a.klarTjek||[]).includes(p.id)).length,
      pakkeTotal: pakkeListe().length,
      // alt pakket → turen er kørt, og kan gemmes i loggen (OD 31/8)
      pakketFærdig
    };
  });
}
function åbnTurplan(id){ vælgTur(id); gåTil('turplan'); }
function fortsætPlanlægning(id){ vælgTur(id); gåTil('hjem'); }
function åbnPakkeliste(id){ vælgTur(id); gåTil('klar-pakke'); }
/* En tur, der intet indeholder endnu. Datoen tæller ikke med: den sættes
   automatisk til i dag, når turen oprettes, så den siger intet om, hvorvidt
   nogen har taget stilling til noget. */
function tomKladde(a){
  const set = a.set || {};
  return !a.destination && !set.mad && !set.bilen && !a.invType
    && !(a.pakkeTjek||[]).length && !(a.klarTjek||[]).length;
}
/* Ny tur oprettes både herfra og fra forsiden (OD 31/8). Den forrige bliver
   liggende som kommende tur — det er hele pointen.

   Men: ligger der allerede en tom kladde, fortsætter vi i DEN. Ellers ville
   tre tryk på knappen give tre identiske tomme ture i listen, og der er ingen
   sletteknap på kortene (turen annulleres inde i den selv). Med flere ture
   ville listen stille og roligt fyldes med tomme rækker, man ikke kan komme
   af med. */
function nyArytme(){
  const tom = s.arytmer.find(tomKladde);
  if(tom){ vælgTur(tom.id); gåTil('turdato'); return; }
  s.forberedelse = nyForberedelse();
  gem(); nulstilHistorik(); gåTil('turdato');
}
/* "Næste arytme" hænger på DATOEN, ikke på hvilken tur man sidst åbnede.
   De to er ikke det samme: åbner man den tur, der ligger om tre uger, er den
   stadig ikke den næste — og et mærkat, der flytter sig efter, hvor man sidst
   trykkede, fortæller ingenting. */
function kommendeKort(a){
  const st = turStatus(a);
  const dage = dageTil(a.dato);
  const sted = a.destination ? esc(a.destination.navn) : 'Sted ikke valgt endnu';
  const næste = næsteArytme();
  const nu = !!(næste && næste.id === a.id);
  /* Ugedagen med stort forbogstav (KN 5/10: "Fredag med stort"). */
  const stort = x => x ? x.charAt(0).toUpperCase() + x.slice(1) : x;
  const naar = a.dato
    ? stort(pænDato(a.dato)) + ((dage!==null && dage>=0) ? ' · ' + (dage===0?'i dag':dage===1?'i morgen':'om '+dage+' dage') : '')
    : 'Ingen dato endnu';
  /* "Planlagt · 0 af 52 pakket" er væk (KN 5/10). Når planen er lagt, står der
     ingen linje; pakningen ses på pakkelisten. */
  const linje = st.pakketFærdig
    ? 'Klar til at tage afsted'
    : st.færdig
      ? ''
      : 'Planlægningen er i gang · ' + st.klaret + ' af ' + st.total + ' på plads';

  /* Linjen om deling tegnes FØR kortet, fordi mærkatet ved overskriften
     afhænger af, om den siger noget (KN 17/9).

     Mærkatet "OLIIVIA" og sætningen "Oliivia har delt denne tur med dig"
     er det SAMME svar på det samme spørgsmål — hvis tur er det her? To
     gange på ét kort er ikke dobbelt tydeligt, det er bare to ting at
     læse. Sætningen vinder: den siger også, hvad der er SKET, hvor
     mærkatet kun siger et navn.

     Mærkatet bliver derfor kun stående, når sætningen ikke er der — og
     det kan den ikke være, hvis rejsemakkeren ikke er aktiv længere,
     mens hendes tur stadig ligger i listen. Så ville kortet ellers stå
     helt uden at sige, hvis det er.

     Paa AFHOLDTE ture staar maerkatet uroert: dér er der ingen saetning
     til at sige det i stedet. */
  const deler = delerLinje(a);
  return `
    <div class="tur-kort${nu?' aryt-nu':''}">
      ${nu?'<div class="etiket" style="margin-bottom:6px">Næste arytme</div>':''}
      <div style="display:flex;align-items:flex-start;gap:10px">
        <h3 style="flex:1">${sted}</h3>${deler ? '' : deresMærkat('ture', a.id)}
        <!-- Kun paa ens EGEN tur. En rejsemakkers kan ikke slettes herfra,
             og en knap, der ikke kan virke, skal ikke staa der. -->
        ${fremmedRække('ture', a.id) ? '' : `<button class="slet-tur" onclick="event.stopPropagation();sletTurSpørg('${a.id}')"
          aria-label="${esc(t('loggen.sletaria','Slet turen til {sted}',{sted}))}">${ik('skrald')}</button>`}
      </div>
      <div class="dato" style="margin-top:4px">${naar}</div>
      ${linje ? `<div class="dæmpet" style="font-size:13px;margin-top:6px">${linje}</div>` : ''}
      ${gæsteLinje(a)}
      <!-- Er alt pakket, står de to knapper OVER hinanden (KN 6/9): "Send
           destination til køretøj" er fire ord og brækkede over tre linjer i
           en halv knapbredde. Det er turens sidste greb — det skal have en
           hel bredde. -->
      <div class="aryt-knapper${st.pakketFærdig?' stablet':''}">
        <button class="knap kontur bred lille" onclick="åbnTurplan('${a.id}')">${ik('bog')} ${t('loggen.seretturplan','Se og ret turplanen')}</button>
        <!-- Tre tilstande, samme trappe som linjen ovenfor (KN 6/9).
             Er pakkelisten fuldt krydset af, er der intet tilbage at pakke —
             så bliver knappen til det NÆSTE greb: at sende adressen til
             bilen. Pakkelisten er der stadig; den ligger nu på turplanen,
             hvor turens detaljer hører hjemme. -->
        ${st.pakketFærdig
          ? `<button class="knap primær bred lille" onclick="sendTilKøretøj('${a.id}')">${ik('del')} Send destination til køretøj</button>`
          : st.færdig
            ? `<button class="knap primær bred lille" onclick="åbnPakkeliste('${a.id}')">${ik('tjek')} Hent pakkeliste</button>`
            : `<button class="knap primær bred lille" onclick="fortsætPlanlægning('${a.id}')">${ik('pil')} Færdiggør planlægning</button>`}
      </div>
      ${deler}
      ${gæsteKnap(a)}
    </div>`;
}

/* SLET TUREN (KN 15/9: "der skal vaere en slet tur knap maaske bare et
   skraldespandsikon").

   EN REJSEMAKKERS TUR KAN IKKE SLETTES HERFRA, og det er ikke en
   begrænsning, jeg har fundet på: det står som et åbent punkt i 0012.
   `sletTur()` afviser allerede en fremmed række, men gjorde det TAVST —
   knappen ville se ud til at virke og så ikke gøre noget. Nu siger den det
   i stedet, og ikonet står slet ikke på en tur, der ikke er ens egen.

   Grunden er værd at kende: databasens politik siger "kun ejeren sletter".
   Sletter man alligevel, afviser RLS ikke — den FILTRERER, så serveren
   sletter nul rækker og svarer pænt. Udbakken tømmes, og ved næste hentning
   står turen der igen. Ingen data går tabt, men det ligner en fejl.

   DER SPØRGES FØRST. Det er en énvejsdør: turen ryger fra alle enheder, og
   pakkelistens flueben følger ikke med tilbage. */
/* SLET EN AFHOLDT TUR (KN 15/9).

   Samme regel som de kommende: kun sine egne. `fremmedRække` er den samme
   kilde — sync.js noterer hver hentet række, der har en anden ejer.

   ANMELDELSEN FØLGER MED, og det er databasen, der sørger for det:
   `anmeldelser_afholdt_id_fkey` er ON DELETE CASCADE (kontrolleret 15/9).
   Appen skal altså ikke slette to ting og huske rækkefølgen — den sletter
   turen, og anmeldelsen følger. Lokalt ligger anmeldelsen alligevel INDE i
   turen (`t.score`), så de to steder er enige.

   MINDET ER DET, DER GØR DEN ANDERLEDES END EN KOMMENDE TUR. En kommende
   tur er en plan; en afholdt er en erindring, og der kan stå noget i "Hvad
   skal I huske fra turen?", som ikke findes andre steder. Derfor nævner
   spørgsmålet det, når der ER skrevet noget. */
function sletAfholdt(id){
  if(fremmedRække('afholdte_ture', id)) return false;
  const i = (s.ture||[]).findIndex(x => x && x.id === id);
  if(i < 0) return false;
  s.ture.splice(i, 1);
  gem();
  return true;
}

function sletAfholdtSpørg(id){
  const tur = (s.ture||[]).find(x => x && x.id === id);
  if(!tur) return;
  if(fremmedRække('afholdte_ture', id)){
    const navn = partnerNavn().split(' ')[0];
    flash(t('loggen.kunejeren','Turen er {navn}s. Den kan kun slettes fra {navn}s telefon.',{navn}), 'kryds');
    return;
  }
  const sted = tur.sted || t('loggen.turen','turen');
  const harMinde = !!(tur.minde && tur.minde.trim());
  bekræft(harMinde
      ? t('loggen.sletafholdtminde','Slet den afholdte tur til <b>{sted}</b>? Det, I skrev om turen, forsvinder med den — og den kan ikke hentes tilbage.',{sted})
      : t('loggen.sletafholdtspm','Slet den afholdte tur til <b>{sted}</b>? Den forsvinder fra alle jeres enheder og kan ikke hentes tilbage.',{sted}),
    ()=>{
      if(!sletAfholdt(id)) return;
      tegn();
      flash(t('loggen.sletdone','Turen er slettet.'), 'kryds');
    });
}

/* Knappen ligger i sin EGEN funktion, og det er ikke pynt.

   De afholdte ture tegnes i `afholdte.map(t => ...)`, hvor løkkevariablen
   hedder `t` og dermed SKYGGER for tekstfunktionen `t()`. Det er præcis
   det, `vaerktoej/tjek-tekstkald.mjs` holder øje med — og det er også
   grunden til, at netop det korts tekster aldrig er blevet trukket ud.
   Herude er `t` sig selv igen. */
function sletKnapAfholdt(tur){
  if(!tur || !tur.id || fremmedRække('afholdte_ture', tur.id)) return '';
  return '<button class="slet-tur" onclick="event.stopPropagation();sletAfholdtSpørg(\'' + tur.id + '\')"'
    + ' aria-label="' + esc(t('loggen.sletaria','Slet turen til {sted}',{sted:tur.sted||''})) + '">'
    + ik('skrald') + '</button>';
}

function sletTurSpørg(id){
  const a = (s.arytmer||[]).find(x => x && x.id === id);
  if(!a) return;
  if(fremmedRække('ture', id)){
    const navn = partnerNavn().split(' ')[0];
    flash(t('loggen.kunejeren','Turen er {navn}s. Den kan kun slettes fra {navn}s telefon.',{navn}), 'kryds');
    return;
  }
  const sted = a.destination ? a.destination.navn : t('loggen.turen','turen');
  bekræft(t('loggen.sletspm','Slet turen til <b>{sted}</b>? Den forsvinder fra alle jeres enheder og kan ikke hentes tilbage.',{sted}), ()=>{
    if(!sletTur(id)) return;
    tegn();
    flash(t('loggen.sletdone','Turen er slettet.'), 'kryds');
  });
}

/* HVEM KAN SE TUREN — paa selve turkortet (KN 15/9).

   Den sad foerst inde paa turplanen. Kennet: "Den der deler med slider skal
   vaere der i en af de foerste faser maaske samme sted som inviter en ven".
   Han har ret: hvem der er med paa turen, hoerer sammen — gaesten og
   rejsemakkeren er to svar paa det samme spoergsmaal, og de skal staa samme
   sted. Turplanen er noget, man aabner; kortet er noget, man SER.

   Vises kun, naar der ER en aktiv rejsemakker. Uden en at dele med er
   "del denne tur" et spoergsmaal uden modtager. */
function delerLinje(a){
  if(!partnerAktiv() || !a || !a.id) return '';
  const navn = partnerNavn().split(' ')[0];

  /* ⚠️ DEN ANDEN VEJ ER IKKE DEN SAMME VEJ (KN 17/9).

     Er turen HENDES, delt ned til mig, stod der indtil nu "Oliivia kan se
     turen" med en kontakt ved siden af. Begge dele var forkerte:

       · Sætningen sagde det omvendte af, hvad der var sket. Det er ikke
         mig, der har givet hende lov — hun har delt den med mig.
       · Kontakten lovede noget, den ikke kunne holde. Den satte `privat`
         paa HENDES raekke, og RLS FILTRERER, den afviser ikke: serveren
         ville aendre nul raekker og svare paent, udbakken ville toemme
         sig, og kontakten ville staa tilbage ved sin gamle stilling efter
         naeste hentning. En kontakt, der springer tilbage uden at sige
         hvorfor, er den vaerste slags fejl — man proever igen.

     Samme regel som `sletTur`: kun ejeren bestemmer. Saa her staar der,
     hvad der ER sket, og der er intet at trykke paa. */
  if(fremmedRække('ture', a.id)){
    return `<div class="deler-linje">
      <span class="indstil-ikon">${ik('folk')}</span>
      <span class="deler-tekst">${t('turplan.delttilmig','{navn} har delt denne tur med dig',{navn})}</span>
    </div>`;
  }

  const delt = turDeles(a);
  if(!delt && venHarSædet(a)){
    return `<div class="deler-linje">
      <span class="indstil-ikon">${ik('folk')}</span>
      <span class="deler-tekst">${t('turplan.venharsaedet','Turen er med {ven} — {navn} kan ikke se den',{ven:(a.ven.navn||t('gaest.gaestenstor','Gæsten')).split(' ')[0], navn})}</span>
    </div>`;
  }
  return `<div class="deler-linje">
    <span class="indstil-ikon">${ik('folk')}</span>
    <span class="deler-tekst">${delt
      ? t('turplan.kanse2','{navn} kan se turen',{navn})
      : t('turplan.kanikkese2','Kun dig — {navn} kan ikke se den',{navn})}</span>
    <button class="kontakt ${delt?'til':''}" role="switch" aria-checked="${delt}"
      aria-label="${esc(t('turplan.deler','Deler med {navn}',{navn}))}"
      onclick="event.stopPropagation();skiftTurDeling('${a.id}')"></button>
  </div>`;
}
/* Gæstens status på kortet (KN 6/9). "Afventer" skal stå på selve turen —
   ikke gemt inde i en invitationsskærm, man skal huske at åbne. */
function gæsteLinje(a){
  const v = a.ven;
  if(!v || !v.status) return '';
  const raaNavn = v.navn || t('gaest.gaestenstor','Gæsten');
  if(v.status==='accepteret') return `<div class="gæst-linje med">${ik('tjek')} ${t('gaest.ermed','{navn} er med',{navn:raaNavn})}</div>`;
  if(v.status==='afbud')      return `<div class="gæst-linje venter">${ik('kryds')} ${t('gaest.kanikke','{navn} kan ikke',{navn:raaNavn})}</div>`;
  return `<div class="gæst-linje venter">${ik('ur')} ${t('gaest.afventer','Afventer {navn}',{navn:raaNavn})}</div>`;
}
/* HVORNÅR KAN MAN INVITERE EN VEN MED — to spærrer, begge fra KN 17/9.

   1. IKKE PÅ EN TUR, DER ER DELT NED TIL MIG. Det er hendes tur, og
      dermed hendes beslutning, hvem der skal med. Knappen ville skrive
      `ven` på HENDES række, og RLS filtrerer — serveren ville ændre nul
      rækker og svare pænt, og gæsten ville forsvinde igen ved næste
      hentning. Præcis samme fælde som delekontakten havde.

   2. IKKE NÅR TUREN ER DELT MED REJSEMAKKEREN. Kennet:

        "Man kan kun være 2 personer i en bil maks, så det giver ikke
         mening at man kan invitere en ven med når man har valgt at dele
         med partner."

      Der er to sæder. Deler man turen med sin rejsemakker, er de taget.
      Gæsten er svaret på den ANDEN slags tur — den, man ikke kører med
      sin faste makker. De to udelukker hinanden, og så skal appen ikke
      lade som om, man kan vælge begge.

   ⚠️ EN GÆST, DER ALLEREDE ER PÅ, FJERNES IKKE. Findes der en `ven` med
   en status, står linjen og knappen der stadig — også selvom turen nu
   deles. Den aftale er lavet med et menneske, og en flade, der lader den
   forsvinde uden et ord, er værre end en, der viser en uoverensstemmelse,
   man selv kan rette. Spærren gælder det at invitere en NY. */
function gæsteKnap(a){
  const v = a.ven;
  if(fremmedRække('ture', a.id)) return '';
  if(!v || !v.status){
    if(turDeles(a)) return '';
    return `<div class="stille-række" style="margin-top:10px">
      <button class="knap stille" onclick="venInviterStart('${a.id}')">${ik('folk')} ${t('gaest.invitervenmed','Inviter en ven med')}</button>
    </div>`;
  }
  if(v.status==='accepteret'){
    return `<div class="stille-række" style="margin-top:10px">
      <button class="knap stille" onclick="venInviterStart('${a.id}')">${t('gaest.sefordeling','Se fordelingen af pakkelisten')}</button>
    </div>`;
  }
  if(v.status==='afbud'){
    /* Meldte gæsten afbud, og deles turen nu med rejsemakkeren, er sædet
       taget af en anden. Så er "Inviter en anden med" ikke et tilbud
       længere — kun afbuddet står, så man kan se, hvad der skete. */
    if(turDeles(a)) return '';
    return `<div class="stille-række" style="margin-top:10px">
      <button class="knap stille" onclick="venInviterStart('${a.id}')">${t('gaest.inviteranden','Inviter en anden med')}</button>
    </div>`;
  }
  /* Ingen demo-knap. Gæsten svarer på sit eget link, og kortet finder selv
     ud af det — se venOpdaterSvar(). */
  return `<div class="gæst-demo">
      <span class="dæmpet">${t('gaest.venterpaasvar','{navn} har fået en SMS med et link. Svaret dukker op her.',{navn:v.navn||t('gaest.gaestenstor','Gæsten')})}</span>
    </div>`;
}
/* Spærren står også her, ikke kun på knappen. Knappen TEGNES ikke på en
   rejsemakkers tur (se `gæsteKnap`), men den dag nogen åbner skærmen fra
   et andet sted, skal svaret være det samme. Samme greb som `sletTur` og
   `skiftTurDeling`, og af samme grund: RLS filtrerer, den afviser ikke. */
function venInviterStart(id){
  if(fremmedRække('ture', id)){
    flash(t('gaest.kunejeren','Turen er {navn}s. Kun {navn} kan invitere en med.',
      {navn: partnerNavn().split(' ')[0]}), 'kryds');
    return;
  }
  vælgTur(id); gåTil('ven-inviter');
}
function skærmLog(){
  const tomt = !s.ture.length;
  const kommende = s.arytmer.slice().sort((a,b)=>(a.dato||'9999')<(b.dato||'9999')?-1:1);
  /* Afholdte ture sorteres på TURENS dato, ikke på hvornår den blev skrevet
     ind (KN 4/9). Før fulgte det oprindelige indeks med, fordi gemMinde(),
     gentagTur() og anmeldelsen skrev direkte i s.ture[n] — og så måtte man
     ikke sortere selve arrayet. Siden 0.6 har hver tur sit eget id, så her
     sorteres frit: knapperne peger på turen, ikke på dens plads. */
  const afholdte = s.ture.slice()
    .sort((a,b)=>String(b.dato||'').localeCompare(String(a.dato||'')));
  /* SAMME HOVED SOM PROFILEN (KN 28/9: "kan du ikke lave arytmeloggens side
     som profilsiden?"). Landskabet, logoet og årshjulet er væk herfra —
     loggen er en liste, man slår op i, ikke en forside. Tilbagepilen og
     overskriften er skærmTop(), præcis som på Profil & indstillinger. */
  $('indhold').innerHTML = `
  <div class="side anim log-side">
    ${skærmTop(t('loggen.titel','Arytme log'),'hjem')}
    <!-- "Ny arytme" er skærmens ene hovedgreb og står derfor som en rigtig
         knap nu — pillen var tegnet til at stå på det mørke landskab og ville
         forsvinde på dagtemaets creme. Pulsen slår efter ordet (KN 28/9). -->
    <button class="knap primær bred log-ny" onclick="nyArytme()" aria-label="${esc(t('loggen.nyaria','Planlæg en ny arytme'))}">
      <span>${t('loggen.nyknap','Planlæg ny arytme')}</span>${logoPuls()}
    </button>
    <!-- Et stille tilbud under hovedgrebet, ikke et greb ved siden af det. -->
    <button class="log-spontan" onclick="logSpontanModal()">${t('faelles.logspontan','Log en spontan tur')}</button>
  </div>
  <div class="tjek-blok">
    ${kommende.length ? `
    <h2 class="aryt-sektion" style="margin-top:6px">${t('loggen.kommende','Kommende ture')}</h2>
    ${kommende.map(kommendeKort).join('')}` : ''}
    ${(kommende.length && !tomt) ? `<h2 class="aryt-sektion">${t('loggen.afholdte','Afholdte ture')}</h2>` : ''}
    ${tomt ? `
    <div class="kort tom-tilstand" style="margin-top:18px">
      <div style="color:var(--rav);margin-bottom:12px"><svg class="ik" style="width:44px;height:44px" viewBox="0 0 24 24">${IKONER.måne}</svg></div>
      <h3>${kommende.length ? t('loggen.ingenafholdte','Ingen afholdte ture endnu.') : t('loggen.ingenture','Ingen ture endnu.')}</h3>
      <p class="dæmpet" style="margin-top:8px">${t('loggen.foerste','Den første bliver den, I husker bedst.')}</p>
    </div>` : afholdte.map(a=>`
    <div class="tur-kort">
      <div class="top"><h3>${esc(a.sted)}</h3>${deresMærkat('afholdte_ture', a.id)}<span class="dato">${(d => d.charAt(0).toUpperCase() + d.slice(1))(pænDato(a.dato) || "")}</span>${sletKnapAfholdt(a)}</div>
      ${a.score ? `
      <div class="anmeldt-stjerner">
        ${a.score.destination ? `<span>${t('loggen.destination','Destination')} ${stjerneTegn(a.score.destination)}</span>` : ''}
        ${a.score.komfort ? `<span>${t('loggen.komfort','Komfort')} ${stjerneTegn(a.score.komfort)}</span>` : ''}
        ${a.score.hygge ? `<span>${t('loggen.hygge','Hygge')} ${stjerneTegn(a.score.hygge)}</span>` : ''}
      </div>` : `<div class="dæmpet" style="font-size:13px;margin-top:6px">${t('loggen.ikkeanmeldt','Ikke anmeldt')}</div>`}
      ${a.godt?`<p style="font-size:14px;margin-top:10px"><b style="color:var(--gran)">${t('loggen.godtmaerke','Godt:')}</b> ${esc(a.godt)}</p>`:''}
      ${a.bedre?`<p style="font-size:14px;margin-top:10px"><b style="color:var(--gran)">${t('loggen.bedremaerke','Kan blive bedre:')}</b> ${esc(a.bedre)}</p>`:''}
      ${a.kommentar?`<p style="font-size:14px;margin-top:10px"><b style="color:var(--gran)">${t('loggen.kommentarmaerke','Kommentar:')}</b> ${esc(a.kommentar)}</p>`:''}
      <!-- Jeres eget minde om turen (OD 30/8). Gemmes ved hvert tastetryk,
           men uden gentegning — ellers mistede feltet fokus midt i en sætning.
           Når turen er anmeldt, er feltet væk (KN 5/10) — et minde skrevet før
           står tilbage som tekst, så intet forsvinder. -->
      ${a.score ? (a.minde ? `<p style="font-size:14px;margin-top:10px"><b style="color:var(--gran)">${t('loggen.mindemaerke','Husk:')}</b> ${esc(a.minde)}</p>` : '') : `
      <label class="felt-etiket">${t('loggen.minde','Hvad skal I huske fra turen?')}</label>
      <textarea placeholder="${esc(t('loggen.mindeplads','Fx bryllupsdag i solen, eller: alt kiksede, men fantastisk udsigt'))}"
                oninput="gemMinde('${a.id}', this.value)">${esc(a.minde||'')}</textarea>`}
      <!-- Anmeldelsen bor i samme pop-up som "Log spontan tur" (KN 4/9). Den
           fuldskærms-anmeldelse er væk sammen med "Vil du gemme din tur":
           turene logges nu selv, og anmeldelsen er noget man KAN gøre
           bagefter — ikke en port, man skal igennem for at få turen gemt. -->
      <div class="aryt-knapper">
        <button class="knap kontur bred lille" onclick="logSpontanModal('${a.id}')">${a.score?t('loggen.retanmeldelse','Ret anmeldelsen'):t('loggen.anmeld','Anmeld turen')}</button>
        ${a.plan?`<button class="knap kontur bred lille" onclick="gentagTur('${a.id}')">${t('loggen.gentag','Gentag turen')}</button>`:''}
      </div>
    </div>`).join('')}
  </div>`;
}

/* =============================================================
   PROFIL
   ============================================================= */
/* ---------- DEN FASTE PARTNER (KN 6/9) ----------
   Ikke en gæst på én tur, men den man deler alt med: appen, alle ture,
   alle lister. Derfor står hun i profilen og ikke inde i en tur — og
   derfor er der kun ét felt for hende i hele appen.

   Prototype: SMS'en sendes ikke rigtigt, og "adgang" er et flag. Når der
   kommer en backend, er det HER, den skal hægtes på — ikke i turene. */
function partner(){ return (s.profil && s.profil.partner) || { navn:'', telefon:'', status:null }; }
function partnerAktiv(){ return partner().status === 'aktiv'; }
function partnerFelt(felt, værdi){
  if(!s.profil.partner) s.profil.partner = { navn:'', telefon:'', status:null };
  s.profil.partner[felt] = værdi;
  gem();
  const k = $('partnerKnap');
  if(k) k.disabled = !(s.profil.partner.navn && s.profil.partner.telefon);
}
/* INVITATIONEN ER RIGTIG NU (fase 3, 11/9).

   Før satte den her funktion `status = 'sendt'` i localStorage, tegnede
   en SMS, der aldrig blev sendt, og sagde så i en modal, at invitationen
   VAR sendt. Den løj om det eneste, brugeren ikke selv kunne se.

   DEN FALSKE SMS ER VÆK. Kortet viste en tegning af beskeden med et link,
   der ikke fandtes — `arytmi.dk/os/` plus de sidste fire cifre af hendes
   telefonnummer. Hverken det rigtige domæne eller et token. Nu står teksten
   ét sted: i `inviter-partner`, sammen med det, der sender den. To kopier
   af den samme besked er to steder at rette, og det ene sted løj. */
async function partnerInviter(){
  const pa = partner();
  if(!(pa.navn && pa.telefon)){ flash('Skriv både navn og telefonnummer.'); return; }
  const knap = $('partnerKnap');
  if(knap){ knap.disabled = true; knap.textContent = 'Sender…'; }

  const svar = await ArytmiAuth.inviterPartner(pa.navn, pa.telefon);

  if(!svar.ok){
    /* Funktionens egen besked, ord for ord — den ved, hvad der gik galt.
       Er GATEWAYAPI_TOKEN ikke sat, siger den "Invitationer er ikke sat
       op", og så er det DET, der skal stå på skærmen. Ikke "prøv igen". */
    if(knap){ knap.disabled = false; knap.innerHTML = ik('telefon') + ' Giv fuld adgang'; }
    flash(svar.fejl);
    return;
  }

  s.profil.partner.status  = 'sendt';
  s.profil.partner.telefon = svar.telefon || pa.telefon;
  s.profil.partner.sendt   = new Date().toISOString();
  gem(); tegn();
  infoModal(t('partner.smsmodal','SMS\'en er sendt til <b>{navn}</b>. Når linket åbnes og der vælges et kodeord, deler I appen og alle ture.',{navn:pa.navn}), t('faelles.godt','Godt'));
}

/* HVORNÅR BLIVER "AFVENTER" TIL "AKTIV"?

   Accepten sker på arytmi.com/os, på HENDES telefon. Denne app hører
   aldrig om det af sig selv — derfor spørger vi databasen, når profilen
   tegnes. Før var der en demo-knap, hvor AFSENDEREN kunne trykke
   "Oliivia accepterer" på sin egen telefon. Den er væk; den kunne kun
   bekræfte, at vi troede på os selv.

   Kun ÉN vej: fra 'sendt' til 'aktiv'. Finder vi ingen række, rører vi
   ikke ved noget. En hentning, der fejler, fordi nettet er væk, må ikke
   kunne slette et partnerskab, der findes. */
async function partnerOpdaterStatus(){
  const pa = partner();
  if(!ArytmiAuth.tilgaengelig()) return;

  /* STÅR KORTET TOMT, MENS DER ER EN INVITATION UDE?

     Det gjorde det hos Kennet den 11/9, og han fangede det ved at kigge:
     "det med at Oliivia er inviteret som partner er væk? Skal det ikke
     blive der indtil personen har accepteret?"

     Jo. Tilstanden bor kun i localStorage på den telefon, der sendte —
     `fladgoer()` sender ikke `profil.partner` op — så en ny telefon,
     ryddede data eller en frisk app fra Play viste den tomme formular,
     mens tokenet levede videre i fjorten dage og sagtens kunne indløses.
     To sandheder om den samme invitation, og den eneste, brugeren kunne
     se, var den forkerte.

     Nu spørges serveren i stedet (`0015`). Kun når kortet er tomt: står
     der allerede noget lokalt, er det nyere end et opslag.

     ---- OG SÅ ÉN STATE LÆNGERE FREM (KN 11/9, aften) ----

     Ovenstående lukkede hullet, mens invitationen stadig var UINDLØST.
     Den lukkede det ikke, når den var indløst: Oliivia accepterede kl.
     20:55, partnerskabet stod `aktiv` i databasen — og Kennets profil
     viste stadig den tomme formular.

     Hvorfor: `hentSendtInvitation()` filtrerer på `.is('brugt_kl', null)`.
     En accepteret invitation er brugt, så den finder ingenting, og så
     returnerede vi HERFRA uden nogensinde at spørge, om der fandtes et
     partnerskab. Den eneste tilstand, appen kunne opdage, var den, der
     endnu ikke var sket.

     Værre end tom: det tomme kort tilbyder "Giv fuld adgang", og den
     handling MÅ fejle — låsen "én partner, én gang" sidder i databasen.
     Vi bad hende om noget, hun ikke kunne gøre.

     Derfor spørges der nu om partnerskabet FØRST. Et partnerskab er en
     kendsgerning; en invitation er et løfte. Kendsgerningen vejer tungest.

     Navnet hentes to steder, og rækkefølgen er ikke tilfældig: først i
     den invitation, man selv sendte (den har OGSÅ telefonnummeret), og
     ellers med `partner_navn()` (0027), som er den eneste vej for den
     INVITEREDE. Svarer ingen af dem, falder `partnerNavn()` tilbage på
     "Din rejsemakker". Bedre et kort uden navn end et kort, der påstår,
     at intet er sket. */
  if(!pa.status){
    const p = await ArytmiAuth.hentPartner();
    if(p.ok && p.partner && p.partner.status === 'aktiv'){
      /* Navnet står i den invitation, hun selv sendte — og den må hun læse,
         også efter den er indløst (`egne sendte invitationer laeses`).
         Den inviterede har ingen sendt invitation og får derfor ingen navn;
         der falder kortet tilbage på "Din rejsemakker". */
      let navn = '', telefon = '';
      if(p.partner.jegInviterede && ArytmiAuth.hentIndloestInvitation){
        const brugt = await ArytmiAuth.hentIndloestInvitation();
        if(brugt.ok && brugt.invitation){
          navn = brugt.invitation.navn || '';
          telefon = brugt.invitation.telefon || '';
        }
      }
      /* Den inviterede har ingen sendt invitation at hente navnet fra.
         Siden 0027 kan hun spørge om det i stedet. */
      if(!navn && ArytmiAuth.hentPartnerNavn){
        const n = await ArytmiAuth.hentPartnerNavn();
        if(n.ok && n.navn) navn = n.navn;
      }
      s.profil.partner = { navn, telefon, status:'aktiv' };
      gem();
      if(aktivSkærm === 'profil') tegn();
      return;
    }
    const inv = await ArytmiAuth.hentSendtInvitation();
    if(inv.ok && inv.invitation){
      s.profil.partner = {
        navn: inv.invitation.navn || '',
        telefon: inv.invitation.telefon || '',
        status: 'sendt'
      };
      gem();
      if(aktivSkærm === 'profil') tegn();
    }
    return;
  }

  if(pa.status !== 'sendt' && pa.status !== 'aktiv') return;

  const svar = await ArytmiAuth.hentPartner();
  if(!svar.ok) return;   // vi fik ikke spurgt. Rør ingenting.

  if(svar.partner){
    if(pa.status === 'aktiv'){
      /* Aktivt, men uden navn. Præcis den tilstand, Oliiviias telefon stod
         i den 15/9: partnerskabet var i orden, og kortet sagde alligevel
         "Din rejsemakker", fordi der ikke fandtes en vej til navnet, da
         kortet blev sat op. Nu gør der. */
      if(!s.profil.partner.navn) await partnerHentNavn();
      return;
    }
    s.profil.partner.status = 'aktiv';
  } else {
    /* Spurgt, og der er intet partnerskab.

       Stod vi paa 'sendt', er det ikke en loegn — invitationen kan ligge
       ulaest i en indbakke i fjorten dage. Vi venter videre.

       Stod vi paa 'aktiv', er partnerskabet ophaevet, mens vi ikke kiggede:
       den anden kan have fjernet det fra sin side, eller support kan have
       nulstillet det (0011). Kortet skal ikke blive ved med at love fuld
       adgang til én, der ikke har den laengere. */
    if(pa.status !== 'aktiv') return;
    s.profil.partner = { navn:'', telefon:'', status:null };
  }

  gem();
  if(aktivSkærm === 'profil') tegn();
}

/* Henter navnet ind på et kort, der allerede står aktivt.

   Fejler opslaget, sker der ingenting: "Din rejsemakker" er en ringere
   tekst, men den er sand. Et gættet navn ville ikke være. */
async function partnerHentNavn(){
  if(!ArytmiAuth.hentPartnerNavn || !s.profil.partner) return false;
  const svar = await ArytmiAuth.hentPartnerNavn();
  if(!svar.ok || !svar.navn) return false;
  s.profil.partner.navn = svar.navn;
  gem();
  if(aktivSkærm === 'profil') tegn();
  return true;
}

/* Et nyt forsøg. Der findes ikke en vej til at kalde en sendt invitation
   tilbage — `partner_invitation` må hverken læses eller skrives af en
   almindelig bruger, og det er med vilje. Men serveren dræber selv alle
   uindløste invitationer, når der laves en ny, så en ny invitation ER
   fortrydelsen. Det siger kortet nu i stedet for at love noget andet. */
function partnerNyInvitation(){
  if(!s.profil.partner) return;
  s.profil.partner.status = null;
  gem(); tegn();
}

/* At fjerne adgangen er en RIGTIG sletning nu — rækken i `partner` ryger,
   og hun mister adgangen til jeres ture i samme sekund. Før ryddede den et
   felt i localStorage og sagde "Adgangen er fjernet", mens hun sad med
   appen åben og fuld adgang.

   LÅSEN BLIVER STÅENDE, og det skal stå i spørgsmålet — FØR der trykkes.
   Migration 0004 siger det lige ud: "Laasen slettes IKKE, naar
   partnerskabet slettes. Det er hele pointen." */
function partnerFjern(){
  const navn = partner().navn || t('partner.partneren','partneren');
  bekræft(t('partner.fjernspm','Fjern {navn}s adgang til appen og alle jeres ture?<br><br>Du kan <b>ikke</b> oprette en ny fast rejsemakker bagefter. Det kan kun gøres én gang.',{navn}), async ()=>{
    const svar = await ArytmiAuth.fjernPartner();
    if(!svar.ok){ flash(svar.fejl); return; }
    s.profil.partner = { navn:'', telefon:'', status:null };
    gem(); tegn();
    flash(t('partner.adgangfjernet','Adgangen er fjernet.'), 'kryds');
  });
}
function partnerKort(){
  const pa = partner();
  const klar = !!(pa.navn && pa.telefon);
  const hoved = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
      <span style="color:var(--rav)">${ik('folk')}</span><h3>${t('partner.overskrift','Din faste rejsemakker')}</h3>
    </div>`;
  /* AKTIVT PARTNERSKAB ER EN RÆKKE, IKKE ET KORT (KN 15/9).

     Det var et helt kort med en grøn bannerboks og en rød linje — det
     eneste element på skærmen, der råbte. Efter indstillingerne blev til
     en rolig liste, stod det tilbage som det gamle sprog midt i det nye:
     "nu passer denne boks ikke ind mere".

     Nu står det som listens første række, i samme form som de andre: ikon,
     titel, og NAVNET som undertekst — for navnet er det, man kommer for at
     se. Resten, inklusive den handling man ikke skal ramme ved et uheld,
     ligger bag (i). Ikke ét ord er ændret; `partner.deler` og
     `partner.deltsyn` står nu bag folden i stedet for på skærmen.

     De to ANDRE tilstande — invitation sendt, og ingen partner — bliver
     ved med at være kort. De har felter og en forklaring, der skal læses
     FØR man handler, og de kan ikke foldes sammen uden at skjule selve
     handlingen. En række og et kort er ikke det samme, fordi de to
     tilstande ikke beder om det samme. */
  if(pa.status==='aktiv'){
    const åben = !!åbenIndstilling['rejsemakker'];
    return `
      <div class="liste-punkt indstil-række">
        <span class="indstil-ikon">${ik('folk')}</span>
        <div class="navn">${t('partner.overskrift','Din faste rejsemakker')}<div class="indstil-under">${esc(partnerNavn())}</div></div>
        <button class="bil-info" onclick="indstilFold('rejsemakker')" aria-expanded="${åben}"
          aria-label="${esc(t('indstil.mereom','Mere om {navn}',{navn:t('partner.overskrift','Din faste rejsemakker')}))}">${ik('info')}</button>
        <!-- Ingen tom celle her. Rejsemakkeren har ingen kontakt, og en
             attrap i kontaktens bredde tvang titlen om paa to linjer — saa
             blev raekken hoejere end de andre, og ikonet flugtede ikke.
             (i) staar i stedet yderst, hvor kontakternes hoejrekant er. -->
      </div>
      ${åben?`<div class="bil-krop">
        <p class="dæmpet" style="font-size:13.5px;margin:0">${t('partner.deler','Du deler Arytmi med <b>{navn}</b>.',{navn:partnerNavn()})} ${t('partner.deltsyn','I ser det samme: ture, planer og pakkelister. Retter den ene, står det hos den anden.')}</p>
        <div class="stille-række" style="margin-top:10px">
          <button class="knap stille fare" onclick="partnerFjern()">${t('partner.fjern','Fjern adgangen')}</button>
        </div>
      </div>`:''}`;
  }
  if(pa.status==='sendt'){
    /* Ingen tegning af SMS'en. Vi viser, hvad vi VED: hvem, hvilket
       nummer, og hvad linket kan. Teksten selv står i den funktion, der
       sendte den — en kopi her ville kunne drive fra den. */
    return `<div class="kort">
      ${hoved}
      <div class="gæst-linje venter" style="margin:10px 0 0">${ik('ur')} ${t('partner.afventer','Afventer {navn}',{navn:pa.navn})}</div>
      <div class="ob-mail" style="margin-top:12px">
        <div class="m-top">${ik('telefon')} ${t('partner.smssendt','SMS sendt til {nummer}',{nummer:ArytmiAuth.visTelefon(pa.telefon) || pa.telefon})}</div>
        <div class="m-krop"><p class="dæmpet" style="font-size:13.5px;margin:0">${t('partner.linketvirker','Linket virker i <b>14 dage</b> og kun <b>én gang</b>. Når det er åbnet, og der er valgt et kodeord, deler I appen og alle ture med det samme.')}</p></div>
      </div>
      <p class="dæmpet" style="font-size:12px;margin-top:10px">${t('partner.kominteffrem','Kom den ikke frem? Send en ny — så holder den gamle op med at virke.')}</p>
      <div class="stille-række" style="margin-top:4px">
        <button class="knap stille" onclick="partnerNyInvitation()">${t('partner.nyinvitation','Send en ny invitation')}</button>
      </div>
    </div>`;
  }
  return `<div class="kort">
    ${hoved}
    <p class="dæmpet" style="font-size:13.5px">${t('partner.hvorfor','Deler du hverdagen med nogen, skal I ikke planlægge hver for sig. Din faste rejsemakker får fuld adgang til appen og alle ture — ikke bare ét link til én liste.')}</p>
    <label class="felt-etiket">${t('partner.navn','Navn')}</label>
    <input type="text" placeholder="${esc(t('partner.navnplads','Fx Anne'))}" value="${esc(pa.navn||'')}" oninput="partnerFelt('navn',this.value)">
    <label class="felt-etiket">${t('partner.telefon','Telefonnummer')}</label>
    <input type="tel" inputmode="tel" placeholder="${esc(t('partner.telefonplads','12 34 56 78'))}" value="${esc(pa.telefon||'')}" oninput="partnerFelt('telefon',this.value)">
    <button class="knap primær bred" id="partnerKnap" style="margin-top:16px" ${klar?'':'disabled'} onclick="partnerInviter()">
      ${ik('telefon')} ${t('partner.givadgang','Giv fuld adgang')}
    </button>
    <p class="dæmpet" style="font-size:12px;text-align:center;margin-top:8px">${t('partner.engang','Din rejsemakker får en SMS med et link. Det kan kun gøres én gang.')}</p>
  </div>`;
}
/* Kontakten. Slås den TIL, hentes rækkerne med det samme — man skal ikke
   trykke og så vente på at næste skærm tilfældigvis henter noget. Slås den
   FRA, bygges listen forfra fra det udgivne bundt: så er der ingen tvivl om,
   hvilke felter en kladde nåede at overskrive.

   Valget ligger i s.profil, men det synkroniseres IKKE — fladgoer() i
   sync.js sender kun navn, fødselsdag og notifikationer. Det er med vilje:
   "vis kladder" er noget, man slår til på den telefon, man sidder med. */
async function skiftKladder(){
  if(!erAdmin()) return;
  if(!s.profil) s.profil = {};
  s.profil.viskladder = !s.profil.viskladder;
  gem();
  if(s.profil.viskladder){
    const n = await opdaterKladder();
    tegn();
    flash(n
      ? t('indstil.kladderfundet','{antal} kladder er med nu.',{antal:n})
      : t('indstil.ingenkladder','Der er ingen kladder lige nu.'), 'blyant');
  } else {
    fjernKladder();
    tegn();
    flash(t('indstil.kladderskjult','Kladderne er skjult igen.'), 'tjek');
  }
}

/* =============================================================
   EDITOR-TILSTANDEN (KN 5/10 2026)
   =============================================================

   "Jeg vil gerne have at Admins kan vælge 'editor mode' i profilen og
   dermed ændre i alt på appen. Det er et stort ønske for Oliivia at hun
   ikke skal i bagrummet hver gang." Og: "vi som admins skal kunne have en
   fane i appen hvor vi kan redigere i turene direkte."

   TRE DELE:
     · Kontakten i profilen. Slås den til, beder appen om koden fra
       authenticator-appen (aal2) — databasen gemmer ellers ingenting.
     · "Ret tekst" i bjælken nederst: næste tryk vælger en tekst på
       skærmen i stedet for at trykke på den. Teksten rettes i et ark og
       gemmes som kladde — hun ser den straks, kunderne først ved Udgiv.
     · Fanen "Steder": alle steder, også kladderne, og et skema til hvert
       med tekster, vurdering, ønsker, placering og billeder.

   Data, regler og to-faktor står i redaktoer.js. Her er kun skærmene.
   Kontakten synkroniseres IKKE (fladgoer() sender kun navn, fødselsdag og
   notifikationer) — editoren er noget, man slår til på den telefon, man
   sidder med, ligesom kladderne var. */
let redVælger = false;
let redUdestående = { tekster: [], ture: [] };
let redStedSøg = '';
let redForm = null;
let redTravl = false;

function editorTil(){ return erAdmin() && !!(s.profil && s.profil.editor) && !!window.ArytmiRedaktoer; }

function redUdgivetBundt(){
  try{ return JSON.parse(localStorage.getItem(INDHOLD_GEMT) || 'null'); }catch(e){ return null; }
}
function redTæl(){
  redUdestående = editorTil()
    ? ArytmiRedaktoer.ikkeUdgivet(redUdgivetBundt(), RED_TEKSTER, KLADDE_RAEKKER)
    : { tekster: [], ture: [] };
}
async function redHent(){
  const tekster = await ArytmiRedaktoer.hentTekster();
  if(tekster) RED_TEKSTER = tekster;
  else if(!RED_TEKSTER) RED_TEKSTER = Object.create(null);
  RED_SETE = new Map();
  anvendListeTekster();
  await opdaterKladder();
  redTæl();
}

async function skiftEditor(){
  if(!erAdmin() || !window.ArytmiRedaktoer) return;
  if(editorTil()){
    s.profil.editor = false; gem();
    redSluk();
    tegn();
    flash(t('editor.slukket','Editoren er slået fra.'), 'tjek');
    return;
  }
  const sik = await ArytmiRedaktoer.sikkerhed();
  if(!sik){ infoModal(t('editor.ingenforbindelse','Editoren kræver, at du er logget ind og har net.')); return; }
  if(sik.faktor && sik.nu !== 'aal2'){ redKodeModal(sik.faktor, redTænd); return; }
  redTænd();
}
async function redTænd(){
  s.profil.editor = true; gem();
  flash(t('editor.henter','Henter teksterne og stederne …'), 'blyant');
  await redHent();
  tegn();
  flash(t('editor.taendt','Editoren er slået til.'), 'blyant');
}
function redSluk(){
  RED_TEKSTER = null; RED_SETE = null; redVælger = false; redForm = null;
  anvendListeTekster();
  document.body.classList.remove('red-vælg');
  if(!(s.profil && s.profil.viskladder)) fjernKladder();
  const b = $('red-bjaelke'); if(b) b.remove();
  if(aktivSkærm.startsWith('red-')){ nulstilHistorik(); aktivSkærm = 'profil'; }
}
/* Ved opstart: var editoren slået til, skal sessionen stadig være aal2.
   Er den ikke det (nyt login, ny telefon), slås editoren stille fra — en
   editor, der ser tændt ud og ikke kan gemme, er værre end ingen. */
async function redOpstart(){
  if(!editorTil()) return;
  const sik = await ArytmiRedaktoer.sikkerhed();
  if(!sik || (sik.faktor && sik.nu !== 'aal2')){ s.profil.editor = false; gem(); tegn(); return; }
  await redHent();
  tegn();
}

/* ---------- koden fra authenticator-appen ---------- */
function redKodeModal(faktor, videre){
  const gammel = $('red-kode'); if(gammel) gammel.remove();
  const div = document.createElement('div');
  div.id = 'red-kode';
  div.className = 'modal-bag';
  div.innerHTML = `
    <div class="modal-kort">
      <div class="etiket">${t('editor.etiket','Editor')}</div>
      <h2 style="margin-top:4px">${t('editor.kodeoverskrift','Koden fra din authenticator')}</h2>
      <p class="dæmpet" style="margin-top:6px">${t('editor.kodeunder','Editoren kan ændre det, alle kunder ser. Skriv de seks cifre fra din authenticator-app.')}</p>
      <input type="text" id="red-kode-felt" inputmode="numeric" autocomplete="one-time-code" maxlength="7"
             placeholder="123 456" style="font-size:22px;letter-spacing:.3em;text-align:center;margin-top:14px">
      <div id="red-kode-fejl" class="red-fejl" role="alert"></div>
      <div class="modal-knapper">
        <button class="knap kontur bred" id="red-kode-nej">${t('faelles.fortryd','Fortryd')}</button>
        <button class="knap primær bred" id="red-kode-ja">${t('editor.bekraeft','Bekræft')}</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  const felt = $('red-kode-felt');
  setTimeout(() => felt.focus(), 60);
  $('red-kode-nej').onclick = () => div.remove();
  const ja = async () => {
    const knap = $('red-kode-ja');
    knap.disabled = true;
    const svar = await ArytmiRedaktoer.bekraeftKode(faktor, felt.value);
    knap.disabled = false;
    if(!svar.ok){ $('red-kode-fejl').textContent = svar.fejl; felt.select(); return; }
    div.remove();
    videre();
  };
  $('red-kode-ja').onclick = ja;
  felt.addEventListener('keydown', e => { if(e.key === 'Enter') ja(); });
}

/* ---------- bjælken nederst ---------- */
function redAntal(){ return redUdestående.tekster.length + redUdestående.ture.length; }
function tegnRedBjælke(){
  let b = $('red-bjaelke');
  if(!editorTil() || !s.onboarded || loginKræves){ if(b) b.remove(); return; }
  if(!b){
    b = document.createElement('div');
    b.id = 'red-bjaelke';
    b.className = 'red-bjaelke';
    document.querySelector('.telefon').appendChild(b);
  }
  const n = redAntal();
  b.innerHTML = `
    <span class="red-mærke">${ik('blyant')}${t('editor.etiket','Editor')}</span>
    <button class="red-knap${redVælger ? ' aktiv' : ''}" onclick="redVælgTekst()">${redVælger
      ? t('editor.vaelgaktiv','Tryk på teksten …') : t('editor.rettekst','Ret tekst')}</button>
    <button class="red-knap udgiv" onclick="redUdgiv()" ${n ? '' : 'disabled'}>${n
      ? t('editor.udgivantal','Udgiv ({antal})',{antal:n}) : t('editor.altudgivet','Alt er udgivet')}</button>`;
}

/* ---------- "Ret tekst": næste tryk vælger en tekst ----------
   Lytteren står i FANGEFASEN på dokumentet, så den når trykket før
   knappens egen onclick — ellers ville et tryk på "Næste" både vælge
   teksten og skifte skærm. Kun ét tryk: bagefter opfører appen sig som
   altid. */
function redVælgTekst(){
  redVælger = !redVælger;
  document.body.classList.toggle('red-vælg', redVælger);
  tegnRedBjælke();
}
document.addEventListener('click', e => {
  if(!redVælger) return;
  const bjælke = $('red-bjaelke');
  if(bjælke && bjælke.contains(e.target)) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  redVælger = false;
  document.body.classList.remove('red-vælg');
  tegnRedBjælke();
  redÅbnArk(redKandidater(e.target));
}, true);


/* LANGT TRYK = RET DEN TEKST, DU STÅR PÅ (KN 5/10: "Vi skal kunne rette
   den skærm vi står på"). Et halvt sekund på en tekst i editor-tilstand
   åbner arket direkte — uden omvejen om "Ret tekst". Et kort tryk er
   stadig et tryk, så appen kan bruges som altid, mens editoren er tændt.
   Klikket, der følger efter et langt tryk, slugtes, så knappen under
   fingeren ikke også går i gang. */
let redLangt = null, redSlugKlik = false;
document.addEventListener("pointerdown", e => {
  if(!editorTil() || redVælger) return;
  const mål = e.target;
  if(mål.closest && (mål.closest("#red-bjaelke") || mål.closest(".modal-bag") || mål.closest("input,textarea,select"))) return;
  const x = e.clientX, y = e.clientY;
  clearTimeout(redLangt && redLangt.tid);
  redLangt = { x, y, tid: setTimeout(() => {
    redLangt = null;
    redSlugKlik = true;
    setTimeout(() => { redSlugKlik = false; }, 700);
    if(navigator.vibrate) try{ navigator.vibrate(12); }catch(_){}
    redÅbnArk(redKandidater(mål));
  }, 550) };
}, true);
const redSlipLangt = () => { if(redLangt){ clearTimeout(redLangt.tid); redLangt = null; } };
document.addEventListener("pointerup", redSlipLangt, true);
document.addEventListener("pointercancel", redSlipLangt, true);
document.addEventListener("pointermove", e => {
  if(redLangt && Math.hypot(e.clientX - redLangt.x, e.clientY - redLangt.y) > 10) redSlipLangt();
}, true);
document.addEventListener("click", e => {
  if(!redSlugKlik) return;
  redSlugKlik = false;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
}, true);
document.addEventListener("contextmenu", e => { if(editorTil() && !e.target.closest("input,textarea")) e.preventDefault(); });

/* Teksten, som den står på skærmen: uden tags, med entiteterne løst op.
   textContent og ikke innerText — kapitælerne er versaler i CSS'en, ikke
   i teksten, og "LOG IND" skal findes som "Log ind". */
function redRen(html){
  const d = document.createElement('div');
  d.innerHTML = String(html || '');
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}
/* Nøglerne, hvis tekst står i det, hun trykkede på. Tættest på fingeren
   vinder: elementet selv først, så forælderen — men KUN så længe
   forælderen stadig handler om den samme tekst. Ellers fandt et tryk på
   forsidens overskrift "Arytmer i år", bare fordi den stod i samme hero.
   Det længste fund først — "Til" står i mange ting, en hel sætning gør
   ikke. Svarer { nøgler, fast }: `fast` er teksten, hun trykkede på, når
   den ikke er en nøgle (den står i koden, eller den er stedets egen). */
function redKandidater(el){
  const ud = { nøgler: [], fast: '' };
  if(!RED_SETE) return ud;
  const sete = [];
  RED_SETE.forEach((v, n) => {
    if(n.startsWith('editor.')) return;
    const tekst = redRen(v.vist);
    if(tekst.length >= 2) sete.push({ n, tekst });
  });
  const tekstAf = x => (x.textContent || '').replace(/\s+/g, ' ').trim();
  let første = '';
  for(let x = el, trin = 0; x && x !== document.body && x.id !== 'indhold' && trin < 6; x = x.parentElement, trin++){
    if(!x.getAttribute) continue;
    const egne = ['placeholder','aria-label','title'].map(a => x.getAttribute(a)).filter(Boolean)
      .map(a => a.replace(/\s+/g, ' ').trim());
    const indhold = tekstAf(x);
    if(!første && indhold) første = indhold;
    /* Forælderen er vokset til noget andet end det, der blev trykket på. */
    if(første && indhold.length > første.length * 2 + 24) break;
    /* Oppe hos forælderen tæller kun en tekst, der rummer det, hun
       trykkede på — ellers blev et tryk på stedets navn til mærkatet
       "Testet af Arytmi ★", der står lige over det i samme blok. */
    const samme = f => !første || indhold === første || f.tekst.includes(første) || første.includes(f.tekst);
    const fund = sete.filter(f => (egne.includes(f.tekst) || (indhold && indhold.includes(f.tekst))) && samme(f));
    /* Et fund skal DÆKKE det, hun trykkede på — ikke bare stå i det. Ellers
       blev et tryk på stedets lange beskrivelse til nøglen for "toilet",
       fordi ordet stod midt i den. Enten én tekst, der fylder mindst 40 %,
       eller flere, der tilsammen fylder over halvdelen (et kort med titel og
       brødtekst). */
    const stærke = fund.filter(f => egne.includes(f.tekst) || f.tekst.length >= indhold.length * 0.4);
    const dækket = fund.reduce((sum, f) => sum + f.tekst.length, 0) >= indhold.length * 0.5;
    /* Dækker flere tekster tilsammen det trykkede ("Pizzaskærer" + "Eller bed
       om at få den skåret ud." i samme linje), skal de ALLE med — i den
       rækkefølge, de står på skærmen. */
    const valgt = dækket ? fund : stærke;
    if(valgt.length){
      const plads = f => { const i = indhold.indexOf(f.tekst); return i < 0 ? 1e9 : i; };
      ud.nøgler = valgt.sort((a, b) => (plads(a) - plads(b)) || (b.tekst.length - a.tekst.length)).slice(0, 8).map(f => f.n);
      return ud;
    }
  }
  ud.fast = første.slice(0, 160);
  return ud;
}

/* ---------- arket ---------- */
function redÅbnArk(fund){
  const nøgler = fund.nøgler || [];
  const gammel = $('red-ark'); if(gammel) gammel.remove();
  const div = document.createElement('div');
  div.id = 'red-ark';
  div.className = 'modal-bag red-ark-bag';
  document.body.appendChild(div);
  div.addEventListener('click', e => { if(e.target === div) div.remove(); });
  if(nøgler.length === 1) return redArkRet(nøgler[0]);
  if(nøgler.length > 1) return redArkVælg(nøgler);
  redArkListe('', fund.fast);
}
function redArkSkal(indhold){
  const div = $('red-ark'); if(!div) return;
  div.innerHTML = `<div class="modal-kort red-ark">${indhold}</div>`;
}
function redStedHer(){
  return aktivSkærm.startsWith('testet-') ? aktivSkærm.slice(7)
       : aktivSkærm.startsWith('red-sted-') ? aktivSkærm.slice(9) : null;
}
function redArkVælg(nøgler){
  redArkSkal(`
    <div class="etiket">${t('editor.etiket','Editor')}</div>
    <h2 style="margin-top:4px">${t('editor.hvilken','Hvilken tekst?')}</h2>
    <div class="red-valg">${nøgler.map(n => `
      <button onclick="redArkRet('${esc(n)}')">${esc(redRen(RED_SETE.get(n).vist)).slice(0, 140)}</button>`).join('')}
    </div>
    <div class="red-ark-fod">
      <button class="tekst-knap" onclick="redArkListe('')">${t('editor.alletekster','Alle tekster på skærmen')}</button>
      <button class="knap kontur lille" onclick="$('red-ark').remove()">${t('faelles.luk','Luk')}</button>
    </div>`);
}
function redArkListe(søg, fast){
  const q = String(søg || '').toLowerCase();
  const alle = [];
  (RED_SETE || new Map()).forEach((v, n) => {
    if(n.startsWith('editor.')) return;
    const tekst = redRen(v.vist);
    if(!q || tekst.toLowerCase().includes(q) || n.includes(q)) alle.push({ n, tekst });
  });
  const sted = redStedHer();
  redArkSkal(`
    <div class="etiket">${t('editor.etiket','Editor')}</div>
    <h2 style="margin-top:4px">${t('editor.alletekster','Alle tekster på skærmen')}</h2>
    ${fast && !sted ? `<p class="dæmpet" style="margin-top:6px">${t('editor.fasttekst','“{tekst}” står fast i koden og kan ikke rettes herfra endnu. Sig til, så bliver den lavet om.',{tekst:esc(fast.slice(0, 80))})}</p>` : ''}
    ${sted && !søg ? `<p class="dæmpet" style="margin-top:6px">${t('editor.stedtekst','Stedets navn, beskrivelse og billeder rettes under stedet.')}</p>
      <button class="knap kontur bred" style="margin-top:10px" onclick="$('red-ark').remove();gåTil('red-sted-${esc(sted)}')">${ik('blyant')} ${t('editor.retsted','Ret stedet')}</button>` : ''}
    <input type="search" id="red-ark-søg" placeholder="${esc(t('editor.soegtekst','Søg i teksterne'))}" value="${esc(søg)}"
           oninput="redArkListe(this.value);const f=$('red-ark-søg');f.focus();f.setSelectionRange(f.value.length,f.value.length)" style="margin-top:12px">
    <div class="red-valg">${alle.slice(0, 60).map(f => `
      <button onclick="redArkRet('${esc(f.n)}')">${esc(f.tekst.slice(0, 140)) || `<i>${esc(f.n)}</i>`}</button>`).join('')
      || `<p class="dæmpet">${t('editor.ingenfund','Ingen tekster passer.')}</p>`}
    </div>
    <div class="red-ark-fod">
      <span></span>
      <button class="knap kontur lille" onclick="$('red-ark').remove()">${t('faelles.luk','Luk')}</button>
    </div>`);
}
let redArkNøgle = null, redArkFaldbak = '';
function redArkRet(n){
  const v = RED_SETE && RED_SETE.get(n);
  if(!v) return;
  redArkNøgle = n;
  redArkFaldbak = v.faldbak;
  const række = RED_TEKSTER && RED_TEKSTER[n];
  const nu = (række && typeof række.tekst === 'string' && række.tekst !== '') ? række.tekst
           : (typeof TEKSTER[n] === 'string' && TEKSTER[n] !== '') ? TEKSTER[n] : v.faldbak;
  const pladser = Array.from(new Set(String(v.faldbak).match(/\{[a-z0-9_]+\}/g) || []));
  const rettet = !!(række && række.tekst);
  redArkSkal(`
    <div class="etiket">${t('editor.etiket','Editor')} · <span class="red-nøgle">${esc(n)}</span></div>
    <h2 style="margin-top:4px">${t('editor.retteksten','Ret teksten')}</h2>
    <textarea id="red-tekst-felt" rows="5">${esc(nu)}</textarea>
    ${pladser.length ? `<p class="dæmpet red-hjælp">${t('editor.pladser','Skal stå i teksten: {pladser}',{pladser:esc(pladser.join(' '))})}</p>` : ''}
    ${/<[a-z]/i.test(v.faldbak) ? `<p class="dæmpet red-hjælp">${t('editor.html','&lt;b&gt;fed&lt;/b&gt; og &lt;br&gt; for linjeskift virker her.')}</p>` : ''}
    <div id="red-ark-fejl" class="red-fejl" role="alert"></div>
    <div class="modal-knapper">
      <button class="knap kontur bred" onclick="$('red-ark').remove()">${t('faelles.fortryd','Fortryd')}</button>
      <button class="knap primær bred" id="red-tekst-gem" onclick="redGemTekst(false)">${t('editor.gem','Gem')}</button>
    </div>
    ${rettet ? `<div style="text-align:center;margin-top:10px"><button class="tekst-knap red-link" onclick="redGemTekst(true)">${t('editor.kodenstekst','Brug den oprindelige tekst')}</button></div>` : ''}
    ${redListeDel(n)}`);
  setTimeout(() => { const f = $('red-tekst-felt'); if(f){ f.focus(); f.setSelectionRange(f.value.length, f.value.length); } }, 60);
}
/* ---------- listepunkterne (KN 5/10: "tilføje ting til de faste lister") ----------
   Hører nøglen til et punkt i en af de faste lister, får arket en ekstra
   del: tilføj et punkt til listen, fjern et tilføjet punkt, skjul et fast
   punkt — og vis de skjulte igen. Alt er tekstnøgler (se tekstdata.js), så
   det er kladder til Udgiv, præcis som teksterne. Stien og punktet gemmes
   i variabler, ikke i onclick: en sti med et anførselstegn i ville ellers
   kunne skære knappen over. */
let redListe = null;   // { sti, felt, punkt } for det punkt, arket står på
function redListeFor(n){
  let bedst = null;
  for(const l of LISTE_STIER){
    if(!n.startsWith(l.sti + '.')) continue;
    const rest = n.slice(l.sti.length + 1).split('.');
    if(rest.length === 2 && (!bedst || l.sti.length > bedst.sti.length)) bedst = { sti: l.sti, felt: l.felt, punkt: rest[0] };
  }
  return bedst;
}
function redSkjulte(sti){
  return Object.keys(RED_TEKSTER || {}).filter(k => k.startsWith(sti + '.') && k.endsWith('.skjult')
    && k.slice(sti.length + 1).split('.').length === 2 && RED_TEKSTER[k].tekst === 'ja')
    .map(k => k.slice(sti.length + 1, -'.skjult'.length));
}
function redListeDel(n){
  redListe = redListeFor(n);
  const l = redListe;
  if(!l) return '';
  const tilføjet = l.punkt.startsWith('ny_');
  const skjulte = redSkjulte(l.sti);
  return `<div class="red-liste">
    <div class="etiket">${t('editor.listen','Listen')}</div>
    <button class="knap kontur bred lille" onclick="redArkNytPunkt()">${ik('plus')} ${t('editor.tilfoejpunkt','Tilføj et punkt til listen')}</button>
    ${tilføjet
      ? `<button class="knap stille fare" onclick="redFjernPunkt()">${t('editor.fjernpunkt','Fjern punktet')}</button>`
      : `<button class="knap stille fare" onclick="redSkjulPunkt(null,true)">${t('editor.skjulpunkt','Skjul punktet for kunderne')}</button>`}
    ${skjulte.length ? `<div class="dæmpet red-hjælp">${t('editor.skjulte','Skjult i listen:')}</div>
      ${skjulte.map((p, i) => `<button class="red-skjult" onclick="redSkjulPunkt(${i},false)">${esc(redRen(t(l.sti + '.' + p + '.' + l.felt, p)))} · ${t('editor.visigen','Vis igen')}</button>`).join('')}` : ''}
  </div>`;
}
function redArkNytPunkt(){
  if(!redListe) return;
  redArkSkal(`
    <div class="etiket">${t('editor.etiket','Editor')} · <span class="red-nøgle">${esc(redListe.sti)}</span></div>
    <h2 style="margin-top:4px">${t('editor.nytpunkt','Nyt punkt i listen')}</h2>
    <label class="felt-etiket" for="red-punkt-tekst">${t('editor.punkttekst','Punktet')}</label>
    <input type="text" id="red-punkt-tekst" placeholder="${esc(t('editor.punktplads','Fx Solcreme'))}">
    <label class="felt-etiket" for="red-punkt-tip">${t('editor.punkttip','Lille tekst under (frivillig)')}</label>
    <input type="text" id="red-punkt-tip" placeholder="${esc(t('editor.punkttipplads','Fx faktor 30 eller mere'))}">
    <div id="red-ark-fejl" class="red-fejl" role="alert"></div>
    <div class="modal-knapper">
      <button class="knap kontur bred" onclick="$('red-ark').remove()">${t('faelles.fortryd','Fortryd')}</button>
      <button class="knap primær bred" id="red-punkt-gem" onclick="redGemNytPunkt()">${t('editor.tilfoej','Tilføj')}</button>
    </div>`);
  setTimeout(() => { const f = $('red-punkt-tekst'); if(f) f.focus(); }, 60);
}
async function redGemNøgle(nøgle, faldbak, tekst){
  const svar = await ArytmiRedaktoer.gemTekst(nøgle, faldbak, tekst);
  if(svar.ok) RED_TEKSTER[nøgle] = { faldbak, tekst: svar.tekst };
  return svar;
}
function redEfterListe(besked){
  const ark = $('red-ark'); if(ark) ark.remove();
  anvendListeTekster(); redTæl(); tegn();
  flash(besked, 'tjek');
}
async function redGemNytPunkt(){
  if(redTravl || !redListe) return;
  const { sti, felt } = redListe;
  const tekst = ($('red-punkt-tekst').value || '').trim();
  const tip = ($('red-punkt-tip').value || '').trim();
  if(!tekst){ $('red-ark-fejl').textContent = t('editor.skrivpunkt','Skriv punktet.'); return; }
  const nøgle = ArytmiTekstdata.nytPunktNøgle(sti, felt, tekst);
  if(listeTekst(nøgle)){ $('red-ark-fejl').textContent = t('editor.findesallerede','Listen har allerede et punkt med det navn.'); return; }
  redTravl = true;
  const knap = $('red-punkt-gem'); if(knap) knap.disabled = true;
  let svar = await redGemNøgle(nøgle, tekst, tekst);
  if(svar.ok && tip) svar = await redGemNøgle(nøgle.slice(0, -felt.length) + 'tip', tip, tip);
  redTravl = false;
  if(!svar.ok){ $('red-ark-fejl').textContent = svar.fejl; if(knap) knap.disabled = false; return; }
  redEfterListe(t('editor.punkttilfoejet','Punktet er tilføjet som kladde. Kunderne får det, når du trykker Udgiv.'));
}
function redFjernPunkt(){
  if(!redListe) return;
  const { sti, felt, punkt } = redListe;
  bekræft(t('editor.fjernpunktspm','Fjerne punktet fra listen?'), async () => {
    const base = sti + '.' + punkt + '.';
    let svar = await redGemNøgle(base + felt, (RED_TEKSTER[base + felt] || {}).faldbak || '', null);
    if(svar.ok && RED_TEKSTER[base + 'tip']) svar = await redGemNøgle(base + 'tip', RED_TEKSTER[base + 'tip'].faldbak || '', null);
    if(!svar.ok){ infoModal(esc(svar.fejl)); return; }
    redEfterListe(t('editor.punktfjernet','Punktet er fjernet. Det forsvinder hos kunderne, når du trykker Udgiv.'));
  });
}
/* `i` er nummeret i listen over skjulte punkter, eller null for punktet,
   arket står på. */
async function redSkjulPunkt(i, skjul){
  if(!redListe) return;
  const punkt = i == null ? redListe.punkt : redSkjulte(redListe.sti)[i];
  if(!punkt) return;
  const svar = await redGemNøgle(redListe.sti + '.' + punkt + '.skjult', '', skjul ? 'ja' : null);
  if(!svar.ok){ const f = $('red-ark-fejl'); if(f) f.textContent = svar.fejl; else infoModal(esc(svar.fejl)); return; }
  redEfterListe(skjul ? t('editor.punktskjult','Punktet er skjult. Kunderne ser det ikke, når du har trykket Udgiv.')
                      : t('editor.punktvist','Punktet er med igen.'));
}

async function redGemTekst(nulstil){
  if(redTravl || !redArkNøgle) return;
  const felt = $('red-tekst-felt'), knap = $('red-tekst-gem');
  redTravl = true;
  if(knap){ knap.disabled = true; knap.textContent = t('editor.gemmer','Gemmer …'); }
  const svar = await ArytmiRedaktoer.gemTekst(redArkNøgle, redArkFaldbak, nulstil ? null : (felt ? felt.value : ''));
  redTravl = false;
  if(!svar.ok){
    if(knap){ knap.disabled = false; knap.textContent = t('editor.gem','Gem'); }
    const f = $('red-ark-fejl'); if(f) f.textContent = svar.fejl;
    return;
  }
  RED_TEKSTER[redArkNøgle] = { faldbak: redArkFaldbak, tekst: svar.tekst };
  anvendListeTekster();
  const ark = $('red-ark'); if(ark) ark.remove();
  redTæl();
  tegn();
  flash(t('editor.tekstgemt','Gemt. Kunderne får den, når du trykker Udgiv.'), 'tjek');
}

/* ---------- udgivelsen ---------- */
function redUdgiv(){
  const n = redAntal();
  if(!n) return;
  bekræft(t('editor.udgivspm','Udgiv {antal} rettelser? Alle kunder får dem, næste gang de åbner appen.',{antal:n}), async () => {
    flash(t('editor.udgiver','Udgiver …'), 'blyant');
    const svar = await ArytmiRedaktoer.udgiv();
    if(!svar.ok){ infoModal(esc(svar.fejl)); return; }
    await redHentBundt();
    redTæl();
    tegn();
    flash(t('editor.udgivet','Udgivet. Kunderne får det, næste gang de åbner appen.'), 'tjek');
  });
}
/* Det nye bundt med det samme — ellers tæller bjælken de rettelser, der
   lige er udgivet, indtil appen genstarter. `?t=` kommer forbi Storage'
   60 sekunders cache. */
async function redHentBundt(){
  try{
    const r = await fetch(INDHOLD_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if(!r.ok) return;
    const raat = await r.text();
    saetIndhold(JSON.parse(raat));
    try{ localStorage.setItem(INDHOLD_GEMT, raat); }catch(e){}
  }catch(e){ /* næste opstart henter det */ }
}

/* ---------- fanen "Steder" ---------- */
function skærmRedSteder(){
  if(!editorTil()){ aktivSkærm = 'profil'; skærmProfil(); return; }
  $('indhold').innerHTML = `<div class="side anim">
    ${skærmTop(t('editor.steder','Steder'), 'profil', t('editor.etiket','Editor'))}
    <p class="dæmpet" style="margin:-4px 0 14px">${t('editor.stederunder','Alle steder, også kladderne. Tryk på et sted for at rette det.')}</p>
    <button class="knap primær bred" style="margin-bottom:14px" onclick="redNytStedModal()">${ik('plus')} ${t('editor.tilfoejsted','Tilføj sted')}</button>
    <input type="search" id="red-søg" placeholder="${esc(t('editor.soegsted','Søg efter et sted'))}"
           value="${esc(redStedSøg)}" oninput="redStedSøg=this.value;redTegnStedliste()">
    <div id="red-stedliste" style="margin-top:14px">${redStedliste()}</div>
  </div>`;
}
/* "Tilføj sted" (KN 5/10: "lave muligheden for at tilføje sted under
   steder"). Afløser beslutningen fra 4/10 om, at nye steder kun laves i
   bagrummet. Kun navnet spørges om her; id'et laves af navnet, og resten
   udfyldes i skemaet, som stedet åbner i — som kladde. */
function redNytStedModal(){
  const gammel = $('red-nyt'); if(gammel) gammel.remove();
  const div = document.createElement('div');
  div.id = 'red-nyt';
  div.className = 'modal-bag';
  div.innerHTML = `
    <div class="modal-kort" style="text-align:left">
      <div class="etiket">${t('editor.etiket','Editor')}</div>
      <h2 style="margin-top:4px">${t('editor.nytsted','Nyt sted')}</h2>
      <p class="dæmpet" style="margin-top:6px">${t('editor.nytstedunder','Det bliver en kladde, som kun I kan se. Placering, tekster og billeder udfylder du bagefter.')}</p>
      <label class="felt-etiket" for="red-nyt-navn">${t('editor.stednavn','Stedets navn')}</label>
      <input type="text" id="red-nyt-navn" placeholder="${esc(t('editor.stednavnplads','Fx Blokhus Strand'))}">
      <div id="red-nyt-fejl" class="red-fejl" role="alert"></div>
      <div class="modal-knapper" style="margin-top:16px">
        <button class="knap kontur bred" id="red-nyt-nej">${t('faelles.fortryd','Fortryd')}</button>
        <button class="knap primær bred" id="red-nyt-ja">${t('editor.opret','Opret')}</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  const felt = $('red-nyt-navn');
  setTimeout(() => felt.focus(), 60);
  $('red-nyt-nej').onclick = () => div.remove();
  const ja = async () => {
    const knap = $('red-nyt-ja');
    if(knap.disabled) return;
    knap.disabled = true;
    const liste = KLADDE_RAEKKER || [];
    const optaget = liste.map(r => r.id).concat(TESTEDE.map(x => x.id));
    const sidst = liste.reduce((m, r) => Math.max(m, r.raekkefoelge || 0), 0);
    const svar = await ArytmiRedaktoer.nytSted(felt.value, optaget, sidst + 10);
    knap.disabled = false;
    if(!svar.ok){ $('red-nyt-fejl').textContent = svar.fejl; return; }
    div.remove();
    redLægRækkeInd(svar.raekke);
    redForm = null;
    gåTil('red-sted-' + svar.raekke.id);
    flash(t('editor.stedoprettet','Stedet er oprettet som kladde. Udfyld placeringen, før det kan vises.'), 'tjek');
  };
  $('red-nyt-ja').onclick = ja;
  felt.addEventListener('keydown', e => { if(e.key === 'Enter') ja(); });
}
function redTegnStedliste(){ const el = $('red-stedliste'); if(el) el.innerHTML = redStedliste(); }
/* TO AFSNIT (KN 5/10: "en overskrift hvor der står ikke udgivede steder, så
   man hurtigt kan udgive alle stederne på en gang"). Øverst det, kunderne
   IKKE ser endnu: kladderne og stederne med ændringer, der ikke er udgivet.
   Derunder dem, der står i appen, som de er. */
function redStedliste(){
  if(!KLADDE_RAEKKER) return `<p class="dæmpet">${t('editor.henterSteder','Henter stederne …')}</p>`;
  const q = redStedSøg.trim().toLowerCase();
  const ude = new Set(redUdestående.ture);
  const vist = KLADDE_RAEKKER.filter(r => !q || String(r.navn || '').toLowerCase().includes(q) || r.id.includes(q));
  if(!vist.length) return `<p class="dæmpet">${t('editor.ingensteder','Ingen steder passer.')}</p>`;
  const række = r => {
    const bill = (r.billeder || [])[0];
    const status = [
      r.synlig ? t('editor.iappen','I appen') : t('editor.kladde','Kladde'),
      r.stjerner ? '★'.repeat(r.stjerner) : '',
      t('editor.antalbilleder','{antal} billeder',{antal:(r.billeder || []).length})
    ].filter(Boolean).join(' · ');
    return `<button class="red-sted" onclick="gåTil('red-sted-${esc(r.id)}')">
      <span class="red-sted-billede">${bill ? `<img src="${esc(bill)}" alt="" loading="lazy">` : ik('nål')}</span>
      <span class="red-sted-tekst"><b>${esc(r.navn || r.id)}</b><span>${esc(status)}</span></span>
      ${r.synlig && ude.has(r.id) ? `<span class="red-ikke-udgivet">${t('editor.aendret','Ændret')}</span>` : ''}
    </button>`;
  };
  const ikke = vist.filter(r => !r.synlig || ude.has(r.id));
  const iAppen = vist.filter(r => r.synlig && !ude.has(r.id));
  return `
    ${ikke.length ? `<div class="red-afsnit">
      <h3>${t('editor.ikkeudgivedesteder','Ikke udgivede steder')} <span class="red-antal">${ikke.length}</span></h3>
      <button class="knap primær bred lille" onclick="redUdgivAlleSteder()">${t('editor.udgivallesteder','Udgiv alle steder')}</button>
      <div class="dæmpet red-hjælp">${t('editor.udgivallehjaelp','Kladder med navn og placering bliver vist i appen, og alt udgives. Kladder uden placering bliver liggende.')}</div>
    </div>
    <div class="red-steder">${ikke.map(række).join('')}</div>` : ''}
    ${iAppen.length ? `<div class="red-afsnit"><h3>${t('editor.stederiappen','I appen')} <span class="red-antal">${iAppen.length}</span></h3></div>
    <div class="red-steder">${iAppen.map(række).join('')}</div>` : ''}`;
}
/* Alle kladder, der KAN vises (navn og placering — samme krav som
   databasens tur_kan_vises), sættes synlige, og så udgives det hele. En
   halvfærdig kladde springes over og nævnes; den skal ikke spærre for resten. */
function redUdgivAlleSteder(){
  const kladder = (KLADDE_RAEKKER || []).filter(r => !r.synlig);
  const klar = kladder.filter(r => r.navn && r.lat != null && r.lon != null);
  const uklar = kladder.filter(r => !klar.includes(r));
  const spm = t('editor.udgivallespm','Udgiv alle steder? {antal} kladder bliver vist i appen, og alle ændringer — også tekster — sendes ud til kunderne.',{antal:klar.length})
    + (uklar.length ? '<br><br>' + t('editor.udgivalleuklar','Mangler placering og bliver liggende: {navne}.',{navne:esc(uklar.map(r => r.navn || r.id).join(', '))}) : '');
  bekræft(spm, async () => {
    flash(t('editor.udgiver','Udgiver …'), 'blyant');
    for(const r of klar){
      const svar = await ArytmiRedaktoer.gemTur(r.id, { synlig: true });
      if(!svar.ok){ infoModal(esc((r.navn || r.id) + ': ' + svar.fejl)); return; }
      redLægRækkeInd(svar.raekke);
    }
    const svar = await ArytmiRedaktoer.udgiv();
    if(!svar.ok){ infoModal(esc(svar.fejl)); tegn(); return; }
    await redHentBundt();
    redTæl();
    tegn();
    flash(t('editor.allestederudgivet','Stederne er udgivet. Kunderne får dem, næste gang de åbner appen.'), 'tjek');
  });
}

/* ---------- ét sted ---------- */
const RED_ØNSKER = [
  ['oe_lys', 'Lys', [['','Ikke valgt (= begge)'],['solopgang','Solopgang'],['solnedgang','Solnedgang'],['begge','Begge'],['ingen','Ingen af dem']]],
  ['oe_natur', 'Natur', [['','Ikke valgt (= begge)'],['vand','Vand'],['land','Land'],['begge','Begge']]],
  ['oe_stemning', 'Stemning', [['','—'],['isoleret','Isoleret'],['livligt','Livligt']]]
];
function skærmRedSted(id){
  if(!editorTil()){ aktivSkærm = 'profil'; skærmProfil(); return; }
  const r = (KLADDE_RAEKKER || []).find(x => x.id === id);
  if(!r){
    $('indhold').innerHTML = `<div class="side anim">${skærmTop(t('editor.steder','Steder'), 'red-steder', t('editor.etiket','Editor'))}
      <p class="dæmpet">${t('editor.henterSteder','Henter stederne …')}</p></div>`;
    return;
  }
  if(!redForm || redForm.id !== id) redForm = JSON.parse(JSON.stringify(r));
  const f = redForm;
  const ændret = JSON.stringify(f) !== JSON.stringify(r);
  const tekst = (felt, label, hjælp, linjer) => `
    <label class="felt-etiket" for="red-${felt}">${label}</label>
    ${linjer ? `<textarea id="red-${felt}" rows="${linjer}" oninput="redFelt('${felt}',this.value)">${esc(f[felt] || '')}</textarea>`
             : `<input type="text" id="red-${felt}" value="${esc(f[felt] || '')}" oninput="redFelt('${felt}',this.value)">`}
    ${hjælp ? `<div class="dæmpet red-hjælp">${hjælp}</div>` : ''}`;
  const vælg = (felt, label, valg) => `
    <label class="felt-etiket" for="red-${felt}">${label}</label>
    <select id="red-${felt}" onchange="redFelt('${felt}',this.value)">
      ${valg.map(([v, navn]) => `<option value="${v}"${String(f[felt] ?? '') === v ? ' selected' : ''}>${navn}</option>`).join('')}
    </select>`;
  const flueben = (felt, label, hjælp) => `
    <label class="red-flueben"><input type="checkbox" ${f[felt] ? 'checked' : ''} onchange="redFelt('${felt}',this.checked)">
      <span>${label}${hjælp ? `<span class="dæmpet">${hjælp}</span>` : ''}</span></label>`;
  const bill = f.billeder || [];
  $('indhold').innerHTML = `<div class="side anim red-skema">
    ${skærmTop(esc(f.navn || f.id), 'red-steder', f.synlig ? t('editor.iappen','I appen') : t('editor.kladde','Kladde'))}
    ${f.lat != null && f.lon != null ? `<button class="knap kontur bred" onclick="gåTil('testet-${esc(f.id)}')">${ik('stjerne')} ${t('editor.sestedet','Se stedet, som kunden ser det')}</button>` : ''}

    <div class="kort">
      <div class="etiket">${t('editor.synlighed','Synlighed')}</div>
      ${flueben('synlig', t('editor.vis','Vis stedet i appen'), t('editor.visunder','Uden flueben er det en kladde, som kun I kan se.'))}
    </div>

    <div class="kort">
      <div class="etiket">${t('editor.billeder','Billeder')}</div>
      <div class="red-billeder">
        ${bill.map((b, i) => `<div class="red-billede">
          <img src="${esc(b)}" alt="" loading="lazy">
          ${i === 0 ? `<span class="red-forside">${t('editor.forsidebillede','Forside')}</span>`
                    : `<button class="red-bill-knap venstre" onclick="redFørsteBillede(${i})" aria-label="${esc(t('editor.goerforside','Gør til forsidebillede'))}">${ik('stjerne')}</button>`}
          <button class="red-bill-knap" onclick="redFjernBillede(${i})" aria-label="${esc(t('editor.fjernbillede','Fjern billedet'))}">${ik('kryds')}</button>
        </div>`).join('')}
        <label class="red-billede red-tilfoej">${ik('plus')}<span>${t('editor.tilfoejbillede','Tilføj billede')}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onchange="redTilføjBillede(this)" class="sr-only"></label>
      </div>
      <div class="dæmpet red-hjælp">${t('editor.billedhjaelp','Billederne skaleres ned, og nummerplader sløres, før de lægges op. Billederne gemmes med det samme.')}</div>
    </div>

    <div class="kort">
      <div class="etiket">${t('editor.teksterne','Teksterne')}</div>
      ${tekst('navn', 'Navn', 'Det, der står øverst på skærmen.')}
      ${tekst('ord', 'Ét ord', 'Kendetegnet — “Vandkanten”, “Bunkere”, “Fyret”.')}
      ${tekst('kort', 'Kort beskrivelse', 'Én linje. Den står på listen med forslag.', 2)}
      ${tekst('beskrivelse', 'Den lange beskrivelse', '', 8)}
    </div>

    <div class="kort">
      <div class="etiket">${t('editor.vurdering','Jeres vurdering')}</div>
      ${vælg('stjerner', 'Stjerner', [['','Ingen'],['1','★'],['2','★★'],['3','★★★'],['4','★★★★'],['5','★★★★★']])}
      ${flueben('anbefalet', 'Anbefalet af Arytmi')}
      ${flueben('god_til_boern', 'God til børn')}
      ${flueben('klar', 'Testet af Arytmi', 'Uden flueben står der “Måske — vi tester igen”.')}
    </div>

    <div class="kort">
      <div class="etiket">${t('editor.oensker','Ønskerne')}</div>
      ${RED_ØNSKER.map(([felt, label, valg]) => vælg(felt, label, valg)).join('')}
    </div>

    <div class="kort">
      <div class="etiket">${t('editor.faciliteter','Faciliteter')}</div>
      ${tekst('fac_toilet', 'Toilet', 'Tomt = vi ved det ikke, og så står der “Ikke noteret”.')}
      <!-- Indkøb, aftensmad og morgenmad er taget ud (KN 5/10: "vi vil ikke have det
           i appen mere"). Kunden så dem ikke i forvejen (se faciliteterKort); felterne
           står stadig i databasen. -->
    </div>

    <div class="kort">
      <div class="etiket">${t('editor.placering','Placering')}</div>
      <div class="red-to">
        <div><label class="felt-etiket" for="red-lat">${t('editor.breddegrad','Breddegrad')}</label>
          <input type="text" inputmode="decimal" id="red-lat" value="${f.lat ?? ''}" oninput="redFelt('lat',this.value)"></div>
        <div><label class="felt-etiket" for="red-lon">${t('editor.laengdegrad','Længdegrad')}</label>
          <input type="text" inputmode="decimal" id="red-lon" value="${f.lon ?? ''}" oninput="redFelt('lon',this.value)"></div>
      </div>
      ${'adresse' in f ? tekst('adresse', t('editor.adresse','Adresse'), t('editor.adressehjaelp','Den, man skriver i GPS’en. Står over koordinaterne under “Sådan finder I derhen”.')) : ''}
      <button class="knap kontur bred lille" style="margin-top:12px" onclick="redMinPlacering()">${ik('gps')} ${t('editor.minplacering','Brug min placering')}</button>
    </div>

    <div id="red-sted-fejl" class="red-fejl" role="alert"></div>
    <button class="knap primær bred" id="red-gem" onclick="redGemSted()" ${ændret ? '' : 'disabled'}>${ændret
      ? t('editor.gemsted','Gem som kladde') : t('editor.intetændret','Intet at gemme')}</button>
    ${ændret ? `<div style="text-align:center;margin-top:10px"><button class="tekst-knap red-link" onclick="redForm=null;tegn()">${t('editor.fortrydaendringer','Fortryd ændringerne')}</button></div>` : ''}
    ${!r.synlig ? `<div class="stille-række" style="margin-top:22px">
      <button class="knap stille fare" onclick="redSletKladde('${esc(r.id)}')">${t('editor.sletkladde','Slet kladden')}</button></div>` : ''}
  </div>`;
}
/* Kun kladder (se sletKladde i redaktoer.js). Et sted i appen skal først
   have fluebenet fjernet og være udgivet sådan. */
function redSletKladde(id){
  bekræft(t('editor.sletspm','Slette kladden for altid? Billederne bliver liggende i spanden.'), async () => {
    const svar = await ArytmiRedaktoer.sletKladde(id);
    if(!svar.ok){ infoModal(esc(svar.fejl)); return; }
    const liste = (KLADDE_RAEKKER || []).filter(r => r.id !== id);
    fjernKladder();
    KLADDE_RAEKKER = liste;
    anvendKladder();
    redTæl();
    redForm = null;
    nulstilHistorik();
    gåTilErstat('red-steder');
    flash(t('editor.slettet','Kladden er slettet.'), 'tjek');
  });
}
/* Felterne skriver i formularen uden at tegne skærmen om — ellers mistede
   feltet fokus ved hvert bogstav. Kun knappen følger med. */
function redFelt(felt, v){
  if(!redForm) return;
  if(felt === 'stjerner') v = v === '' ? null : Number(v);
  if(felt === 'lat' || felt === 'lon'){
    const tal = parseFloat(String(v).replace(',', '.'));
    v = String(v).trim() === '' ? null : (Number.isFinite(tal) ? tal : redForm[felt]);
  }
  redForm[felt] = v;
  const knap = $('red-gem');
  if(knap){ knap.disabled = false; knap.textContent = t('editor.gemsted','Gem som kladde'); }
}
function redMinPlacering(){
  if(!navigator.geolocation){ infoModal(esc(t('editor.ingengps','Telefonen kan ikke give en placering.'))); return; }
  flash(t('editor.findergps','Finder din placering …'), 'gps');
  navigator.geolocation.getCurrentPosition(p => {
    redForm.lat = Math.round(p.coords.latitude * 1e6) / 1e6;
    redForm.lon = Math.round(p.coords.longitude * 1e6) / 1e6;
    tegn();
  }, () => infoModal(esc(t('editor.gpsfejl','Placeringen kunne ikke findes. Tjek, at appen må bruge den.'))),
  { enableHighAccuracy: true, timeout: 15000 });
}
/* Rækken er gemt: læg den ind, og byg stederne forfra — kode, så det
   udgivne bundt, så kladderne. Samme stak som ved opstart. */
function redLægRækkeInd(r){
  const liste = KLADDE_RAEKKER || [];
  const i = liste.findIndex(x => x.id === r.id);
  if(i >= 0) liste[i] = r; else liste.push(r);
  fjernKladder();
  KLADDE_RAEKKER = liste;
  anvendKladder();
  redTæl();
}
async function redGemSted(){
  if(redTravl || !redForm) return;
  redTravl = true;
  const knap = $('red-gem');
  if(knap){ knap.disabled = true; knap.textContent = t('editor.gemmer','Gemmer …'); }
  const svar = await ArytmiRedaktoer.gemTur(redForm.id, redForm);
  redTravl = false;
  if(!svar.ok){
    const f = $('red-sted-fejl'); if(f) f.textContent = svar.fejl;
    if(knap){ knap.disabled = false; knap.textContent = t('editor.gemsted','Gem som kladde'); }
    return;
  }
  redLægRækkeInd(svar.raekke);
  redForm = JSON.parse(JSON.stringify(svar.raekke));
  tegn();
  flash(t('editor.stedgemt','Gemt som kladde. Tryk Udgiv, når kunderne skal have det.'), 'tjek');
}
/* Billederne gemmes med det samme og ikke med "Gem": et billede, der er
   lagt op, men aldrig skrevet på stedet, ligger i spanden uden at nogen
   kan finde det igen. Resten af formularen bliver, som hun har skrevet. */
async function redGemBilleder(liste){
  const svar = await ArytmiRedaktoer.gemTur(redForm.id, { billeder: liste });
  if(!svar.ok){ infoModal(esc(svar.fejl)); return false; }
  const rest = redForm;
  redLægRækkeInd(svar.raekke);
  redForm = Object.assign({}, rest, { billeder: svar.raekke.billeder.slice() });
  return true;
}
async function redTilføjBillede(input){
  const filer = Array.from(input.files || []);
  input.value = '';
  if(!filer.length || !redForm) return;
  let plader = 0;
  for(const fil of filer){
    flash(t('editor.billedeop','Lægger billedet op — nummerplader sløres først …'), 'blyant');
    const svar = await ArytmiRedaktoer.laegOpBillede(redForm.id, fil);
    if(!svar.ok){ infoModal(esc(svar.fejl)); tegn(); return; }
    plader += svar.plader || 0;
    if(!await redGemBilleder((redForm.billeder || []).concat(svar.url))){ tegn(); return; }
  }
  tegn();
  flash(plader
    ? t('editor.billedeplader','Billedet er lagt op. {antal} nummerplader er sløret.',{antal:plader})
    : t('editor.billedelagtop','Billedet er lagt op.'), 'tjek');
}
function redFjernBillede(i){
  bekræft(t('editor.fjernspm','Fjerne billedet fra stedet?'), async () => {
    const liste = (redForm.billeder || []).filter((_, n) => n !== i);
    if(await redGemBilleder(liste)) tegn();
  });
}
async function redFørsteBillede(i){
  const liste = (redForm.billeder || []).slice();
  const [b] = liste.splice(i, 1);
  liste.unshift(b);
  if(await redGemBilleder(liste)) tegn();
}

/* ---------- Profil & indstillinger ----------

   KN 15/9: "Det hele er meget stort, jeg vil gerne have lavet det mere
   flot og laekkert evt med dropdown bokse?"

   HVORFOR DET VAR STORT: hver indstilling var et helt kort — ikon,
   overskrift, en forklarende paragraf og en knap i fuld bredde. Fem af dem
   stablet blev 1551 px paa en skaerm, der er 812. Man scrollede gennem to
   skaermfulde for at naa bunden, og fordi alle fem saa ens ud, var der
   ingen forskel paa "din konto" og "lyset i appen".

   FORKLARINGERNE ER IKKE SKAARET VAEK. De er lagt BAG raekken. Man ser,
   hvad indstillingen hedder, og hvad den staar paa — og folder kun ud,
   hvis man er i tvivl. Ikke ét ord er aendret; de staar bare, hvor de
   hoerer til: efter spoergsmaalet, ikke foer det.

   MOENSTRET ER APPENS EGET. Samme greb som bilens emner (`bilFold`):
   `.liste` med `.liste-punkt`-raekker og en `.bil-krop`, der folder sig
   ud. Ingen ny komponent, ingen ny animation, ingen nye tekstnoegler. */
/* Foedselsdagen staar som "12. maj 1980" — pænDato() kan ikke bruges her,
   for den skriver ugedagen med, og hvilken ugedag man blev foedt paa er
   ikke en oplysning, nogen har brug for. */
function fødselsdagTekst(iso){
  const d = new Date(iso + 'T12:00:00');
  if(isNaN(d)) return iso;
  return d.getDate() + '. ' + MDR[d.getMonth()] + ' ' + d.getFullYear();
}

/* TELEFONNUMMERET VISES, MEN KAN IKKE RETTES — og det er med vilje.
   `sync.js` sender kun navn, foedselsdag og notifikationer op; telefonen
   hentes NED fra serveren (app.js ved aktiveringen) og gaar aldrig den
   anden vej. Et felt, man kan skrive i, og som lydloest ikke bliver gemt,
   er vaerre end intet felt. Skal nummeret kunne rettes, skal udbakken
   kunne baere det foerst. Derfor staar det som en vaerdi, ikke som et
   input — og kun naar der ER et nummer. */
/* RET-TILSTANDEN (KN 15/9: "Husk lige en redigerknap saa man kan aendre
   sit navn eller telefonnummer samt mail hvis man nu skifter det ene eller
   det andet.")

   HVAD DER FAKTISK KAN RETTES — spurgt i databasen, ikke gaettet.
   `authenticated` har UPDATE paa profiler:

     navn            ja
     foedselsdag     ja
     notifikationer  ja
     telefon         NEJ — kun SELECT
     email           NEJ — kun SELECT
     rolle           NEJ — og saadan skal det blive

   De to sidste er laast med vilje i 0006 ("laas de kolonner brugeren ikke
   ejer"), og mailen er desuden selve kontoen: den skiftes gennem en
   bekraeftelse paa BEGGE adresser hos Supabase, ikke ved at skrive i et
   felt. Et felt, der ser redigerbart ud og lydloest ikke bliver gemt, er
   vaerre end intet felt — derfor staar de to som vaerdier med en linje,
   der siger hvorfor.

   Skal telefonen kunne rettes, er der tre ting og ikke ét: en `grant
   update` paa kolonnen, telefonen med i udbakken (sync.js sender den ikke
   op i dag), og en beslutning om, hvad nummeret saa ER, naar det ikke
   laengere er det, invitationen gik til. Det er Kennets valg, ikke mit. */
let retterKonto = false;
function kontoRet(){ retterKonto = !retterKonto; tegn(); }

let åbenIndstilling = {};
function indstilFold(id){ åbenIndstilling[id] = !åbenIndstilling[id]; tegn(); }

function skærmProfil(){
  const p = s.profil;

  /* Én raekke: en kontakt til hoejre, et (i) ved siden af.

     KN 15/9, da foerste udgave foldede en knap i fuld bredde ud:
     "Dette ser da ogsaa dumt ud.. Kan du ikke bare lave en slider til/fra
     og en Info boks (i)". Han har ret — en indstilling, der kan vaere til
     eller fra, skal betjenes dér hvor den staar, ikke gennem en udfoldet
     knap, der fylder en tredjedel af skaermen.

     (i)-ikonet er ikke nyt: det er `.bil-info`, samme greb som paa bilens
     tjekliste — "der er mere at laese, men du behoever ikke". De to tryk er
     adskilt, saa man ikke kommer til at slaa en indstilling fra, fordi man
     ville laese om den.

     IKONERNE — KN 15/9: "Enten skal du fjerne ikonerne eller saa skal de
     ogsaa have en overhaling og staa paent sammen med teksten."

     De bliver. En klokke, en blyant og en maane kan aflaeses paa et halvt
     sekund, hvor tre linjer tekst ikke kan. Men de sad loest: forskellig
     optisk stoerrelse, og raekkerne var ikke lige hoeje, saa de flugtede
     ikke lodret. Nu har hvert ikon sin egen celle med fast maal og samme
     stregtykkelse — og HVER raekke har en undertekst, saa alle tre er lige
     hoeje og ikonerne staar paa linje.

     Underteksten er samtidig den aerlige loesning paa, at en kontakt ikke
     kan sige, hvad "Lyset i appen" slaaet til betyder. Nu staar der
     "Foelger doegnet". Alle fire tekster fandtes i forvejen. */
  const række = (id, ikon, titel, til, handling, brød, under) => {
    const åben = !!åbenIndstilling[id];
    return `
      <div class="liste-punkt indstil-række">
        <span class="indstil-ikon">${ik(ikon)}</span>
        <div class="navn">${titel}<div class="indstil-under">${under}</div></div>
        <!-- Kontakten staar FOER (i) (KN 15/9). Med (i) yderst staar de fire
             informationsikoner i samme kolonne — ogsaa paa rejsemakkerraekken,
             der ingen kontakt har. Med den omvendte raekkefoelge hang det ene
             (i) ud til hoejre for de tre andre. -->
        <button class="kontakt ${til?'til':''}" role="switch" aria-checked="${til}"
          aria-label="${esc(titel)}" onclick="${handling}"></button>
        <button class="bil-info" onclick="indstilFold('${id}')" aria-expanded="${åben}"
          aria-label="${esc(t('indstil.mereom','Mere om {navn}',{navn:titel}))}">${ik('info')}</button>
      </div>
      ${åben?`<div class="bil-krop"><p class="dæmpet" style="font-size:13.5px;margin:0">${brød}</p></div>`:''}`;
  };

  /* BESKEDER ER ÆGTE NU (K22, 7/10). Indtil da stod der, at påmindelserne
     "ikke er sat i gang endnu" — og den 16/9 blev en advarsel om at slå
     noget fra, der aldrig havde været tændt, fjernet herfra. Teksten skal
     stadig være sand i dag: den siger, HVOR påmindelsen kommer (telefon
     eller mail), og det er det, serveren gør (paamind-afholdt).

     Underteksten skal ikke læse kontakten højt — den skal sige, hvad
     tilstanden BETYDER: Fra, eller Til og hvorhen. */
  const kanal = beskedKanal();
  const beskeder = række('beskeder','klokke',
    t('indstil.beskeder','Beskeder'),
    !!p.notifikationer,
    'skiftBeskeder()',
    t('indstil.beskederhvorfor','Dagen efter din tur minder vi dig om at anmelde den, så du senere kan huske det bedste og rette det, der kunne være bedre.')
      + (!p.notifikationer
          ? `</p><div class="advarsel" style="margin-top:10px">${t('indstil.beskederslaaetfra','Du har slået påmindelserne fra. Vi minder dig ikke om at anmelde turen.')}</div><p>`
          : kanal === 'kan' ? '' : ' ' + beskedKanalTekst(kanal)),
    !p.notifikationer ? t('indstil.fra','Fra')
      : kanal === 'telefon' ? t('indstil.beskedertelefon','Til · på telefonen')
      : t('indstil.beskedermail','Til · på mail'));
  /* Til, men påmindelsen kommer på mail, og telefonen KAN give besked: så
     står spørgsmålet fremme og ikke gemt bag (i). Kontakten er til fra
     start (onboardingen), så ellers ville ingen nogensinde blive spurgt. */
  const beskederTilbud = (p.notifikationer && kanal === 'kan')
    ? `<div class="bil-krop"><p class="dæmpet" style="font-size:13.5px;margin:0">${beskedKanalTekst(kanal)}</p>
        <button class="knap kontur lille" onclick="slåBeskederTil()">${t('beskeder.knap','Ja tak, på telefonen')}</button></div>`
    : '';

  /* Editor-tilstanden (KN 5/10). Kun for admins. */
  const editor = !erAdmin() || !window.ArytmiRedaktoer ? '' : række('editor','blyant',
    t('indstil.editor','Editor-tilstand'),
    editorTil(),
    'skiftEditor()',
    t('indstil.editorbrod','Ret tekster, steder og billeder direkte i appen — tryk længe på en tekst, eller brug “Ret tekst” nederst. Rettelserne er kladder, til du trykker Udgiv; så får alle kunder dem. Kræver koden fra din authenticator-app.'),
    editorTil()?t('indstil.til','Til'):t('indstil.fra','Fra'));

  /* "Kladder"-kontakten er fjernet fra profilen (KN 5/10: "fjern denne
     knap"). Kladderne skal i stedet følge med editor-tilstanden. Har en admin
     slået dem til før 5/10, står de til på den telefon, indtil da. */

  const lys = række('lys','måne',
    t('indstil.lys','Lyset i appen'),
    temaValg()==='døgn',
    "s.profil.tema = temaValg()==='døgn' ? 'lys' : 'døgn'; gem(); tegn()",
    t('indstil.lysunder','Appen kan følge lyset dér, hvor I skal hen — lyst om dagen, dæmpet om aftenen, mørkt om natten, ligesom landskabet på forsiden. Solopgang og solnedgang regnes ud fra jeres destination og turens dato.'),
    temaValg()==='døgn'?t('indstil.foelgerdoegnet','Følger døgnet'):t('indstil.altidlys','Altid lys'));

  $('indhold').innerHTML = `<div class="side anim">
    ${skærmTop(t('indstil.overskrift','Profil & indstillinger'),'hjem')}
    <!-- Kontoen er telefonnummeret (7/9). Feltet er IKKE til at rette i:
         nummeret er ikke en oplysning om dig, det er den nøgle, alt dit
         hænger på. Skal det skiftes, skal begge numre bekræftes med hver sin
         kode — det bygges, når nogen faktisk har brug for det. -->
    <div class="liste-etiket-række">
      <label class="felt-etiket liste-etiket">${t('indstil.konto','Din konto')}</label>
      <button class="liste-ret" onclick="kontoRet()">${retterKonto?t('faelles.faerdig','Færdig'):t('faelles.ret','Ret')}</button>
    </div>
    <div class="liste indstil-liste">
      <div class="liste-punkt konto-række">
        <div class="navn">${t('indstil.navn','Navn')}</div>
        <input class="konto-felt ${retterKonto?'retter':''}" type="text" value="${esc(p.navn||'')}" placeholder="${esc(t('indstil.navnplads','Fx Kennet'))}" ${retterKonto?'':'readonly'} oninput="s.profil.navn=this.value;gem()">
      </div>
      <div class="liste-punkt konto-række">
        <div class="navn">${t('indstil.mail','Mail')}</div>
        <span class="konto-værdi">${esc(p.email || t('indstil.ikkeloggetind','Ikke logget ind'))}</span>
      </div>
      ${(p.fødselsdag||retterKonto)?`<div class="liste-punkt konto-række">
        <div class="navn">${t('indstil.foedselsdag','Fødselsdag')}</div>
        ${retterKonto
          ? `<input class="konto-felt retter" type="date" value="${esc(p.fødselsdag||'')}" onchange="s.profil.fødselsdag=this.value;gem();tegn()">`
          : `<span class="konto-værdi">${esc(fødselsdagTekst(p.fødselsdag))}</span>`}
      </div>`:''}
      ${p.telefon?`<div class="liste-punkt konto-række">
        <div class="navn">${t('indstil.telefon','Telefonnummer')}</div>
        <span class="konto-værdi">${esc(ArytmiAuth.visTelefon(p.telefon) || p.telefon)}</span>
      </div>`:''}
    </div>
    <p class="dæmpet konto-note">${retterKonto
      ? t('indstil.laastefelter','Mail og telefonnummer hører til selve kontoen og kan ikke ændres her. Skal de skiftes, skal begge dele bekræftes — skriv til os, så ordner vi det.')
      : t('indstil.kontounder','Din mailadresse er din konto — den, du købte Arytmi med. Logger du ind på en ny telefon, er alle dine ture der.')}</p>
    ${partnerAktiv()?'':partnerKort()}
    <div class="liste indstil-liste">
      ${partnerAktiv()?partnerKort():''}
      ${beskeder}${beskederTilbud}
      ${editor}
      ${lys}
    </div>
    <!-- "Nulstil prototypen" og prototype-foden er fjernet 15/9 paa Kennets
         ord. De hoerte til en prototype, ikke til en app, der ligger i Play:
         den ene slettede alle brugerens data bag én bekraeftelse, den anden
         fortalte kunden, at hun brugte et udkast. Noeglerne
         indstil.nulstil, indstil.nulstilspm og indstil.foden bliver
         staaende i databasen — de er ikke i vejen, og de kan tages i brug
         igen uden en udgivelse. -->
    <div class="indstil-fod">
      <button class="knap kontur lille" onclick="logUdAfArytmi()">${t('indstil.logud','Log ud')}</button>
      <!-- Sletningen er IKKE en knap ved siden af Log ud. Den er et lille,
           dæmpet link nedenunder, og den fører til en skærm, ikke til en
           handling. Google Play og App Store kræver, at den findes i appen;
           de kræver ikke, at den råber. Samme afstand som til "Nulstil
           prototypen", der blev fjernet 15/9 netop fordi den slettede alt
           bag én bekræftelse. -->
      <button class="slet-link" onclick="gåTil('slet-konto')">${t('indstil.sletkonto','Slet din konto')}</button>
    </div>
  </div>`;
}

/* =============================================================
   VÆRKTØJSKASSEN (KN 6/9) — vejr · lommelygte · tommestok · nivellering

   Fire små ting man har brug for PÅ turen, ikke før den. De ligger
   nederst på Hjem, under turen — man skal ikke lede efter dem i en
   menu, men de skal heller ikke stjæle skærmen fra det, forsiden
   handler om. Derfor er den fuldskærms-hero gjort 66 px kortere, så
   toppen af kassen kigger frem under folden: se .hero.fuld i app.css.

   MOTOREN ligger i vaerktoejskasse/core.js + adapters.js (leveret som
   selvstændig pakke med 16 enhedstests — kør `npm test` i den mappe).
   BRUGERFLADEN er skrevet her, i appens eget sprog. Den medfølgende
   toolbox.js/toolbox.css havde sit eget designsystem, sin egen header
   og sin egen navigation — og tre navigationer i én app er én for meget.

   HVAD DER VIRKER HVOR:
   - Vejr virker overalt. Åbner Yr på destinationens koordinater.
   - Lommelygte og nivellering kræver sikker kontekst (https eller
     localhost). På LAN-adressen 192.168.0.173:8641 slår browseren dem
     fra — det er ikke en fejl i koden.
   - Tommestokken kræver den native app (ARKit/ARCore). Kildekoden ligger
     klar i vaerktoejskasse/native/. Der simuleres ALDRIG et måltal.
   ============================================================= */
const VÆRKTØJ = [
  { skærm:'vk-vejr',   navn:'Vejr',        under:'Hvad bringer dagen?', ikon:'vejr'   , nøgle:'vejr'  },
  { skærm:'vk-lygte',  navn:'Lommelygte',  under:'Lys i mørket',        ikon:'lygte'  , nøgle:'lygte' },
  /* Hed "Lineal" indtil 7/9 (KN) — en lineal er til papir, en tommestok er
     til at måle, om campingvognen kan være der. Skærm-id, ikonnøgle og
     css-klasser står urørt: de er nøgler, ikke tekst. */
  { skærm:'vk-lineal', navn:'Tommestok',   under:'Er der plads?',       ikon:'lineal' , nøgle:'lineal' },
  { skærm:'vk-niveau', navn:'Nivellering', under:'Ligger I lige?',      ikon:'vater'  , nøgle:'niveau' }
];
const VK_SKÆRME = VÆRKTØJ.map(v=>v.skærm);
/* Navn og undertekst som tekstnøgler (5/10), så editoren kan rette dem på
   forsiden. Bogstavelige t()-kald, ét pr. tekst — hent-noegler.mjs læser
   nøglerne ud af koden og kan ikke se en sammensat nøgle. */
function vkTekst(v){
  const tekster = {
    vejr:   [t('vk.vejrnavn','Vejr'),          t('vk.vejrunder','Hvad bringer dagen?')],
    lygte:  [t('vk.lygtenavn','Lommelygte'),   t('vk.lygteunder','Lys i mørket')],
    lineal: [t('vk.linealnavn','Tommestok'),   t('vk.linealunder','Er der plads?')],
    niveau: [t('vk.niveaunavn','Nivellering'), t('vk.niveauunder','Ligger I lige?')]
  };
  const [navn, under] = tekster[v.nøgle] || [v.navn, v.under];
  return { navn, under };
}
/* Motoren indlæses fra to selvstændige filer. Mangler de (fx i
   navigationstesten, hvis den kun kører app.js), skal appen ikke gå i
   stykker — så siger værktøjerne bare fra. */
function vkKerne(){ return typeof window !== 'undefined' ? window.ArytmiToolboxCore : null; }
let vkBro = null, vkBroFejl = null;
function vkAdapter(){
  if(vkBro || vkBroFejl) return vkBro;
  const A = (typeof window !== 'undefined') ? window.ArytmiToolboxAdapters : null;
  if(!A){ vkBroFejl = new Error('Værktøjerne kunne ikke indlæses. Genindlæs appen.'); return null; }
  try{
    vkBro = A.createAdapter(window, {});
    // Lampen kan slukkes af andre apps eller af telefonen selv.
    vkBro.observeTorch(tændt=>{ vkLys = !!tændt; vkMalLygte(); }).catch(()=>{});
  }catch(e){ vkBroFejl = e; }
  return vkBro;
}
function vkFejltekst(e){
  const C = vkKerne();
  return C ? C.errorMessage(e) : ((e && e.message) || 'Noget gik galt. Prøv igen.');
}

/* ---------- tilstand (overlever tegn(), som rydder hele DOM'en) ---------- */
let vkLys = false;            // lommelygten tændt
let vkNiveauKører = false;    // niveaumåleren i gang
let vkRå = null;              // sidste udjævnede sensorvektor
let vkAflæsning = null;       // roll/pitch
let vkNulpunkt = null;        // relativ reference
let vkSidsteData = 0;         // tidsstempel for sidste sensorsignal
let vkVagt = null;            // holder øje med at der stadig kommer data
let vkMålinger = [];          // tommestokkens resultater, kun mens appen er åben
let vkSted = null;            // {latitude,longitude} til vejret
let vkStedNavn = '';
let vkAktivSkærm = null;      // hvilket værktøj der er tegnet lige nu

/* Alt hardware slukkes, når man forlader værktøjet. Kaldes fra tegn(),
   så det sker uanset HVORDAN man forlod skærmen — knap, bundnavigation
   eller tilbage. */
function vkStopVisning(){
  if(vkVagt){ clearInterval(vkVagt); vkVagt = null; }
  vkNiveauKører = false; vkSidsteData = 0; vkAflæsning = null; vkRå = null;
}
function vkSkærmskift(ny){
  const erVærktøj = VK_SKÆRME.includes(ny);
  if(vkAktivSkærm && vkAktivSkærm !== ny){
    vkStopVisning();
    vkLys = false;
    /* Nulpunktet ryddes med. Skærmen lover "det gælder, indtil du forlader
       værktøjet" — et nulpunkt fra en anden flade, en anden dag, ville lyve
       stille om, hvad vandret er. */
    vkNulpunkt = null;
    if(vkBro) vkBro.suspend().catch(()=>{});
  }
  vkAktivSkærm = erVærktøj ? ny : null;
}
function vkBesked(tekst, fejl){
  const el = document.querySelector('[data-vk-status]');
  if(!el) return;
  el.textContent = tekst || '';
  el.classList.toggle('vk-fejl', !!fejl);
}

/* ---------- blokken nederst på Hjem ---------- */
function værktøjskasse(){
  /* Blokken er et ark, der skydes op over landskabet (KN 11/9) — derfor den
     negative topmargin og de runde tophjørner i CSS'en. Før sluttede hero'en
     i en lige, hård kant tværs over skærmen.
     --i på hvert kort er dets plads i rækken. Den bruges KUN til at forskyde
     indtoningen; se .vk-kort i app.css. */
  /* Grebet er tilbage — og nu er det sandt. Det blev fjernet tidligere samme
     dag, fordi arket ikke kunne trækkes. Det kan det stadig ikke, men det
     BEHØVER det ikke: blokken ligger lige under folden, så et swipe op ér
     bevægelsen, der henter den frem. Vinket siger det højt, og det forsvinder
     af sig selv, når man har gjort det. Se vkScrollEffekt(). */
  return `<div class="vk-blok">
    <div class="vk-greb" aria-hidden="true"></div>
    <p class="vk-vink" aria-hidden="true">${t('vk.swipeop','Swipe op for værktøjskassen')}
      <svg class="vk-vink-pil" viewBox="0 0 16 10"><path d="M2 8l6-6 6 6"/></svg></p>
    <div class="vk-top">
      <h2>${t('vk.kassetitel','Værktøjskassen')}</h2>
      <span class="etiket">${t('vk.kasseunder','Til det praktiske')}</span>
    </div>
    <div class="vk-grid">
      ${/* Tommestokken måler med ARKit/ARCore og findes kun i den pakkede app.
           På hjemmeskærmen (K22) er den væk i stedet for at sige nej. */
        VÆRKTØJ.filter(v => v.nøgle !== 'lineal' || erNativeApp()).map((v,i)=>{ const vt = vkTekst(v); return `
      <button class="vk-kort" style="--i:${i}" onclick="gåTil('${v.skærm}')" aria-label="${esc(vt.navn)} — ${esc(vt.under)}">
        <span class="vk-ikon">${ik(v.ikon)}</span>
        <span class="vk-tekst">
          <span class="vk-navn">${vt.navn}</span>
          <span class="vk-under">${vt.under}</span>
        </span>
        <svg class="vk-pil" viewBox="0 0 10 16" aria-hidden="true"><path d="M2.5 2l6 6-6 6"/></svg>
      </button>`; }).join('')}
    </div>
  </div>`;
}
/* ---------- værktøjskassen toner ind, når man scroller ned til den ----------
   Hægtet på i tegn(), fordi appen gentegner hele skærme: en observer, der blev
   sat op én gang ved opstart, ville pege på knapper, der ikke findes længere.
   Den forrige kobles fra hver gang — ellers hober de sig op, én pr. gentegning.

   Roden er #indhold og ikke vinduet: det er dén, der scroller i appen.

   Respekterer prefers-reduced-motion: så står kortene bare der, som før. */
/* ---------- hele appen følger døgnet (KN 11/9) ----------
   Forsidens landskab har skiftet lys efter solen siden i dag. Nu gør resten
   af appen det samme: fladerne, teksten og linjerne skifter med den, i de
   SAMME fire trin, landskabet selv bruger — klarMorgen, klarDag, klar
   (aften), klarNat. Ikke tyve håndholdte farvesæt; fire, med samme navne som
   paletterne, så de to ting ikke kan komme ud af takt.

   Værdien sættes som data-tema på .telefon, og CSS'en hænger tokenerne op på
   den. Går JavaScript'et i stå, står :root med dagens farver — altså appen,
   som den ser ud i dag. Det er med vilje: et tema, der fejler, skal fejle
   lyst og læsbart, ikke sort.

   sceneLys() ejer beregningen; her vælges kun den dominerende af de to
   paletter, den glider imellem. Landskabet glider blødt, fladerne skifter i
   trin — en baggrund, der glider i farve under en tekst, man læser, er uro. */
function temaValg(){
  return (s && s.profil && s.profil.tema) || 'døgn';
}
function appTema(){
  const vært = document.querySelector('.telefon');
  if(!vært) return;
  let tema = 'lys';
  if(temaValg() === 'døgn'){
    try {
      const lys = sceneLys(sceneTid(new Date()), sceneGeo());
      tema = lys.andel < .5 ? lys.fra : lys.til;
    } catch(e){
      /* Kan lyset ikke beregnes, står appen i dagens flade frem for ingenting. */
    }
  }
  vært.dataset.tema = tema;
  /* Sidens baggrund = bundmenuens farve (K22). På iPhone fra hjemmeskærmen
     fylder systemet et felt under siden med netop den farve — se
     display-mode:standalone i app.css. */
  try {
    document.documentElement.style.setProperty('--side-bund',
      getComputedStyle(vært).getPropertyValue('--nav-flade').trim());
  } catch(e){ /* så står den mørkebrune faldbak */ }
}
let vkObservatør = null;
/* Hoppet (KN 28/9) kører én gang pr. opstart. Flaget sættes først, når
   animationen er FÆRDIG: tegn() kan gentegne forsiden midt i hoppet (fx når
   synkroniseringen lander), og så skal den nye blok hoppe i stedet. */
let vkHoppet = false;
/* Splashen dækker de første 3,3 sekunder. Et hop bag den er spildt, så det
   venter, til den er gået (visSplash() sætter tidspunktet). */
let vkHopTidligst = 0;
function vkHopForsinkelse(blok){
  const vent = Math.max(1600, vkHopTidligst - performance.now() + 500);
  blok.style.animationDelay = vent + 'ms';
}
function vkScrollEffekt(){
  if(vkObservatør){ vkObservatør.disconnect(); vkObservatør = null; }
  const kort = document.querySelectorAll('.vk-kort');
  if(!kort.length) return;
  const hopBlok = document.querySelector('.hero.fuld.med-vaerktoej + .vk-blok');
  if(hopBlok && !vkHoppet){
    vkHopForsinkelse(hopBlok);
    hopBlok.classList.add('vk-hop');
    hopBlok.addEventListener('animationend', e=>{
      if(e.target === hopBlok && e.animationName === 'vkHop') vkHoppet = true;
    });
  }
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  kort.forEach(k=>k.classList.add('vk-afventer'));
  /* Uden IntersectionObserver (meget gammel webview) springes effekten over,
     og kortene bliver stående synlige. Aldrig et tomt felt. */
  if(!('IntersectionObserver' in window)){
    kort.forEach(k=>k.classList.remove('vk-afventer'));
    return;
  }
  const blok = document.querySelector('.vk-blok');
  vkObservatør = new IntersectionObserver((poster, obs)=>{
    poster.forEach(p=>{
      if(!p.isIntersecting) return;
      p.target.classList.add('vk-vis');
      obs.unobserve(p.target);      // én gang — ikke frem og tilbage ved hver scroll
      /* Vinket har gjort sit arbejde, når den SIDSTE række er kommet frem.
         Så er kassen fremme, og "Swipe op" ville stå og bede om noget, der
         allerede er sket. */
      if(blok && p.target === kort[kort.length-1]) blok.classList.add('vk-fremme');
    });
  }, { root: $('indhold'), rootMargin: '0px 0px -12% 0px', threshold: .15 });
  kort.forEach(k=>vkObservatør.observe(k));
}
function vkTop(titel){
  return `<div class="skærm-top">
    <button class="tilbage" onclick="tilbage('hjem')">${ik('tilbage')}</button>
    <div><div class="etiket">${t('vk.kassetitel','Værktøjskassen')}</div><h1 style="font-size:22px">${titel}</h1></div>
  </div>`;
}
function vkStatuslinje(){ return `<p class="vk-status" data-vk-status role="status" aria-live="polite"></p>`; }
function vkFod(){
  return `<div class="side-fod">
    <div class="stille-række"><button class="knap stille" onclick="tilbage('hjem')">${t('vk.tilforsiden','Tilbage til forsiden')}</button></div>
  </div>`;
}

/* ---------- 1) VEJR ----------
   Ingen vejr-API og ingen nøgle. Vi sender koordinaterne til Yr, som
   er gratis at linke til — se vaerktoejskasse/KILDER.md. Destinationen
   er gemt som kort-x/y, og xyTilGeo er præcis den omregning, appen
   allerede bruger til at regne solnedgang ud for stedet. */
function vkVejrSted(){
  if(vkSted) return { punkt:vkSted, navn:vkStedNavn };
  const d = s.forberedelse && s.forberedelse.destination;
  if(d && d.x!=null && d.y!=null){
    const g = xyTilGeo(d.x, d.y);
    return { punkt:{ latitude:g.lat, longitude:g.lon }, navn:d.navn };
  }
  return { punkt:null, navn:'' };
}
function skærmVærktøjVejr(){
  const C = vkKerne();
  const sted = vkVejrSted();
  const url = C ? C.weatherUrl(sted.punkt) : 'https://www.yr.no/';
  $('indhold').innerHTML = `<div class="side anim">
    ${vkTop(t('vk.vejrtitel','Vejr'))}
    <div class="kort vk-panel">
      <span class="vk-hero-ikon">${ik('vejr')}</span>
      <h3>${sted.punkt ? esc(sted.navn || t('vk.jeresdestination','Jeres destination')) : t('vk.vejrudenssted','Vejret dér hvor I skal hen')}</h3>
      <p class="dæmpet">${sted.punkt
        ? t('vk.vejrklar','Udsigten er klar til stedet. Den åbner hos Yr — gratis og uden login.')
        : t('vk.vejrvaelg','Vælg en destination i planlægningen, brug jeres placering nu, eller find selv stedet hos Yr.')}</p>
      <button class="knap primær bred" style="margin-top:14px" onclick="vkÅbnVejr()">${ik('sol')} ${t('vk.aabnvejr','Åbn vejrudsigten')}</button>
      <button class="knap kontur bred" style="margin-top:10px" onclick="vkFindPlacering()">${ik('gps')} ${t('vk.minplacering','Brug min placering')}</button>
      ${vkStatuslinje()}
    </div>
    <p class="dæmpet" style="font-size:12.5px">${t('vk.vejrnote','Koordinaterne sendes først til Yr, når du trykker Åbn. Arytmi gemmer dem ikke.')}</p>
    <div class="stille-række" style="margin-top:6px">
      <a class="knap stille" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${t('vk.aabnyr','Åbn Yr i browseren')}</a>
    </div>
    ${vkFod()}
  </div>`;
}
function vkÅbnVejr(){
  const C = vkKerne(), a = vkAdapter();
  if(!C || !a){ vkBesked(vkFejltekst(vkBroFejl), true); return; }
  // Ingen await før åbningen — ellers taber browseren klik-gestussen.
  a.openWeather(C.weatherUrl(vkVejrSted().punkt))
   .then(()=>vkBesked('Vejrudsigten er åbnet.'))
   .catch(e=>vkBesked(vkFejltekst(e), true));
}
function vkFindPlacering(){
  const C = vkKerne();
  if(!C){ vkBesked(vkFejltekst(vkBroFejl), true); return; }
  if(!navigator.geolocation){ vkBesked('Telefonen kan ikke give sin placering. Brug Yr-linket nedenfor.', true); return; }
  vkBesked('Finder din placering …');
  navigator.geolocation.getCurrentPosition(p=>{
    try{
      vkSted = C.coordinates({ latitude:p.coords.latitude, longitude:p.coords.longitude });
      vkStedNavn = 'Dér hvor du er nu';
      tegn();
      vkBesked('Placeringen er klar. Tryk Åbn vejrudsigten.');
    }catch(e){ vkBesked(vkFejltekst(e), true); }
  }, e=>{
    vkBesked(e && e.code===1
      ? 'Placering blev ikke tilladt. Du kan stadig finde stedet hos Yr.'
      : 'Placeringen kunne ikke findes. Prøv igen, eller åbn Yr.', true);
  }, { enableHighAccuracy:false, timeout:10000, maximumAge:300000 });
}

/* ---------- 2) LOMMELYGTE ---------- */
function skærmVærktøjLygte(){
  $('indhold').innerHTML = `<div class="side anim">
    ${vkTop(t('vk.lygtetitel','Lommelygte'))}
    <div class="kort vk-panel vk-midt">
      <button class="vk-lygte${vkLys?' tændt':''}" data-vk-lygte onclick="vkSkiftLys()"
              aria-pressed="${vkLys}" aria-label="${esc(vkLys?t('vk.sluklygte','Sluk lommelygten'):t('vk.taendlygte','Tænd lommelygten'))}">
        ${ik('lygte')}
      </button>
      <h3 data-vk-lygte-tekst>${vkLys?t('vk.lysettaendt','Lyset er tændt'):t('vk.lysetslukket','Lyset er slukket')}</h3>
      <p class="dæmpet">${t('vk.lygtebrod','Tryk på lygten. Den bruger kameraets blitz.')}</p>
      ${vkStatuslinje()}
    </div>
    <p class="dæmpet" style="font-size:12.5px">${t('vk.lygtenote','Lyset slukker af sig selv, når du går tilbage eller lægger appen væk — så det ikke står og brænder i lommen.')}</p>
    ${vkFod()}
  </div>`;
}
function vkMalLygte(){
  const k = document.querySelector('[data-vk-lygte]');
  if(!k) return;
  k.classList.toggle('tændt', vkLys);
  k.setAttribute('aria-pressed', String(vkLys));
  k.setAttribute('aria-label', vkLys ? t('vk.sluklygte','Sluk lommelygten') : t('vk.taendlygte','Tænd lommelygten'));
  /* Feltet hedder bevidst IKKE t her: t er tekstopslaget, og en lokal
     variabel med samme navn ville skygge for det tre linjer laengere nede. */
  const felt = document.querySelector('[data-vk-lygte-tekst]');
  if(felt) felt.textContent = vkLys ? t('vk.lysettaendt','Lyset er tændt') : t('vk.lysetslukket','Lyset er slukket');
}
function vkSkiftLys(){
  const a = vkAdapter();
  if(!a){ vkBesked(vkFejltekst(vkBroFejl), true); return; }
  vkBesked('');
  a.setTorch(!vkLys)
   .then(r=>{ vkLys = !!(r && r.enabled); vkMalLygte(); })
   .catch(e=>{ vkLys = false; vkMalLygte(); vkBesked(vkFejltekst(e), true); });
}

/* ---------- 3) TOMMESTOK ----------
   Kameraopmåling findes kun i den native app. I browseren siger den
   fra — den gætter ikke et tal. Samme regel som resten af prototypen:
   den må aldrig vise noget, den ikke kan holde. */
function skærmVærktøjLineal(){
  const kunWeb = !vkBro || vkBro.kind === 'web';
  $('indhold').innerHTML = `<div class="side anim">
    ${vkTop(t('vk.linealtitel','Tommestok'))}
    <div class="kort vk-panel vk-midt">
      <div class="vk-lineal-tegning" aria-hidden="true"><i></i>${ik('pil')}<i></i></div>
      <h3>${t('vk.linealoverskrift','To punkter. Ét mål.')}</h3>
      <p class="dæmpet">${t('vk.linealbrod','Bevæg telefonen roligt, til kameraet finder fladen. Sæt så et startpunkt og et slutpunkt — fx fra bagsædet til bagklappen.')}</p>
      <!-- Ingen knap i browseren. Et tryk kunne alligevel kun ende i en
           fejlbesked, og en knap, der altid siger nej, er et løfte appen ikke
           kan holde. Noten nedenfor siger hvorfor i stedet.
           Prototype-note, ikke en fejl: browseren har ingen adgang til
           kameraets dybdemåling. Den native kode ligger i vaerktoejskasse/native/. -->
      ${kunWeb
        ? `<div class="advarsel" style="text-align:left">${t('vk.linealkunapp','Tommestokken virker først, når Arytmi ligger som app på telefonen — den måler med kameraets dybdesans, og den har en browser ikke adgang til.')}</div>`
        : `<button class="knap primær bred" style="margin-top:14px" onclick="vkMål()">${ik('lineal')} ${t('vk.aabnkamera','Åbn kameraet')}</button>`}
      ${vkStatuslinje()}
    </div>
    <div data-vk-målinger>${vkMålingsListe()}</div>
    <p class="dæmpet" style="font-size:12.5px">${t('vk.linealnote','Målet er vejledende. Skal det passe på centimeteren, så tag målebåndet. Godt lys og mønstre på overfladen hjælper kameraet.')}</p>
    ${vkFod()}
  </div>`;
}
function vkMålingsListe(){
  const C = vkKerne();
  if(!vkMålinger.length || !C) return '';
  return `<div class="kort vk-resultater">
    <h3>${t('vk.dinemaalinger','Dine målinger')}</h3>
    ${vkMålinger.map(m=>`<div class="vk-måling"><span>${t('vk.maalingnr','Måling {nr}',{nr:m.nr})}</span><strong>${t('vk.camaal','ca. {maal}',{maal:C.formatDistance(m.meter)})}</strong></div>`).join('')}
    <div class="stille-række" style="margin-top:6px"><button class="knap stille" onclick="vkRydMålinger()">${t('vk.rydmaalinger','Ryd målingerne')}</button></div>
    <p class="dæmpet" style="font-size:12px;text-align:center">${t('vk.maalingernote','Gemmes kun, mens appen er åben.')}</p>
  </div>`;
}
function vkMål(){
  const C = vkKerne(), a = vkAdapter();
  if(!C || !a){ vkBesked(vkFejltekst(vkBroFejl), true); return; }
  vkBesked(t('vk.kameraaabnes','Kameraet åbnes …'));
  a.measure().then(r=>{
    if(!r || r.cancelled){ vkBesked(t('vk.maalinglukket','Målingen blev lukket.')); return; }
    const tekst = C.formatDistance(r.meters);   // kaster ved et ugyldigt resultat
    const nr = vkMålinger.length ? vkMålinger[vkMålinger.length-1].nr + 1 : 1;
    vkMålinger.push({ nr, meter:r.meters });
    vkMålinger = vkMålinger.slice(-20);
    const boks = document.querySelector('[data-vk-målinger]');
    if(boks) boks.innerHTML = vkMålingsListe();
    vkBesked(t('vk.maalt','Målt: ca. {maal}.',{maal:tekst}));
  }).catch(e=>vkBesked(vkFejltekst(e), true));
}
function vkRydMålinger(){
  vkMålinger = [];
  const boks = document.querySelector('[data-vk-målinger]');
  if(boks) boks.innerHTML = '';
  vkBesked('Målingerne er ryddet.');
}

/* ---------- 4) NIVELLERING ----------
   Til at finde en plads, hvor man kan sove uden at rulle ned i den ene
   side. Lige ved højst 0,5° samlet hældning. Nulpunktet er RELATIVT —
   det beviser ikke, at underlaget er vandret, og det siger teksten. */
function skærmVærktøjNiveau(){
  $('indhold').innerHTML = `<div class="side anim">
    ${vkTop(t('vk.niveautitel','Nivellering'))}
    <div class="kort vk-panel vk-midt">
      <div class="vk-vater" data-vk-vater>
        <div class="vk-vater-ring"></div>
        <div class="vk-boble" data-vk-boble hidden></div>
      </div>
      <h3 data-vk-vater-tekst>${t('vk.vaterspm','Ligger underlaget lige?')}</h3>
      <div class="vk-aflæsninger">
        <div><strong data-vk-roll>—</strong><span>${t('vk.sidetilside','Side til side')}</span></div>
        <div><strong data-vk-pitch>—</strong><span>${t('vk.forogbag','For og bag')}</span></div>
      </div>
      <button class="knap primær bred" data-vk-niveau-knap onclick="vkSkiftNiveau()">${ik('vater')} ${vkNiveauKører?t('vk.stopniveau','Stop nivelleringen'):t('vk.startniveau','Start nivelleringen')}</button>
      <div class="stille-række" style="margin-top:4px">
        <button class="knap stille" data-vk-nul onclick="vkSætNulpunkt()" disabled>${t('vk.saetnul','Sæt nulpunkt her')}</button>
        <button class="knap stille" data-vk-nul-væk onclick="vkFjernNulpunkt()" ${vkNulpunkt?'':'hidden'}>${t('vk.brugvandret','Brug vandret igen')}</button>
      </div>
      <p class="dæmpet" style="font-size:12.5px" data-vk-reference>${vkNulpunkt
        ? t('vk.relativnul','Relativt nulpunkt: du sammenligner med den flade, du selv valgte.')
        : t('vk.vandretnul','Måler i forhold til vandret. Lige ved højst 0,5° samlet hældning.')}</p>
      ${vkStatuslinje()}
    </div>
    <p class="dæmpet" style="font-size:12.5px">${t('vk.niveaunote','Læg telefonen fladt med skærmen opad — helst uden cover, og ikke på kamerabulen. En madras eller et sæde giver et andet svar end gulvet.')}</p>
    ${vkFod()}
  </div>`;
  vkMalNiveau();
}
function vkGrader(v){ return `${Math.abs(v) < 0.05 ? '0,0' : v.toFixed(1).replace('.',',')}°`; }
function vkMalNiveau(){
  if(vkAktivSkærm !== 'vk-niveau') return;
  const C = vkKerne(); if(!C) return;
  const vater = document.querySelector('[data-vk-vater]'); if(!vater) return;
  const vis = C.relativeLevel(vkAflæsning, vkNulpunkt || undefined);
  const gyldig = vkNiveauKører && vis && vis.usable && (Date.now() - vkSidsteData < 2500);
  const nulKnap = document.querySelector('[data-vk-nul]');
  if(nulKnap) nulKnap.disabled = !gyldig;
  vater.classList.toggle('i-vater', !!(gyldig && vis.balanced));
  const boble = document.querySelector('[data-vk-boble]');
  boble.hidden = !gyldig;
  document.querySelector('[data-vk-roll]').textContent  = gyldig ? vkGrader(vis.roll)  : '—';
  document.querySelector('[data-vk-pitch]').textContent = gyldig ? vkGrader(vis.pitch) : '—';
  document.querySelector('[data-vk-vater-tekst]').textContent = !gyldig
    ? (vkAflæsning && !vkAflæsning.usable ? 'Læg telefonen med skærmen opad'
       : vkNiveauKører ? 'Venter på telefonens sensor …' : 'Ligger underlaget lige?')
    : vis.balanced ? (vkNulpunkt ? 'Som dit nulpunkt' : 'I vater') : 'Lidt skævt endnu';
  if(gyldig){
    const x = Math.max(-72, Math.min(72, vis.roll * 4));
    const y = Math.max(-72, Math.min(72, -vis.pitch * 4));
    boble.style.transform = `translate(${x}px, ${y}px)`;
  }
}
function vkPrøve(v){
  if(!vkNiveauKører || vkAktivSkærm !== 'vk-niveau') return;
  const C = vkKerne(); if(!C) return;
  if(![v.x, v.y, v.z].every(Number.isFinite)) return;
  const længde = Math.hypot(v.x, v.y, v.z);
  if(længde < 0.1) return;
  const n ={ x:v.x/længde, y:v.y/længde, z:v.z/længde };
  // Lavpasfilter — uden det hopper boblen ved hver lille rystelse.
  vkRå = vkRå ? { x:vkRå.x*0.8 + n.x*0.2, y:vkRå.y*0.8 + n.y*0.2, z:vkRå.z*0.8 + n.z*0.2 } : n;
  const sk = window.screen && window.screen.orientation;
  const vinkel = Number((sk && sk.angle != null) ? sk.angle : (window.orientation || 0));
  vkAflæsning = C.vectorToLevel(vkRå, Number.isFinite(vinkel) ? vinkel : 0);
  vkSidsteData = Date.now();
  vkMalNiveau();
}
function vkNiveauKnapTekst(start){
  const k = document.querySelector('[data-vk-niveau-knap]');
  if(k) k.innerHTML = `${ik('vater')} ${start ? 'Start nivelleringen' : 'Stop nivelleringen'}`;
}
function vkSkiftNiveau(){
  const a = vkAdapter();
  if(!a){ vkBesked(vkFejltekst(vkBroFejl), true); return; }
  if(vkNiveauKører){
    vkStopVisning();
    a.stopLevel().catch(()=>{});
    vkNiveauKnapTekst(true); vkMalNiveau();
    vkBesked('Nivelleringen er stoppet.');
    return;
  }
  vkNiveauKører = true;
  vkBesked('');
  const stop = e=>{
    vkStopVisning(); vkNiveauKnapTekst(true); vkMalNiveau();
    vkBesked(vkFejltekst(e), true);
    a.stopLevel().catch(()=>{});
  };
  // startLevel spørger om sensoradgang INDE i klikket — derfor ingen await før.
  a.startLevel(vkPrøve, stop).then(()=>{
    if(!vkNiveauKører) return;
    vkNiveauKnapTekst(false);
    vkMalNiveau();
    if(vkVagt) clearInterval(vkVagt);
    vkVagt = setInterval(()=>{
      if(!vkNiveauKører || vkAktivSkærm !== 'vk-niveau') return;
      vkMalNiveau();
      vkBesked(!vkSidsteData || Date.now() - vkSidsteData >= 2500
        ? 'Der kommer ingen sensordata. Bevæg telefonen let, eller stop og prøv igen.' : '');
    }, 1000);
  }).catch(stop);
}
function vkSætNulpunkt(){
  const C = vkKerne(); if(!C) return;
  try{
    if(Date.now() - vkSidsteData >= 2500) throw new Error('Vent på nye sensordata, før du sætter nulpunkt.');
    vkNulpunkt = C.calibration(vkAflæsning);
    const ref = document.querySelector('[data-vk-reference]');
    if(ref) ref.textContent = 'Relativt nulpunkt: du sammenligner med den flade, du selv valgte.';
    const væk = document.querySelector('[data-vk-nul-væk]');
    if(væk) væk.hidden = false;
    vkMalNiveau();
    vkBesked('Nulpunktet er sat. Det gælder, indtil du forlader værktøjet.');
  }catch(e){ vkBesked(vkFejltekst(e), true); }
}
function vkFjernNulpunkt(){
  vkNulpunkt = null;
  const ref = document.querySelector('[data-vk-reference]');
  if(ref) ref.textContent = 'Måler i forhold til vandret. Lige ved højst 0,5° samlet hældning.';
  const væk = document.querySelector('[data-vk-nul-væk]');
  if(væk) væk.hidden = true;
  vkMalNiveau();
}

/* Appen i baggrunden = alt hardware fri. Ellers ligger lygten og lyser i
   lommen, og sensoren tygger batteri, mens telefonen er låst. */
if(typeof document !== 'undefined'){
  document.addEventListener('visibilitychange', ()=>{
    if(document.visibilityState !== 'hidden' || !vkAktivSkærm) return;
    vkStopVisning(); vkLys = false;
    if(vkBro) vkBro.suspend().catch(()=>{});
    vkMalLygte(); vkNiveauKnapTekst(true); vkMalNiveau();
  });
  window.addEventListener('pagehide', ()=>{
    vkStopVisning(); vkLys = false;
    if(vkBro) vkBro.suspend().catch(()=>{});
  });
}

/* =============================================================
   TEGN
   ============================================================= */
/* NETTET UNDER SKÆRMENE.
   -----------------------------------------------------------------
   Hver skærm bygges som én template-streng og sættes med `innerHTML`:

       $('indhold').innerHTML = `... ${noget()} ...`;

   Kaster `noget()` en undtagelse, bliver `innerHTML` ALDRIG sat. Den
   forrige skærm bliver stående — eller intet, hvis det sker ved opstart —
   og der er ingen fejlbesked nogen steder. Appen ser ud til at være gået i
   stå, og det eneste, brugeren kan fortælle os, er "den virker ikke".

   Det her er hele grunden til, at `tegn()` nu er to funktioner. Alle de
   hundrede kald i appen peger stadig på `tegn()`; arbejdet er flyttet til
   `tegnSkærmen()`, så der er et sted at stå imellem.

   ⚠️ DER SLUGES INGENTING. Fejlen meldes, og brugeren får en skærm, hun kan
   komme videre fra. Et `catch`, der lader som ingenting, ville gøre det
   svært at finde i stedet for synligt. */
/* SKIFT ELLER GENTEGNING? (KN 28/9: "man kan tydeligt mærke, at den
   loader og renderer"). tegn() kører både, når man går til en ny skærm, og
   når et flueben eller en dato ændrer noget på den, man står på. Før
   gled HELE skærmen op fra bunden i begge tilfælde — et tryk på et flueben
   fik alt til at blinke og komme igen. Nu får #indhold klassen `skift`
   kun, når visningen faktisk er en ny (en anden skærm, eller et skridt
   frem/tilbage i historikken), og CSS'en animerer kun dér. */
let sidsteVisning = null;
function tegn(){
  const nøgle = aktivSkærm + '|' + historik.length;
  const ramme = $('indhold');
  if(ramme) ramme.classList.toggle('skift', nøgle !== sidsteVisning);
  sidsteVisning = nøgle;
  try {
    tegnSkærmen();
    tegnRedBjælke();
    /* Sol og måne ankres EFTER tegningen, fordi det kræver, at boksen er
       målt (se ankrSky). Ét sted, ikke i hver enkelt skærm: enhver skærm
       med en hero skal have det, og en, der glemmer kaldet, ville stille
       og roligt få månen et andet sted hen end naboskærmen.

       Egen try: en fejl i en KOSMETISK rettelse må aldrig vælte skærmen.
       Sker det, står scenen bare med sit udgangspunkt fra heroScene(). */
    try { ankrSky(); } catch(e){
      if(window.ArytmiFejl) ArytmiFejl.meld(e, { hvor:'ankrSky', skærm: aktivSkærm });
    }
  } catch(fejl){
    if(window.ArytmiFejl) ArytmiFejl.meld(fejl, { hvor:'tegn', skærm: aktivSkærm });
    else { try { console.error('[arytmi] tegn():', fejl); } catch(e){} }
    visFejlskærm();
  }
}

/* Skærmen, ingen skal se. Den har to opgaver og kun dem: sige at det er
   OS, der er gået i stykker — ikke hende — og give en vej videre.

   Den bruger `t()` som alt andet, så teksten kan rettes fra bagrummet. Men
   den har en faldbak UDEN skabeloner og uden opslag: går selve fejlskærmen
   i stykker, er der ikke flere lag, og så er en tom skærm det, brugeren
   sidder med. `textContent` kan ikke fejle på et manglende tegn. */
function visFejlskærm(){
  try {
    $('indhold').innerHTML = `<div class="side anim">
      <div class="kort" style="margin-top:34px">
        <h2>${t('fejl.overskrift','Noget gik i stykker her')}</h2>
        <p>${t('fejl.brød','Det er vores fejl, ikke din. Turen og alt, du har skrevet, ligger der stadig — det er kun skærmen, der ikke kunne tegnes.')}</p>
        <button class="knap primær bred" onclick="gåTil('hjem')" style="margin-top:16px">${t('fejl.knap','Tilbage til forsiden')}</button>
      </div>
    </div>`;
  } catch(e){
    try {
      const ind = $('indhold');
      if(ind) ind.textContent = 'Noget gik i stykker. Luk appen og aabn den igen.';
    } catch(e2){ /* her er der ikke mere at gøre */ }
  }
}

function tegnSkærmen(){
  /* Kommer hun fra aktiveringslinket, skal hun se kodeordsskærmen — også
     selvom appen tror, hun er onboardet fra en tidligere session på samme
     telefon. Linket er det stærkeste signal, der findes: det kommer fra en
     ordrebekræftelse, hun lige har åbnet. */
  if(akToken){ obTrin = 2.5; skærmOnboarding(); tegnNav(); return; }
  /* Åbnet i telefonens browser og ikke fra hjemmeskærmen (K22): først
     guiden, så login. På iPhone deler Safari og hjemmeskærmen ikke lager, så
     et login i Safari følger ikke med derover. */
  if(visInstallation()){ skærmInstallér(); tegnNav(); return; }
  if(!s.onboarded){ skærmOnboarding(); tegnNav(); return; }
  if(loginKræves){ if(obTrin !== 2 && obTrin !== 2.6 && obTrin !== 2.7) obTrin = 2; skærmOnboarding(); tegnNav(); return; }
  // Passerede ture flytter selv ned i loggen (KN 4/9), FØR skærmen tegnes —
  // ellers ville forsiden nå at vise en tur, der ligger bag os, som "kommende".
  logAfholdteTure();
  sikrAktivTur();
  /* Værktøjskassen slukker sit hardware, når man forlader den — uanset om man
     gik tilbage, brugte bundnavigationen eller trykkede på et andet værktøj.
     Derfor står det HER, ét sted, og ikke i fire skærmfunktioner. */
  vkSkærmskift(aktivSkærm);
  /* Editoren husker kun teksterne fra DEN skærm, hun står på (KN 5/10). */
  if(RED_SETE) RED_SETE = new Map();
  switch(true){
    /* Gæstestatus står også på forsidens nedtælling, ikke kun i loggen —
       og forsiden er der, man venter på svaret. Kun den AKTIVE tur, for
       det er den, forsiden viser. */
    case aktivSkærm==='hjem':         skærmHjem(); venOpdaterSvar(s.forberedelse); break;
    case aktivSkærm==='hurtig':       skærmHurtig(); break;
    case aktivSkærm==='turdato':      skærmTurDato(); break;
    case aktivSkærm==='hvorfra':      skærmHvorfra(); break;
    case aktivSkærm==='hvorlangt':    skærmHvorLangt(); break;
    case aktivSkærm==='onsker':       skærmØnsker(); break;
    case aktivSkærm==='forslag':      skærmForslag(); break;
    case aktivSkærm==='bilen':        skærmBilen(0); break;
    case aktivSkærm.startsWith('bilen-'): skærmBilen(aktivSkærm.slice(6)); break;
    /* 'mad' er nu selve madscenarie-listen — mellemsiden er væk (OD 30/8).
       Gamle dybe links til de slettede trin lander samme sted. */
    case aktivSkærm==='mad':          skærmMadValg(); break;
    case aktivSkærm==='mad-tidsplan': case aktivSkærm==='mad-valg':
    case aktivSkærm.startsWith('mad-udstyr'): skærmMadValg(); break;
    case aktivSkærm.startsWith('mad-scenarie-'): skærmMadScenarie(aktivSkærm.slice(13)); break;
    case aktivSkærm==='mad-snacks':      skærmMadSnacks(); break;
    case aktivSkærm==='mad-morgen':      skærmMadMorgen(); break;
    case aktivSkærm==='pakke':        skærmPakke(); break;
    // 'klar-sidste' er slettet (OD 30/8) — indholdet ligger nu i pakkelistens
    // egne underlister. Gamle dybe links lander samme sted.
    case aktivSkærm==='klar-pakke': case aktivSkærm==='klar-sidste':
      skærmKlarListe(); break;
    /* Samme begrundelse som partnerens: opslaget hænger på tegningen, ikke
       på en timer, og venOpdaterSvar() returnerer straks for de ture, der
       ikke har en invitation ude. */
    case aktivSkærm==='log':          skærmLog(); s.arytmer.forEach(a=>venOpdaterSvar(a)); break;
    /* Opslaget om partneren hænger på tegningen af profilen, ikke på en
       timer. Kortet er det eneste sted, svaret kan ses, og et opslag, der
       tegner skærmen om, må ikke ramme ned i et felt, hun sidder og
       skriver i — samme begrundelse som hentningen i sync.js. Er der ingen
       sendt invitation at vente på, returnerer den straks, så de fleste
       besøg på profilen koster ingenting. */
    case aktivSkærm==='profil':       skærmProfil(); partnerOpdaterStatus(); break;
    case aktivSkærm==='slet-konto':   skærmSletKonto(); break;
    case aktivSkærm==='invitation':      skærmInvitation(); break;
    /* Gæsten på turen (KN 6/9) — to trin: hvem, og hvem pakker hvad. */
    case aktivSkærm==='ven-inviter':     skærmVenInviter(); break;
    case aktivSkærm==='ven-fordel':      skærmVenFordel(); break;
    case aktivSkærm==='turplan':         skærmTurplan(); break;
    /* Værktøjskassen (KN 6/9) — fire små hjælpere nederst på Hjem. */
    case aktivSkærm==='vk-vejr':         skærmVærktøjVejr(); break;
    case aktivSkærm==='vk-lygte':        skærmVærktøjLygte(); break;
    case aktivSkærm==='vk-lineal':       skærmVærktøjLineal(); break;
    case aktivSkærm==='vk-niveau':       skærmVærktøjNiveau(); break;
    case aktivSkærm.startsWith('testet-'): skærmTestet(aktivSkærm.slice(7)); break;
    /* Editor-tilstanden (KN 5/10) — kun for admins med editoren slået til. */
    case aktivSkærm==='red-steder':     skærmRedSteder(); break;
    case aktivSkærm.startsWith('red-sted-'): skærmRedSted(aktivSkærm.slice(9)); break;
    default: skærmHjem();
  }
  /* Forsiden havde padding-bottom:0, fordi den var ét helt skærmbillede uden
     noget under sig — man skulle ikke kunne scrolle på et tomt felt. Med
     værktøjskassen nederst (KN 6/9) ER der noget under hero'en på ALLE tre
     forsider, og så skal den sidste knap ikke ligge under bundnavigationen. */
  $('indhold').style.paddingBottom = '';
  /* Værktøjskassens indtoning hægtes på HER, efter skærmen er tegnet, og ikke
     fra index.html. Appen gentegner hele skærme; en patch udefra ville køre
     ved hver eneste tegn() og slås med den rigtige funktion om resultatet.
     Er der ingen værktøjskasse på skærmen, returnerer den straks. */
  vkScrollEffekt();
  appTema();
  tegnNav();
}
/* ---------- appen åbner ALTID på Hjem (KN 6/9) ----------
   Efter planlægningen bliver man ledt til loggen — det er med vilje. Men
   forlader man appen dér, skal man ikke lande i loggen næste gang: man skal
   møde sin næste tur. aktivSkærm er i forvejen 'hjem'; det, der manglede,
   var at aktivId pegede på den tur, man SIDST rørte, og ikke på den, der
   ligger først i kalenderen. */
(function startPåHjem(){
  aktivSkærm = 'hjem';
  nulstilHistorik();
  const n = næsteArytme();
  if(n) s.aktivId = n.id;
})();
tegn();
trækForAtOpdatere();

/* ---------- splash ---------- */
(function visSplash(){
  const t = new Date().getHours();
  const variant = (t>=22||t<5) ? 'tur' : 'klar';
  const d = document.createElement('div');
  d.id = 'splash';
  d.innerHTML = heroScene(variant, skærmHøjde()) + `
    <div class="s-mid">
      <div class="s-logo-wrap">${ordmærke(true, true)}</div>
    </div>`;
  document.querySelector('.telefon').appendChild(d);
  setTimeout(()=>d.remove(), 3300);
  vkHopTidligst = performance.now() + 3300;
  const hop = document.querySelector('.vk-blok.vk-hop');
  if(hop) vkHopForsinkelse(hop);
})();

/* ---------- ripple ---------- */
document.addEventListener('pointerdown', e=>{
  const k = e.target.closest('.knap'); if(!k) return;
  const r = k.getBoundingClientRect();
  const str = Math.max(r.width, r.height) * 2.2;
  const spot = document.createElement('span');
  spot.className = 'ripple';
  spot.style.cssText = `width:${str}px;height:${str}px;left:${e.clientX-r.left-str/2}px;top:${e.clientY-r.top-str/2}px`;
  k.appendChild(spot);
  setTimeout(()=>spot.remove(), 700);
}, {passive:true});

/* ---------- parallax på hero ---------- */
$('indhold').addEventListener('scroll', ()=>{
  const hero = document.querySelector('.hero'); if(!hero) return;
  const y = $('indhold').scrollTop;
  if(y > 500) return;
  const scene = hero.querySelector('.scene');
  const overlay = hero.querySelector('.overlay');
  if(scene) scene.style.transform = `translateY(${y*.35}px)`;
  if(overlay){ overlay.style.transform = `translateY(${y*.55}px)`; overlay.style.opacity = Math.max(0, 1 - y/260); }
}, {passive:true});

/* =============================================================
   ARYTMI PÅ HJEMMESKÆRMEN (K22, KN 6/10)
   =============================================================
   Arytmi udgives på app.arytmi.com og lægges på hjemmeskærmen fra
   browseren. App Store og Google Play er parkeret. Tre ting bor her:

   1. Guiden "Læg Arytmi på din hjemmeskærm". Den står FØR login, når appen
      er åbnet i telefonens browser: på iPhone deler Safari og hjemmeskærmen
      ikke lager, så et login i Safari ville ikke følge med over.
   2. Service workeren (sw.js). Registreres kun over https — aldrig i den
      pakkede app, aldrig i navigationstesten, og kun lokalt med flaget
      localStorage 'arytmi-sw-lokalt' = '1' (så node serve.js ikke stille
      begynder at servere en gammel app fra lageret).
   3. Den aktive turs billeder hentes ned, så turen virker uden net.

   `var` og funktioner, ikke `let`: tegn() kører første gang længere oppe i
   filen, før linjerne her er nået. */
var installKald = null;      // Androids "installér"-hændelse, gemt til knappen
var installeretNu = false;   // Android: lige lagt på startskærmen fra denne fane
var nyUdgaveKlar = false;    // sw.js har taget en ny udgave i brug
var billedPause = null;
var beskedLinkUdenApp = false; // åbnet fra påmindelsens link i en browser, hvor hun ikke er logget ind

function erNativeApp(){
  const c = window.Capacitor;
  return !!(c && typeof c.isNativePlatform === 'function' && c.isNativePlatform());
}
function erInstalleret(){
  try {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
        || navigator.standalone === true;
  } catch(e){ return false; }
}
/* iPadOS giver sig ud for at være en Mac — berøringsskærmen afslører den. */
function telefonSlags(){
  const ua = navigator.userAgent || '';
  if(/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if(/Android/.test(ua)) return 'android';
  return null;
}
/* Facebook, Instagram og LinkedIn åbner links i deres egen browser, hvor
   "Føj til hjemmeskærm" ikke findes. */
function iFremmedApp(){ return /FBAN|FBAV|Instagram|LinkedInApp/.test(navigator.userAgent || ''); }
function iBrowserenValgt(){
  try { return sessionStorage.getItem('arytmi-i-browseren') === '1'; } catch(e){ return false; }
}
/* Kun en telefon, kun i browseren, kun før velkomsten. Computeren får appen,
   som den altid har set ud. */
function visInstallation(){
  return !s.onboarded && !erNativeApp() && !erInstalleret() && !!telefonSlags() && !iBrowserenValgt();
}

function skærmInstallér(){
  const slags = telefonSlags();
  const trin = (nr, tekst, ikon) => `<li class="inst-trin"><span class="inst-nr">${nr}</span>
      <span class="inst-tekst">${tekst}${ikon ? ` <span class="inst-ikon">${ik(ikon)}</span>` : ''}</span></li>`;
  let krop;
  if(installeretNu){
    krop = `<p class="inst-klar">${t('installer.klar','Arytmi ligger nu på din startskærm. Luk browseren, og åbn Arytmi derfra. Det er dér, du logger ind.')}</p>`;
  } else if(iFremmedApp()){
    krop = `<p class="inst-klar">${t('installer.fremmed','Du har åbnet Arytmi inde i en anden app. Åbn siden i {browser} først, så kan den lægges på hjemmeskærmen.', { browser: slags === 'ios' ? 'Safari' : 'Chrome' })}</p>
      <ol class="inst-liste">
        ${trin(1, t('installer.fremmed1','Tryk på de tre prikker'), 'prikker')}
        ${trin(2, t('installer.fremmed2','Vælg "Åbn i browser"'))}
      </ol>
      <div style="margin-top:6px"><button class="knap sekundær bred" onclick="kopiérAppLink()">${t('installer.kopier','Kopiér linket i stedet')}</button></div>`;
  } else if(slags === 'ios'){
    krop = `<ol class="inst-liste">
        ${trin(1, t('installer.ios1','Tryk på Del-knappen'), 'iosdel')}
        ${trin(2, t('installer.ios2','Vælg "Føj til hjemmeskærm". Måske skal du rulle lidt ned.'))}
        ${trin(3, t('installer.ios3','Åbn Arytmi fra hjemmeskærmen, og log ind dér'))}
      </ol>`;
  } else if(installKald){
    krop = `<div style="margin-top:18px"><button class="knap primær bred" onclick="installerAndroid()">${t('installer.androidknap','Læg Arytmi på startskærmen')}</button></div>
      <ol class="inst-liste">
        ${trin(2, t('installer.android3','Åbn Arytmi fra startskærmen, og log ind dér'))}
      </ol>`;
  } else {
    krop = `<ol class="inst-liste">
        ${trin(1, t('installer.android1','Tryk på de tre prikker øverst til højre'), 'prikker')}
        ${trin(2, t('installer.android2','Vælg "Føj til startskærm" eller "Installer app"'))}
        ${trin(3, t('installer.android3','Åbn Arytmi fra startskærmen, og log ind dér'))}
      </ol>`;
  }
  /* FRA PÅMINDELSENS LINK (Kennet 7/10). Et link i en mail åbner ALDRIG
     appen på en iPhones hjemmeskærm — Apple sender det til Safari eller til
     mailappens egen browser, og siden kan ikke se, om appen er installeret:
     de har hver sit lager. Så den, der har appen, får besked på at åbne den
     derfra, og guiden står nedenunder til den, der ikke har. */
  const fraBesked = beskedLinkUdenApp && !installeretNu;
  const skærmNavn = slags === 'ios' ? t('installer.hjemmeskaerm','hjemmeskærm') : t('installer.startskaerm','startskærm');
  if(fraBesked) krop = `<p class="inst-klar">${t('installer.beskedikke','Har du ikke Arytmi på din {skaerm}? Sådan lægger du den dér:', { skaerm: skærmNavn })}</p>` + krop;
  $('indhold').innerHTML = obRamme(
    t('installer.etiket','Arytmi på din telefon'),
    fraBesked ? t('installer.beskedoverskrift','Åbn Arytmi fra din {skaerm}', { skaerm: skærmNavn })
              : t('installer.overskrift','Læg Arytmi på din hjemmeskærm'),
    fraBesked ? t('installer.beskedunder','Har du allerede Arytmi på din {skaerm}? Så luk det her vindue, og åbn Arytmi derfra. Turen ligger under Afholdte ture i Dine arytmer.', { skaerm: skærmNavn })
              : t('installer.under','Så ligger den lige ved hånden, som en app.'),
    krop,
    `<p class="inst-hvorfor">${t('installer.hvorfor','Arytmi ligger ikke i App Store eller Google Play. Du lægger den på din hjemmeskærm direkte herfra, og så har du altid den nyeste udgave. Nye steder og forbedringer kommer helt af sig selv. Du skal aldrig opdatere noget.')}</p>
     <div class="login-link"><button class="tekst-knap" onclick="fortsætIBrowseren()">${t('installer.browser','Brug Arytmi i browseren i stedet')}</button></div>`);
}
async function installerAndroid(){
  const kald = installKald; if(!kald) return;
  installKald = null;
  try {
    kald.prompt();
    const valg = await kald.userChoice;
    if(valg && valg.outcome === 'accepted') installeretNu = true;
  } catch(e){ /* så står de tre prikker der i stedet */ }
  tegn();
}
function fortsætIBrowseren(){
  try { sessionStorage.setItem('arytmi-i-browseren', '1'); } catch(e){}
  tegn();
  $('indhold').scrollTop = 0;   // guiden er længere end velkomsten — start fra toppen
}
async function kopiérAppLink(){
  try {
    await navigator.clipboard.writeText(location.origin + '/');
    flash(t('installer.kopieret','Linket er kopieret. Sæt det ind i din browser.'));
  } catch(e){
    flash(t('installer.kopierfejl','Skriv {adresse} i din browser.', { adresse: location.host }));
  }
}

/* DET DØDE FELT (Kennets iPhone 6/10). Fra hjemmeskærmen giver iPhone siden
   812 af skærmens 874 punkter; feltet nederst fylder systemet selv med sidens
   farve (se display-mode:standalone i app.css), og hjem-stregen står dér. Så
   skal bundmenuen ikke også holde plads til den.
   Feltet sidder FORNEDEN, når siden alligevel er trukket op under uret
   (safe-area-top > 0). Den anden kendte variant af WebKit-fejlen holder
   TOPPEN fri (top = 0) — dér går siden helt ned, og hjem-stregen skal have sin
   plads. Derfor begge betingelser. Kun iPhone, kun på hjemmeskærmen, kun på
   højkant. Måles igen, når telefonen vendes. */
function målDødtFelt(){
  let dødt = false;
  try {
    if(erInstalleret() && telefonSlags() === 'ios' && window.innerHeight > window.innerWidth){
      const prøve = document.createElement('div');
      prøve.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px)';
      document.body.appendChild(prøve);
      const top = parseFloat(getComputedStyle(prøve).paddingTop) || 0;
      prøve.remove();
      const skærm = Math.max(screen.height, screen.width);
      dødt = top > 0 && skærm - window.innerHeight > 20;
    }
  } catch(e){ /* så holder menuen sin plads, som den altid har */ }
  document.documentElement.classList.toggle('doedt-felt', dødt);
}
function kanBrugeSW(){
  if(erNativeApp() || !('serviceWorker' in navigator)) return false;
  if(location.protocol === 'https:') return true;
  try { return localStorage.getItem('arytmi-sw-lokalt') === '1'; } catch(e){ return false; }
}
/* En ny udgave tages i brug, når hun kommer tilbage til appen — men kun på
   en forside eller i velkomsten, aldrig midt i noget, hun er ved at skrive. */
function roligtØjeblik(){
  if(document.querySelector('.modal-bag')) return false;
  const fokus = document.activeElement;
  if(fokus && /^(INPUT|TEXTAREA|SELECT)$/.test(fokus.tagName)) return false;
  return s.onboarded ? ['hjem','log','profil'].includes(aktivSkærm) : obTrin === 1;
}
/* De kommende tures stedbilleder hentes ned, så turen kan ses i flytilstand.
   Lagt efter et øjeblik med stilhed, som beskederne — gem() kaldes ved hvert tryk. */
function planlægOfflineBilleder(){
  if(!kanBrugeSW()) return;
  clearTimeout(billedPause);
  billedPause = setTimeout(gemTurBillederNu, 2000);
}
function gemTurBillederNu(){
  if(!kanBrugeSW()) return;
  const urls = [];
  for(const a of (s.arytmer || [])){
    const id = a && a.destination && a.destination.testetId;
    const sted = id && TESTEDE.find(x => x.id === id);
    if(sted && Array.isArray(sted.billeder)) urls.push(...sted.billeder);
  }
  if(!urls.length) return;
  navigator.serviceWorker.ready
    .then(reg => { if(reg.active) reg.active.postMessage({ slags:'gem-billeder', urls }); })
    .catch(()=>{});
}
(function hjemmeskærmen(){
  målDødtFelt();
  window.addEventListener('resize', målDødtFelt);
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installKald = e;
    if(visInstallation()) tegn();
  });
  window.addEventListener('appinstalled', () => {
    installKald = null; installeretNu = true;
    if(visInstallation()) tegn();
  });
  if(!kanBrugeSW()) return;
  const havdeStyring = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if(havdeStyring) nyUdgaveKlar = true; });
  navigator.serviceWorker.register('sw.js').then(reg => {
    gemTurBillederNu();
    document.addEventListener('visibilitychange', () => {
      if(document.visibilityState !== 'visible') return;
      if(nyUdgaveKlar && roligtØjeblik()){ location.reload(); return; }
      reg.update().catch(()=>{});
    });
  }).catch(()=>{ /* uden service worker er det bare en hjemmeside */ });
})();

/* =============================================================
   PÅMINDELSEN SOM BESKED PÅ TELEFONEN (K22, fase C, 7/10)
   =============================================================
   "Din arytme er nu afholdt" sendes nu fra serveren (paamind-afholdt, 0049)
   dagen efter turens sidste dag kl. 10. Kennet 6/10: har hun sagt ja til
   beskeder på telefonen, får hun en besked; ellers en mail. Aldrig begge.

   "Ja" er et push-abonnement, som telefonen giver os, og som vi gemmer på
   hendes konto (ArytmiAuth.gemPushAbonnement). Det findes kun:
   · når siden kører med service worker (https, ikke den pakkede app),
   · på iPhone KUN fra hjemmeskærmen — i Safari findes push ikke,
   · når hun selv har trykket. Telefonen spørger kun ved et tryk, og et nej
     kan kun gøres om i telefonens indstillinger.

   "Beskeder" slået fra under Profil = ingen påmindelse overhovedet. Det
   afgør serveren ud fra profiler.notifikationer; abonnementet bliver
   liggende, så det virker igen, når hun slår til.

   Den pakkede app (Capacitor) bruger stadig sine lokale beskeder
   (lægBeskeder() nedenfor). Den har intet abonnement, så serveren sender
   også en mail dér — butiksappen er parkeret (K22), så det rammer kun
   testtelefonerne. */
var pushGemt = null;   // null: ved det ikke · true: gemt på serveren · false: kunne ikke gemmes

/* Hvordan kommer påmindelsen frem på DENNE telefon? */
function beskedKanal(){
  if(erNativeApp()) return 'telefon';
  if(telefonSlags() === 'ios' && !erInstalleret()) return 'hjemmeskaerm';
  if(!kanBrugeSW() || !('PushManager' in window) || typeof Notification === 'undefined') return 'mail';
  if(Notification.permission === 'denied') return 'naegtet';
  /* Ja i telefonen, men intet abonnement på serveren (nettet var væk, eller
     telefonen gav os ikke et): så får hun spørgsmålet igen — ellers stod hun
     på mail uden en knap at prøve med. */
  if(Notification.permission === 'granted') return pushGemt === false ? 'kan' : 'telefon';
  return 'kan';
}
function beskedKanalTekst(k){
  if(k === 'telefon') return t('beskeder.telefon','Påmindelsen kommer som en besked på telefonen.');
  if(k === 'kan') return t('beskeder.kan','Påmindelsen kommer på mail. Vil du hellere have den som en besked på telefonen?');
  if(k === 'hjemmeskaerm') return t('beskeder.hjemmeskaerm','Påmindelsen kommer på mail. Den kan kun komme som en besked på telefonen, når Arytmi er lagt på hjemmeskærmen.');
  if(k === 'naegtet') return t('beskeder.naegtet','Påmindelsen kommer på mail, fordi beskeder fra Arytmi er slået fra i telefonens indstillinger.');
  return t('beskeder.mail','Påmindelsen kommer på mail.');
}
function vapidNøgle(){
  const s64 = 'BJge81ySRTMhXeeeeRpRUHSLmyAy6GQ7i70tqVKAXQMah-zSqagNqr5sxZca6UwD_qJvJVxLd6u-QekZopwcg0I';
  const bin = atob(s64.replace(/-/g,'+').replace(/_/g,'/'));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}
/* Tryk → telefonen spørger → abonnementet gemmes. Kaldes KUN fra et tryk:
   iPhone spørger kun, når spørgsmålet kommer direkte fra en handling, så
   intet må ventes på før requestPermission(). Svarer med den nye kanal. */
async function slåPushTil(){
  if(beskedKanal() !== 'kan') return beskedKanal();
  let svar = Notification.permission;
  try { if(svar === 'default') svar = await Notification.requestPermission(); }
  catch(e){ svar = 'default'; }
  if(svar !== 'granted') return beskedKanal();
  try {
    const reg = await navigator.serviceWorker.ready;
    let ab = await reg.pushManager.getSubscription();
    if(!ab){
      try { ab = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidNøgle() }); }
      catch(e){
        /* Et gammelt abonnement med en anden nøgle står i vejen. */
        const gammel = await reg.pushManager.getSubscription();
        if(gammel) await gammel.unsubscribe();
        ab = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidNøgle() });
      }
    }
    const gemt = await ArytmiAuth.gemPushAbonnement(ab);
    pushGemt = !!gemt.ok;
  } catch(e){ pushGemt = false; }
  return beskedKanal();
}
function beskedSvar(k){
  if(k === 'telefon') flash(t('beskeder.slaaettil','Godt. Påmindelsen kommer som en besked på telefonen.'), 'klokke');
  else if(k === 'naegtet') flash(beskedKanalTekst(k));
  else if(pushGemt === false) flash(t('beskeder.fejl','Det lykkedes ikke at slå beskeder til lige nu. Påmindelsen kommer på mail, og du kan prøve igen under Profil & indstillinger.'));
}
/* Fra Profil: "Ja tak, på telefonen", og når Beskeder slås til. */
async function slåBeskederTil(){
  const k = await slåPushTil();
  tegn(); beskedSvar(k);
}
function skiftBeskeder(){
  s.profil.notifikationer = !s.profil.notifikationer;
  gem(); tegn();
  if(s.profil.notifikationer && beskedKanal() === 'kan') slåBeskederTil();
}
/* Ved opstart: har hun sagt ja før, sendes abonnementet op igen. Telefonen
   kan selv have skiftet det ud, og et gem, der fejlede uden net, tages her.
   Der laves ALDRIG et nyt abonnement uden et tryk — logger en anden ind på
   telefonen, har hun ikke sagt ja, bare fordi den forrige gjorde. */
async function synkPush(){
  try {
    if(!s.onboarded || loginKræves || s.profil.notifikationer === false) return;
    if(!kanBrugeSW() || !('PushManager' in window) || typeof Notification === 'undefined') return;
    if(Notification.permission !== 'granted') return;
    const reg = await navigator.serviceWorker.ready;
    const ab = await reg.pushManager.getSubscription();
    if(!ab){ pushGemt = false; return; }   // ja i telefonen, men intet abonnement: spørg igen
    const gemt = await ArytmiAuth.gemPushAbonnement(ab);
    pushGemt = !!gemt.ok;
  } catch(e){ /* næste opstart */ }
}
/* Ved udlogning (og når kontoen slettes): telefonen er ikke hendes mere.
   Rækken slettes FØR sessionen lukkes — bagefter må hun ikke slette noget. */
async function glemPush(){
  try {
    if(!kanBrugeSW() || !('PushManager' in window)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    const ab = reg && await reg.pushManager.getSubscription();
    if(!ab) return;
    await ArytmiAuth.fjernPushAbonnement(ab.endpoint);
    await ab.unsubscribe();
  } catch(e){ /* udlogningen må aldrig vente på en besked */ }
}
/* Et tryk på en besked — fra sw.js, eller fra adressen ved opstart.
   'afholdt' åbner anmeldelsen; 'delt' og 'gaest' (K23, 7/10) åbner turen
   direkte (Kennet 16/9: "et tryk åbner turen direkte — ikke bare appen"). */
const BESKED_SLAGS = ['afholdt', 'delt', 'gaest'];
function åbnBesked(x){
  if(!x || loginKræves) return;   // intet må lægge sig oven på login
  if(x.slags === 'afholdt') åbnAnmeldelseFraBesked(x);
  else if(x.slags === 'delt' || x.slags === 'gaest') åbnTurFraBesked(x);
}
/* Turen findes måske ikke på telefonen endnu: beskeden kom fra serveren,
   og en delt tur er rejsemakkerens, ikke hendes. Så hentes der først — som
   ved påmindelsen. Findes den slet ikke (slettet, eller allerede afholdt),
   lander hun på forsiden i stedet for et tomt skærmbillede. */
async function åbnTurFraBesked(x){
  if(!s.onboarded || !x.tur) return;
  const findes = () => (s.arytmer || []).some(a => a && a.id === x.tur);
  if(!findes() && window.ArytmiSync && ArytmiSync.hent){
    try { await ArytmiSync.hent(); } catch(e){ /* uden net: det, vi har */ }
  }
  if(loginKræves) return;
  if(x.slags === 'delt') s.deltVarsel = [];   // kortet har gjort sit arbejde — som seDeltTur()
  nulstilHistorik();
  if(findes()){ s.aktivId = x.tur; gem(); gåTil('turplan'); }
  else { gem(); gåTil('hjem'); }
}
/* Genoptages appen fra baggrunden, kører opstarten ikke — det så vi på
   Kennets iPhone 7/10: abonnementet kom først op igen, da appen var lukket
   helt. Derfor sendes det også op, når hun kommer tilbage. Højst én gang i
   timen: det er et kald, ikke noget, der skal ske ved hvert kig. */
var pushSidstSynket = 0;
function synkPushHvisLængeSiden(){
  if(Date.now() - pushSidstSynket < 3600e3) return;
  pushSidstSynket = Date.now();
  synkPush();
}
(function beskederPåTelefonen(){
  /* Tryk på beskeden, mens appen er åben: sw.js sender den hertil. */
  if(kanBrugeSW()){
    navigator.serviceWorker.addEventListener('message', e => {
      const d = e.data || {};
      if(d.slags === 'aabn-besked' && d.besked) åbnBesked(d.besked);
    });
    synkPushHvisLængeSiden();
    document.addEventListener('visibilitychange', () => {
      if(document.visibilityState === 'visible') synkPushHvisLængeSiden();
    });
  }
  /* Linket i mailen, og et tryk på beskeden, når appen var lukket:
     app.arytmi.com/?besked=afholdt&sted=…&dato=… eller ?besked=delt&tur=…
     Adressen ryddes, så et genindlæs ikke åbner det igen. */
  let q;
  try { q = new URLSearchParams(location.search); } catch(e){ return; }
  const slags = q.get('besked');
  if(!BESKED_SLAGS.includes(slags)) return;
  try { history.replaceState(null, '', location.pathname + location.hash); } catch(e){}
  /* Ikke logget ind her: linket er åbnet i en browser, ikke i appen på
     hjemmeskærmen (iPhone kan ikke åbne den fra et link). Guiden siger det. */
  if(!s.onboarded){ beskedLinkUdenApp = true; if(visInstallation()) tegn(); return; }
  const besked = { slags, sted: q.get('sted') || '', dato: q.get('dato') || '', tur: q.get('tur') || '' };
  /* Først når vi ved, at hun er logget ind. Er sessionen væk, kommer
     login-skærmen (tjekLogin) — og intet må ligge oven på den.
     Uden klient (testen) svarer harSession null, og så åbnes den. */
  const åbn = () => åbnBesked(besked);
  if(typeof ArytmiAuth !== 'undefined' && ArytmiAuth.harSession){
    ArytmiAuth.harSession().then(inde => { if(inde !== false) åbn(); }).catch(åbn);
  } else åbn();
})();

/* =============================================================
   "DIN ARYTME ER NU AFHOLDT" — beskeden på telefonen (OD 4/10)
   =============================================================
   Når en turs sidste dag er gået, lyser telefonen op dagen efter kl. 10
   med en besked, og et tryk på den åbner anmeldelsen i loggen.

   LOKALE beskeder, ikke push: telefonen planlægger dem selv ud fra
   turens datoer, og der er ingen server indblandet. Derfor virker de
   også uden net. Pluginnet er @capacitor/local-notifications, og det
   findes kun i den pakkede app — i en browser og i navigationstesten er
   der intet plugin, og alt her gør ingenting.

   Planen lægges forfra hver gang: alle ventende beskeder fjernes, og én
   pr. kommende tur lægges ind igen. Så kan en flyttet dato, en slettet
   tur eller "Beskeder" slået fra under Profil aldrig efterlade en
   besked, der ikke passer. Vi bruger ikke lokale beskeder til andet —
   gør vi det en dag, skal oprydningen nedenfor skelne dem ad.

   Teksterne er t()-nøgler og kan rettes i bagrummet. En besked, der
   allerede er planlagt, beholder den tekst, den blev lagt med, til næste
   gang planen lægges om (næste gem). */
function lokaleBeskeder(){
  const c = window.Capacitor;
  if(!c || typeof c.isNativePlatform !== 'function' || !c.isNativePlatform()) return null;
  return (c.Plugins && c.Plugins.LocalNotifications) || null;
}
/* Et fast tal pr. tur, så samme tur altid får samme besked-id. Android
   vil have et 32-bit heltal. */
function beskedId(turId){
  let h = 0;
  for(const tegn of String(turId)) h = (h * 31 + tegn.codePointAt(0)) | 0;
  return Math.abs(h) || 1;
}
var beskedPause = null;   // var, ikke let: gem() kan kalde planlægBeskeder(), før linjen her er nået
function planlægBeskeder(){
  if(!lokaleBeskeder()) return;
  /* gem() kaldes ved hvert tryk. Planen lægges først, når der har været
     stille et øjeblik — ellers ville ti afkrydsninger i træk blive til ti
     runder over broen til telefonen. */
  clearTimeout(beskedPause);
  beskedPause = setTimeout(lægBeskeder, 1500);
}
async function lægBeskeder(){
  const LN = lokaleBeskeder(); if(!LN) return;
  try{
    const ventende = ((await LN.getPending()) || {}).notifications || [];
    if(ventende.length) await LN.cancel({ notifications: ventende.map(n => ({ id: n.id })) });
    if(!s.onboarded || (s.profil && s.profil.notifikationer === false)) return;
    const nu = Date.now();
    const titel = t('besked.afholdttitel','Din arytme er nu afholdt');
    const brød = t('besked.afholdt','Vi håber, du nød dit lille afbræk og er vendt tilbage til din vante rytme. Hvis du har lyst, kan du anmelde din arytme i din personlige log — tryk her. Så kan du senere vende tilbage, huske det bedste og rette det, der kunne være bedre. Anmeldelsen bliver ikke offentliggjort.');
    const nye = (s.arytmer || []).map(a => {
      const slut = turSlutDato(a);
      if(!slut || tomKladde(a)) return null;
      const hvornår = new Date(slut + 'T10:00:00');
      hvornår.setDate(hvornår.getDate() + 1);
      if(isNaN(hvornår) || hvornår.getTime() <= nu) return null;
      return {
        id: beskedId(a.id), title: titel, body: brød, largeBody: brød,
        schedule: { at: hvornår, allowWhileIdle: true },
        /* IKKE PRÆCIS (5/10). Pluginnets standard er en præcis alarm, og uden
           den tilladelse åbner det Androids skærm "Alarmer og påmindelser" —
           ved HVERT schedule(), og planen lægges om ved hvert gem. Oliivias
           telefon (versionCode 9) fik skærmen igen og igen, med en grå kontakt,
           fordi tilladelsen er fjernet i manifestet. Beskeden dagen efter kl.
           10 skal ikke ramme minuttet. Kun Android læser feltet. */
        isExactNotification: false,
        extra: { slags: 'afholdt', sted: a.destination ? a.destination.navn : 'Jeres sted', dato: a.dato || '' }
      };
    }).filter(Boolean);
    if(nye.length) await LN.schedule({ notifications: nye });
  }catch(e){ /* en besked, der ikke kunne lægges, må aldrig vælte appen */ }
}
/* Tryk på beskeden: turen er allerede (eller bliver nu) flyttet ned i
   loggen af logAfholdteTure() og har fået et nyt id dér. Den findes igen
   på sted og dato; ellers åbnes den nyeste tur, der ikke er anmeldt. */
async function åbnAnmeldelseFraBesked(x){
  if(!s.onboarded) return;
  logAfholdteTure();
  nulstilHistorik(); gåTil('log');
  const find = () => {
    const uanmeldte = (s.ture || []).filter(tur => !tur.score);
    return { uanmeldte, tur: uanmeldte.find(tur => tur.sted === x.sted && tur.dato === x.dato) };
  };
  let { uanmeldte, tur } = find();
  /* Beskeden kommer nu fra serveren (K22, fase C). Har telefonen ikke
     hentet siden — appen lå i baggrunden, og iPhone lukker forbindelsen —
     kender den ikke turen endnu. Så hentes der først. Kennets iPhone 7/10:
     beskeden kom, men et tryk åbnede ingen anmeldelse. */
  if(!tur && window.ArytmiSync && ArytmiSync.hent){
    try { await ArytmiSync.hent(); } catch(e){ /* uden net: den nyeste, vi har */ }
    logAfholdteTure();
    ({ uanmeldte, tur } = find());
  }
  tur = tur || uanmeldte[0];
  if(tur && aktivSkærm === 'log') logSpontanModal(tur.id);
}
(function beskedLyttere(){
  const LN = lokaleBeskeder(); if(!LN) return;
  try{
    LN.addListener('localNotificationActionPerformed', e => {
      const x = (e && e.notification && e.notification.extra) || {};
      if(x.slags === 'afholdt') åbnAnmeldelseFraBesked(x);
    });
  }catch(e){}
  planlægBeskeder();
})();

/* ---------- ER HUN STADIG LOGGET IND? (4/10) ----------
   Ved opstart, og hvis sessionen forsvinder undervejs. Læses lokalt — et
   fly-mode-øjeblik smider ingen ud (en udløbet nøgle tæller som logget ind).
   Ikke før velkomsten er gennemført, og ikke midt i aktiveringslinket. */
async function tjekLogin(){
  if(!s.onboarded || akToken || typeof ArytmiAuth === 'undefined' || !ArytmiAuth.harSession) return;
  const inde = await ArytmiAuth.harSession();
  if(inde === false && !loginKræves){ loginKræves = true; tegn(); }
}
if(typeof ArytmiAuth !== 'undefined' && ArytmiAuth.vedUdlogning){
  ArytmiAuth.vedUdlogning(() => { if(s.onboarded && !loginKræves){ loginKræves = true; tegn(); } });
}
tjekLogin();
redOpstart();
