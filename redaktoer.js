/* =============================================================
   EDITOR-TILSTANDEN — datalaget (5/10 2026)
   =============================================================

   Kennet 5/10: "Jeg vil gerne have at Admins kan vælge 'editor mode' i
   profilen og dermed ændre i alt på appen. Det er et stort ønske for
   Oliivia at hun ikke skal i bagrummet hver gang." Og: "Kør på med det
   hele" — tekster, steder og billeder, som kladde og så Udgiv.

   ⚠️ DET ÆNDRER PLANEN. Backend-planen sagde om bagrummet: "rediger ·
   forhåndsvis · udgiv · rul tilbage. Ikke et byggeværktøj. Ikke en
   side-editor" — og appen var kun forhåndsvisningen. Kennet har valgt
   anderledes 5/10. Bagrummet bliver stående; det her er en anden dør ind
   til de SAMME tabeller, med de SAMME regler.

   SAMME REGLER, IKKE NYE:
     · Kun admins. RLS'en i 0019/0023/0034 afgør det — ikke appen.
     · To-faktor. Siden 0037 kræver databasen aal2 for ENHVER skrivning fra
       en konto med en bekræftet faktor. Appens login er aal1 (kodeord), så
       editoren beder om koden fra authenticator-appen, før den slås til.
       Uden den gemmer RLS'en ingenting — STILLE, fordi en politik filtrerer
       i stedet for at afvise. Derfor spørger vi efter `.select()` hver gang
       og siger det højt, når der kom 0 rækker tilbage.
     · Pladsholderne. `{dato}` m.fl. kontrolleres af en trigger (0019);
       `manglendePladsholdere()` siger det samme FØR vi sender, så hun ikke
       skal læse en databasefejl.
     · Billederne skaleres og nummerpladerne sløres, før de lægges op —
       præcis som bagrummet (se redaktoer-plader.js).
     · Udgivelsen går gennem `udgiv-tekster`, den ENE skriver af bundtet.

   Filen rører ikke appens skærme. Den kender ikke til `tegn()`. Den taler
   med databasen og svarer med { ok, fejl } — som auth.js.
   ============================================================= */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArytmiRedaktoer = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function klient() {
    const A = (typeof ArytmiAuth !== 'undefined') ? ArytmiAuth : null;
    return A && A.faaKlient ? A.faaKlient() : null;
  }
  const INGEN = { ok: false, fejl: 'Ingen forbindelse til Arytmi lige nu.' };

  /* En databasefejl, et menneske kan læse. De to, der faktisk sker:
     to-faktoren er udløbet, og en pladsholder mangler. */
  function forklar(e) {
    const b = String((e && (e.message || e.error)) || '');
    if (/mangler \{/.test(b) || (e && e.code === '23514')) return b.replace(/^.*?Teksten/, 'Teksten');
    /* RLS afviser en INSERT højt (en UPDATE filtrerer stille til 0 rækker).
       Begge betyder det samme her: sessionen er ikke aal2 længere. */
    if (/row-level security|jwt|aal|mfa/i.test(b)) return 'Koden fra din authenticator er udløbet. Slå editoren fra og til igen.';
    if (/failed to fetch|network/i.test(b)) return 'Ingen forbindelse. Tjek nettet, og prøv igen.';
    return b || 'Det gik ikke. Prøv igen.';
  }

  /* ---------- TO-FAKTOR ---------- */

  /* { nu: 'aal1'|'aal2', faktor: id|null }. `faktor` er null, når kontoen
     ingen bekræftet faktor har — så kræver databasen heller ikke aal2
     (nødudgangen i 0037), og editoren kan slås til uden kode. */
  async function sikkerhed() {
    const k = klient();
    if (!k) return null;
    try {
      const [niv, fak] = await Promise.all([
        k.auth.mfa.getAuthenticatorAssuranceLevel(),
        k.auth.mfa.listFactors()
      ]);
      const totp = ((fak.data && fak.data.totp) || []).filter(f => f.status === 'verified');
      return { nu: (niv.data && niv.data.currentLevel) || 'aal1', faktor: totp.length ? totp[0].id : null };
    } catch (e) {
      return null;
    }
  }

  async function bekraeftKode(faktor, kode) {
    const k = klient();
    if (!k) return INGEN;
    const ren = String(kode || '').replace(/\D/g, '');
    if (ren.length !== 6) return { ok: false, fejl: 'Koden er seks cifre fra din authenticator-app.' };
    try {
      const { error } = await k.auth.mfa.challengeAndVerify({ factorId: faktor, code: ren });
      if (error) {
        return { ok: false, fejl: /invalid|expired/i.test(error.message || '')
          ? 'Koden passer ikke. Brug den, der står i appen lige nu.' : forklar(error) };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, fejl: forklar(e) };
    }
  }

  /* ---------- TEKSTERNE ---------- */

  /* Alle rækker: { noegle: { faldbak, tekst } }. `tekst` null = koden
     gælder. Det er arbejdsbordet, ikke det udgivne bundt. */
  async function hentTekster() {
    const k = klient();
    if (!k) return null;
    try {
      const { data, error } = await k.from('indhold_tekst').select('noegle,faldbak,tekst');
      if (error) throw error;
      const ud = Object.create(null);
      for (const r of data || []) ud[r.noegle] = { faldbak: r.faldbak, tekst: r.tekst };
      return ud;
    } catch (e) {
      return null;
    }
  }

  function pladsholdere(s) {
    return Array.from(new Set(String(s || '').match(/\{[a-z0-9_]+\}/g) || []));
  }
  /* Det samme som triggeren i 0019: kun dem, faldbakken KRÆVER. */
  function manglendePladsholdere(faldbak, tekst) {
    if (tekst == null) return [];
    const har = pladsholdere(tekst);
    return pladsholdere(faldbak).filter(p => !har.includes(p));
  }

  /* Gemmer en rettelse. Tom tekst = tilbage til koden (null), som i
     bagrummet. Findes nøglen ikke i tabellen endnu (en ny tekst, der ikke
     er kørt ind med hent-noegler.mjs), laves rækken med kodens faldbak. */
  async function gemTekst(noegle, faldbak, tekst) {
    const k = klient();
    if (!k) return INGEN;
    const ny = (tekst == null || String(tekst).trim() === '') ? null : String(tekst);
    const mangler = manglendePladsholdere(faldbak, ny);
    if (mangler.length) return { ok: false, fejl: 'Teksten skal stadig indeholde ' + mangler.join(' og ') + ' — ellers mangler der noget på skærmen.' };
    try {
      let { data, error } = await k.from('indhold_tekst').update({ tekst: ny }).eq('noegle', noegle).select('noegle,tekst');
      if (error) throw error;
      if (!data || !data.length) {
        ({ data, error } = await k.from('indhold_tekst').insert({ noegle, faldbak, tekst: ny }).select('noegle,tekst'));
        if (error) throw error;
      }
      if (!data || !data.length) return { ok: false, fejl: 'Serveren gemte ingenting. Slå editoren fra og til igen med en ny kode.' };
      return { ok: true, tekst: data[0].tekst };
    } catch (e) {
      return { ok: false, fejl: forklar(e) };
    }
  }

  /* ---------- STEDERNE ---------- */

  /* Alle kolonner, som sync.js' hentKladder: så virker editoren både før og
     efter, at en ny kolonne (adresse, 0047) er lagt på. */
  const TUR_FELTER = '*';

  /* Kun de felter, editoren må røre. `id`, `raekkefoelge` og `opdateret*`
     bliver i bagrummet: et id er en adresse, andre ting peger på. */
  const MÅ_RETTES = ['navn', 'ord', 'kort', 'beskrivelse', 'fac_toilet', 'fac_handel', 'fac_aftensmad',
    'fac_morgen', 'lat', 'lon', 'klar', 'oe_lys', 'oe_natur', 'oe_stemning', 'billeder', 'synlig',
    'anbefalet', 'stjerner', 'god_til_boern', 'adresse'];

  async function gemTur(id, felter) {
    const k = klient();
    if (!k) return INGEN;
    const ren = {};
    for (const f of MÅ_RETTES) if (Object.prototype.hasOwnProperty.call(felter, f)) ren[f] = felter[f];
    if (ren.synlig && (!ren.navn && ren.navn !== undefined)) return { ok: false, fejl: 'Et sted skal have et navn, før det kan vises.' };
    try {
      const { data, error } = await k.from('indhold_tur').update(ren).eq('id', id).select(TUR_FELTER);
      if (error) throw error;
      if (!data || !data.length) return { ok: false, fejl: 'Serveren gemte ingenting. Slå editoren fra og til igen med en ny kode.' };
      return { ok: true, raekke: data[0] };
    } catch (e) {
      const b = String((e && e.message) || '');
      if (/tur_kan_vises/.test(b)) return { ok: false, fejl: 'Et sted skal have navn og placering, før det kan vises i appen.' };
      return { ok: false, fejl: forklar(e) };
    }
  }

  /* Id'et laves af navnet, så hun ikke skal finde på et (bagrummet beder om
     det). Samme regel som skemaet: små bogstaver, tal og bindestreg, højst
     40 tegn (`tur_id_er_et_slug`). Er det taget, kommer der et tal på. */
  function idAfNavn(navn, optaget) {
    const grund = String(navn || '').toLowerCase()
      .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 34) || 'sted';
    const brugt = new Set(optaget || []);
    if (!brugt.has(grund)) return grund;
    for (let n = 2; n < 1000; n++) if (!brugt.has(grund + '-' + n)) return grund + '-' + n;
    return grund + '-' + Date.now().toString(36).slice(-4);
  }

  /* Et nyt sted fødes som KLADDE (`synlig` er falsk i skemaet), sidst i
     rækken — samme som bagrummets "Ny tur". Det når ingen telefon, før
     hun selv har sat fluebenet, og databasen siger fra, hvis navn eller
     placering mangler. */
  async function nytSted(navn, optaget, raekkefoelge) {
    const k = klient();
    if (!k) return INGEN;
    const rent = String(navn || '').trim();
    if (!rent) return { ok: false, fejl: 'Skriv stedets navn.' };
    const id = idAfNavn(rent, optaget);
    try {
      const { data, error } = await k.from('indhold_tur')
        .insert({ id, navn: rent, raekkefoelge: raekkefoelge || 0 }).select(TUR_FELTER);
      if (error) throw error;
      if (!data || !data.length) return { ok: false, fejl: 'Serveren oprettede ingenting.' };
      return { ok: true, raekke: data[0] };
    } catch (e) {
      if (/duplicate key|23505/.test(String((e && (e.message || e.code)) || ''))) {
        return { ok: false, fejl: 'Der findes allerede et sted med det id. Prøv et lidt andet navn.' };
      }
      return { ok: false, fejl: forklar(e) };
    }
  }

  /* Kun en KLADDE kan slettes — politikken i 0023 kræver `not synlig`. Et
     sted, kunderne kan se, skal først tages ud af appen og udgives sådan. */
  async function sletKladde(id) {
    const k = klient();
    if (!k) return INGEN;
    try {
      const { data, error } = await k.from('indhold_tur').delete().eq('id', id).eq('synlig', false).select('id');
      if (error) throw error;
      if (!data || !data.length) return { ok: false, fejl: 'Intet blev slettet. Kun en kladde kan slettes — og det kræver koden fra din authenticator.' };
      return { ok: true };
    } catch (e) {
      return { ok: false, fejl: forklar(e) };
    }
  }

  /* ---------- BILLEDERNE ----------
     Tallene er de samme som bagrummets og `vaerktoej/skaler-billeder.mjs`.
     Rettes ét sted, skal de rettes alle tre. */
  const SPAND = 'stedbilleder';
  const MAKS_BILLEDE = 25 * 1024 * 1024;
  const MAKS_SIDE = 1920;
  const KVALITET = 0.82;
  const LILLE_NOK = 2 * 1024 * 1024;
  const TILLADTE = { 'image/jpeg': 1, 'image/png': 1, 'image/webp': 1 };

  function billedSti(turId, fil) {
    const endelse = fil.type === 'image/png' ? 'png' : fil.type === 'image/webp' ? 'webp' : 'jpg';
    const rent = String(turId).toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40);
    return rent + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + '.' + endelse;
  }

  /* `imageOrientation: 'from-image'`: et billede på højkant står kun op,
     fordi EXIF siger det. Lærredet har ingen EXIF, så drejningen sker her —
     og positionen fra kameraets GPS forsvinder med. */
  async function skaler(fil) {
    if (typeof createImageBitmap !== 'function') throw new Error('Telefonen kan ikke skalere billeder.');
    let bm;
    try { bm = await createImageBitmap(fil, { imageOrientation: 'from-image' }); }
    catch (e) { throw new Error('Filen kunne ikke læses som et billede.'); }
    const b = bm.width, h = bm.height;
    if (Math.max(b, h) <= MAKS_SIDE && fil.size <= LILLE_NOK) { bm.close(); return fil; }
    const f = Math.min(1, MAKS_SIDE / Math.max(b, h));
    const lær = document.createElement('canvas');
    lær.width = Math.round(b * f); lær.height = Math.round(h * f);
    const c = lær.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, lær.width, lær.height);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(bm, 0, 0, lær.width, lær.height);
    bm.close();
    return new Promise((ok, nej) => lær.toBlob(blob => {
      if (!blob) return nej(new Error('Billedet kunne ikke skaleres ned.'));
      ok(blob.size < fil.size ? blob : fil);
    }, 'image/jpeg', KVALITET));
  }

  /* Svarer med { ok, url, plader }. Kan pladerne ikke sløres, lægges
     billedet IKKE op — samme regel som bagrummet. */
  async function laegOpBillede(turId, fil) {
    const k = klient();
    if (!k) return INGEN;
    if (!fil || !TILLADTE[fil.type]) return { ok: false, fejl: 'Det er ikke et billede, vi kan tage imod. Brug JPG, PNG eller WEBP.' };
    try {
      let data = await skaler(fil);
      if (typeof window.sloerPlader !== 'function') throw new Error('Sløringen af nummerplader mangler. Billedet er ikke lagt op.');
      const sl = await window.sloerPlader(data);
      data = sl.data;
      if (data.size > MAKS_BILLEDE) return { ok: false, fejl: 'Billedet er stadig for stort efter nedskalering.' };
      const sti = billedSti(turId, data);
      const { error } = await k.storage.from(SPAND).upload(sti, data, { contentType: data.type || 'image/jpeg', upsert: false });
      if (error) throw error;
      const { data: off } = k.storage.from(SPAND).getPublicUrl(sti);
      return { ok: true, url: off.publicUrl, plader: sl.antal };
    } catch (e) {
      const b = String((e && e.message) || '');
      if (/row-level security|unauthorized|403/i.test(b)) return { ok: false, fejl: 'Billedet blev afvist. Slå editoren fra og til igen med en ny kode.' };
      return { ok: false, fejl: b || forklar(e) };
    }
  }

  /* ---------- UDGIVELSEN ---------- */

  async function udgiv() {
    const k = klient();
    if (!k) return INGEN;
    try {
      const { data } = await k.auth.getSession();
      const token = data && data.session && data.session.access_token;
      if (!token) return { ok: false, fejl: 'Du er ikke logget ind.' };
      const P = ArytmiAuth.PROJEKT;
      const r = await fetch(P.url + '/functions/v1/udgiv-tekster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: P.anon, Authorization: 'Bearer ' + token },
        body: '{}'
      });
      const svar = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, fejl: svar.error || ('Udgivelsen blev afvist (' + r.status + ').') };
      return { ok: true, svar };
    } catch (e) {
      return { ok: false, fejl: forklar(e) };
    }
  }

  /* ---------- HVAD ER IKKE UDGIVET ----------
     Ren sammenligning, ingen net: arbejdsbordet mod det bundt, telefonen
     sidst hentede. Teksterne: en række med tekst, der ikke står sådan i
     bundtet — eller en, der er nulstillet, men stadig står i bundtet.
     Stederne: en synlig række, hvis felter ikke er bundtets, eller en, der
     er kommet til eller taget ud. */
  const SAMMENLIGN = ['navn', 'ord', 'kort', 'beskrivelse', 'fac_toilet', 'fac_handel', 'fac_aftensmad', 'fac_morgen',
    'lat', 'lon', 'klar', 'oe_lys', 'oe_natur', 'oe_stemning', 'billeder', 'anbefalet', 'stjerner', 'god_til_boern', 'adresse'];
  function ikkeUdgivet(bundt, tekster, ture) {
    const bt = (bundt && bundt.tekster) || {};
    const ud = { tekster: [], ture: [] };
    for (const n in (tekster || {})) {
      const r = tekster[n];
      const udgivet = Object.prototype.hasOwnProperty.call(bt, n) ? bt[n] : null;
      if ((r.tekst || null) !== (udgivet || null)) ud.tekster.push(n);
    }
    const bture = Object.create(null);
    for (const r of ((bundt && bundt.ture) || [])) if (r && r.id) bture[r.id] = r;
    for (const r of (ture || [])) {
      const b = bture[r.id];
      if (!r.synlig) { if (b) ud.ture.push(r.id); continue; }
      if (!b) { ud.ture.push(r.id); continue; }
      for (const f of SAMMENLIGN) {
        const x = r[f], y = b[f];
        /* Tom og manglende er det samme: en ny kolonne (adresse, 0047) står
           som '' i databasen, før bundtet overhovedet kender den. */
        const tom = v => (v == null || v === '') ? null : v;
        const ens = Array.isArray(x) ? JSON.stringify(x) === JSON.stringify(y || []) : tom(x) === tom(y);
        if (!ens) { ud.ture.push(r.id); break; }
      }
    }
    return ud;
  }

  return {
    sikkerhed, bekraeftKode,
    hentTekster, gemTekst, manglendePladsholdere,
    gemTur, laegOpBillede, nytSted, idAfNavn, sletKladde,
    udgiv, ikkeUdgivet
  };
});
