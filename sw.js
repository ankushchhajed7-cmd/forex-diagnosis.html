const CACHE_NAME = 'forex-diagnosis-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - NETWORK-FIRST for HTML (always get latest), cache-first for other assets
self.addEventListener('fetch', (event) => {
  const isHTML = event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // Always try network first for HTML so updates show immediately
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
    );
  } else {
    // Cache-first for icons, manifest, etc.
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
        .catch(() => caches.match('./index.html'))
    );
  }
});
