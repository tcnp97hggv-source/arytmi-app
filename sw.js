/* sw.js — Arytmi på hjemmeskærmen (K22, 6/10).
   =============================================================
   Arytmi udgives som PWA på app.arytmi.com i stedet for gennem App Store og
   Google Play. Den her fil er det, der gør appen til en app: den gemmer
   appens egne filer på telefonen, så den starter uden net, og den henter en
   ny udgave i baggrunden, så kunden aldrig skal opdatere noget.

   TRE SLAGS TRAFIK, TRE REGLER:

   · Appens skal (html, css, js, skrifter, kortmotoren, logoer). Listen og
     udgaven skrives ind af lav-www.js, når www/ samles — se de to linjer
     nedenfor. Hentes fra telefonen først. Ændres én byte, får udgaven et nyt
     fingeraftryk, og så henter telefonen den nye skal i baggrunden og tager
     den i brug næste gang (app.js genindlæser i et roligt øjeblik).

   · Billeder (billeder/ og stedbillederne i Supabase). IKKE alle 24 MB på
     forhånd. De gemmes, når de vises, og app.js beder om at få den aktive
     turs billeder hentet med det samme, så turen virker i flytilstand.
     Vises fra telefonen og friskes op i baggrunden.

   · Alt andet: røres ikke. Supabase-kaldene (data, login, funktioner,
     deling) ejes af sync.js og auth.js, som allerede er "lokalt først".
     OpenStreetMaps kortfliser gemmer vi ikke på forhånd — deres regler
     forbyder det. Adressesøgningen og bagrummets sløringsmotor heller ikke.

   I UDVIKLING (node serve.js på roden) står listen tom og udgaven er
   'udvikling'. Så går alt over nettet først, og telefonen er kun reserve —
   ellers ville man teste en gammel app uden at opdage det.

   Siden app.js kun registrerer den over https (eller med et flag lokalt),
   kører den ALDRIG i Capacitor-appen og aldrig i navigationstesten. */

const UDGAVE = 'ee91bf34e70a';   // ← lav-www.js: indholdets fingeraftryk
const SKAL = ["app.css","app.js","auth.js","brand/arytmi_logo_2026/arytmi_brun.svg","brand/arytmi_logo_2026/arytmi_creme.svg","brand/arytmi_logo_2026/favicon/arytmi_A.svg","brand/arytmi_logo_2026/favicon/arytmi_A_180.png","brand/arytmi_logo_2026/favicon/arytmi_A_192.png","brand/arytmi_logo_2026/favicon/arytmi_A_256.png","brand/arytmi_logo_2026/favicon/arytmi_A_32.png","brand/arytmi_logo_2026/favicon/arytmi_A_512.png","brand/arytmi_logo_2026/favicon/arytmi_A_maskable_512.png","brand/arytmi_logo_2026/signaturbil.svg","byer.js","fejl.js","fonts/OFL-Fraunces.txt","fonts/OFL-Inter.txt","fonts/fraunces.woff2","fonts/inter.woff2","geo.js","index.html","manifest.webmanifest","model.js","redaktoer-plader.js","redaktoer.js","sync.js","tekstdata.js","vaerktoejskasse/adapters.js","vaerktoejskasse/core.js","vendor/leaflet/leaflet.css","vendor/leaflet/leaflet.js","vendor/supabase/supabase.js"];              // ← lav-www.js: appens faste filer

const SKAL_CACHE = 'arytmi-skal-' + UDGAVE;
const BILLED_CACHE = 'arytmi-billeder-1';
const BILLED_LOFT = 200;      // så mange billeder højst — de ældste ryger først
const SUPABASE = 'https://vxleyvtumbwtkejoiaev.supabase.co';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SKAL_CACHE);
    /* cache:'reload' går uden om browserens egen cache. GitHub Pages lader
       filer ligge i 10 minutter, og en ny udgave må ikke blive samlet af
       halvt gamle filer. */
    await c.addAll(SKAL.map(u => new Request(u, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const navn of await caches.keys()) {
      if (navn.startsWith('arytmi-skal-') && navn !== SKAL_CACHE) await caches.delete(navn);
    }
    await self.clients.claim();
  })());
});

function erBillede(url, req) {
  if (url.origin === self.location.origin) return url.pathname.includes('/billeder/');
  return url.origin === SUPABASE && url.pathname.startsWith('/storage/v1/object/public/')
      && (req.destination === 'image' || /\.(jpe?g|png|webp)$/i.test(url.pathname));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (erBillede(url, req)) { e.respondWith(billede(req, url, e)); return; }
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') { e.respondWith(side(req)); return; }
  e.respondWith(fil(req));
});

/* Siden selv. Med en skal: index.html fra telefonen (?-delen er appens egen
   sag — app.js læser den). Uden skal (udvikling): nettet først. */
async function side(req) {
  if (SKAL.length) {
    const gemt = await caches.match('index.html', { cacheName: SKAL_CACHE, ignoreSearch: true });
    if (gemt) return gemt;
  }
  try { return await fetch(req); }
  catch (fejl) {
    return (await caches.match('index.html', { ignoreSearch: true })) || Response.error();
  }
}

/* Appens egne filer: fra skallen, hvis de står der; ellers nettet. ?v= i
   index.html ignoreres ved opslaget — skallen ER udgaven. */
async function fil(req) {
  if (SKAL.length) {
    const gemt = await caches.match(req, { cacheName: SKAL_CACHE, ignoreSearch: true });
    if (gemt) return gemt;
  }
  try { return await fetch(req); }
  catch (fejl) {
    return (await caches.match(req, { ignoreSearch: true })) || Response.error();
  }
}

/* Billeder: fra telefonen, friskes op i baggrunden. Supabase-billederne
   hentes med CORS, så svaret kan måles og gemmes — et "opakt" svar fylder
   i browserens regnskab, som var det 7 MB. */
async function billede(req, url, e) {
  const c = await caches.open(BILLED_CACHE);
  const gemt = await c.match(url.href);
  const hent = hentBillede(c, url.href);
  if (gemt) { e.waitUntil(hent.catch(() => {})); return gemt; }
  try { return await hent; }
  catch (fejl) { return Response.error(); }
}

async function hentBillede(c, href) {
  const fremmed = !href.startsWith(self.location.origin);
  const svar = await fetch(href, fremmed ? { mode: 'cors', credentials: 'omit' } : {});
  if (svar.ok) { await c.put(href, svar.clone()); await beskær(c); }
  return svar;
}

async function beskær(c) {
  const nøgler = await c.keys();
  for (let i = 0; i < nøgler.length - BILLED_LOFT; i++) await c.delete(nøgler[i]);
}

/* app.js beder om at få den aktive turs billeder hentet nu (gemTurBilleder).
   Kun billeder — alt andet ignoreres. */
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.slags !== 'gem-billeder' || !Array.isArray(d.urls)) return;
  e.waitUntil((async () => {
    const c = await caches.open(BILLED_CACHE);
    for (const u of d.urls.slice(0, 40)) {
      let url;
      try { url = new URL(u, self.location.href); } catch (fejl) { continue; }
      if (!erBillede(url, { destination: 'image' })) continue;
      if (await c.match(url.href)) continue;
      try { await hentBillede(c, url.href); } catch (fejl) { /* uden net: næste gang */ }
    }
  })());
});
