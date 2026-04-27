// ─────────────────────────────────────────────────────────────────
//  ScoreTrack — Service Worker
//  ⚠️  Incrémenter CACHE_VERSION à chaque déploiement
//      → invalide le cache sur tous les appareils
// ─────────────────────────────────────────────────────────────────
const CACHE_VERSION = 'st-v41';
const FONTS_CACHE   = 'st-fonts-v2';   // polices : mise à jour rare

const STATIC = [
  './',
  './index.html',
  './manifest-st.json',
  './favicon.png',
];

// URLs des fonts à précacher au premier chargement
const FONT_CSS_URLS = [
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Share+Tech+Mono&family=Exo+2:wght@400;600&display=swap',
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// ── Installation ──────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    // 1. Précache les fichiers statiques
    const staticCache = await caches.open(CACHE_VERSION);
    await staticCache.addAll(STATIC);

    // 2. Précache les fonts (cache séparé, survit aux mises à jour de l'app)
    const fontCache = await caches.open(FONTS_CACHE);
    await Promise.all(
      FONT_CSS_URLS.map(url =>
        fetch(url, { mode: 'cors' })
          .then(res => { if (res.ok) fontCache.put(url, res); })
          .catch(() => {/* hors ligne à l'install — réessai au premier fetch */})
      )
    );

    await self.skipWaiting();
  })());
});

// ── Activation ────────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k !== CACHE_VERSION && k !== FONTS_CACHE)
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION }));
  })());
});

// ── Fetch ─────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
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

  // Tout le reste : network-first, fallback cache hors ligne
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
