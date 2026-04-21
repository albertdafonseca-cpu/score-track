// ─────────────────────────────────────────────────────────────────
//  ScoreTrack — Service Worker
//  ⚠️  Incrémenter CACHE_VERSION à chaque déploiement
//      → invalide le cache sur tous les appareils
// ─────────────────────────────────────────────────────────────────
const CACHE_VERSION = 'st-v26';
const FONTS_CACHE   = 'st-fonts-v1';   // polices : mise à jour rare

const STATIC = [
  './',
  './index.html',
  './manifest-st.json',
  './favicon.png',
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// ── Installation ──────────────────────────────────────────────────
self.addEventListener('install', e => {
  // Précache les fichiers statiques dans le nouveau cache versionné
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(STATIC))
      .then(() => self.skipWaiting())   // prend le contrôle immédiatement
  );
});

// ── Activation ────────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    // Supprime tous les anciens caches (sauf polices)
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k !== CACHE_VERSION && k !== FONTS_CACHE)
        .map(k => caches.delete(k))
    );
    // Prend le contrôle de tous les onglets ouverts sans attendre un rechargement
    await self.clients.claim();
    // Notifie les onglets ouverts → la page affiche une bannière "Mise à jour disponible"
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION }));
  })());
});

// ── Fetch ─────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Polices Google : cache-first (elles ne changent pas)
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(FONTS_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  // Tout le reste : network-first
  // → sert toujours la version la plus récente si le réseau est disponible
  // → fallback cache si hors ligne
  e.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    try {
      const res = await fetch(e.request);
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch {
      return (await cache.match(e.request))
        || new Response('Hors ligne', { status: 503 });
    }
  })());
});
