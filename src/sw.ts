import { t } from './i18n';

if(screen.orientation?.lock)screen.orientation.lock('portrait').catch(()=>{});
  document.addEventListener('contextmenu',e=>e.preventDefault());
  // Zoom pinch autorisé — pas de preventDefault sur multi-touch
  // Service Worker — fonctionnement hors ligne + mise à jour automatique
  if('serviceWorker' in navigator){
    const appVer=document.querySelector('meta[name="app-version"]')?.content||'0';
    const swCode=`// ─────────────────────────────────────────────────────────────────
//  ScoreTrack — Service Worker
//  ⚠️  Incrémenter CACHE_VERSION à chaque déploiement
//      → invalide le cache sur tous les appareils
// ─────────────────────────────────────────────────────────────────
const CACHE_VERSION = 'st-v'+appVer;
const FONTS_CACHE   = 'st-fonts-v3';   // polices : mise à jour rare
const CDN_CACHE     = 'st-cdn-v1';     // librairies CDN : jsPDF etc.

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

// CDN à précacher (jsPDF)
const CDN_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];
const CDN_HOSTS = ['cdnjs.cloudflare.com'];

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

    // 3. Précache les CDN (jsPDF) — cache séparé, longue durée
    const cdnCache = await caches.open(CDN_CACHE);
    await Promise.all(
      CDN_URLS.map(url =>
        fetch(url, { mode: 'cors' })
          .then(res => { if (res.ok) cdnCache.put(url, res); })
          .catch(() => {})
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
        .filter(k => k !== CACHE_VERSION && k !== FONTS_CACHE && k !== CDN_CACHE)
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
`;
    const swBlob=new Blob([swCode],{type:'application/javascript'});
    const swUrl=URL.createObjectURL(swBlob);
    navigator.serviceWorker.register(swUrl,{scope:'./'}).catch(()=>{});
    // Reçoit la notification de mise à jour du SW
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data?.type === 'SW_UPDATED') {
        // Bannière discrète en bas — tap pour recharger
        const b = document.createElement('div');
        b.id = 'update-banner';
        b.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#00ffe0;color:#020d12;font-family:Orbitron,monospace;font-size:11px;font-weight:700;letter-spacing:0.12em;padding:10px 20px;border-radius:30px;z-index:9999;cursor:pointer;box-shadow:0 4px 20px rgba(0,255,224,0.4);white-space:nowrap;';
        b.textContent = t('updateBanner');
        b.onclick = () => location.reload();
        document.body.appendChild(b);
      }
    });
  }
