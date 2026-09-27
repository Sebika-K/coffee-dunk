const CACHE_NAME = 'cdunk-v1';
const APP_SHELL = [
  '/',                                
  '/static/manifest.webmanifest',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',

  '/static/css/style.css',
  '/static/js/firebase-init.js',
];

// install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

//  activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// fetch
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') {
    event.respondWith(fetch(req));
    return;
  }

  // Navigations: network-first
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const netRes = await fetch(req);
        if (netRes.ok) await cache.put(req, netRes.clone());
        return netRes;
      } catch {
        const cached = await cache.match(req) || await cache.match('/');
        return cached || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // Other GETs: cache-first
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(req);
    if (hit) return hit;

    try {
      const netRes = await fetch(req);
      if (netRes.ok) await cache.put(req, netRes.clone()); // clone before caching
      return netRes;
    } catch {
      return new Response('Offline', { status: 503 });
    }
  })());
});