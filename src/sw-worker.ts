// ─────────────────────────────────────────────────────────────────
//  ScoreTrack — Service Worker (compilé par esbuild vers dist/sw.js)
//  La version vient de la balise <meta name="app-version"> d'index.html,
//  injectée au build (__APP_VERSION__) : l'incrémenter à chaque déploiement
//  invalide le cache sur tous les appareils.
// ─────────────────────────────────────────────────────────────────
/// <reference lib="webworker" />
export {}; // module : évite tout conflit de portée globale
declare const __APP_VERSION__: string;
const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_VERSION = 'st-v' + __APP_VERSION__;
const FONTS_CACHE   = 'st-fonts-v3';   // polices : mise à jour rare
const CDN_CACHE     = 'st-cdn-v1';     // librairies CDN : jsPDF etc.

// Fichiers de l'app à précacher (chemins relatifs à dist/, la racine déployée)
const STATIC = [
  './',
  './index.html',
  './app.js',
];

// URLs des fonts à précacher au premier chargement
const FONT_CSS_URLS = [
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Share+Tech+Mono&family=Exo+2:wght@400;600&display=swap',
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// CDN à précacher (jsPDF)
const CDN_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];
const CDN_HOSTS = ['cdnjs.cloudflare.com'];

/** Précache tolérant : un fichier absent n'empêche pas l'installation. */
async function precache(cache: Cache, urls: string[], init?: RequestInit): Promise<void> {
  await Promise.all(urls.map(url =>
    fetch(url, init)
      .then(res => { if (res.ok) return cache.put(url, res); })
      .catch(() => {/* hors ligne à l'install — réessai au premier fetch */})
  ));
}

// ── Installation ──────────────────────────────────────────────────
sw.addEventListener('install', (e: ExtendableEvent) => {
  e.waitUntil((async () => {
    // 1. Fichiers statiques de l'app
    await precache(await caches.open(CACHE_VERSION), STATIC);
    // 2. Polices (cache séparé, survit aux mises à jour de l'app)
    await precache(await caches.open(FONTS_CACHE), FONT_CSS_URLS, { mode: 'cors' });
    // 3. CDN (jsPDF) — cache séparé, longue durée
    await precache(await caches.open(CDN_CACHE), CDN_URLS, { mode: 'cors' });
    await sw.skipWaiting();
  })());
});

// ── Activation ────────────────────────────────────────────────────
sw.addEventListener('activate', (e: ExtendableEvent) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k !== CACHE_VERSION && k !== FONTS_CACHE && k !== CDN_CACHE)
        .map(k => caches.delete(k))
    );
    await sw.clients.claim();
    const clients = await sw.clients.matchAll({ type: 'window' });
    clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION }));
  })());
});

// ── Fetch ─────────────────────────────────────────────────────────
sw.addEventListener('fetch', (e: FetchEvent) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Polices Google : cache-first (ne changent pas)
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(FONTS_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request, { mode: 'cors' }).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          }).catch(() => cached || new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // CDN (jsPDF etc.) : cache-first
  if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(CDN_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request, { mode: 'cors' }).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          }).catch(() => new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // Tout le reste : network-first, repli sur le cache hors ligne
  e.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    try {
      const res = await fetch(e.request);
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch {
      return (await cache.match(e.request))
        || new Response('Hors ligne — rechargez une fois connecté.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
           });
    }
  })());
});
