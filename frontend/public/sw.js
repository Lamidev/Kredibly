const CACHE_NAME = 'kredibly-pwa-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // 🛡️ Skip caching for API calls to prevent 401 crashes
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
      .then(response => {
        if (!response) {
            // Return a dummy offline page or just fail gracefully 
            return new Response('Offline: Resource not in cache.', { status: 503, statusText: 'Service Unavailable' });
        }
        return response;
      })
  );
});
