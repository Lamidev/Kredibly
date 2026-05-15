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
    event.respondWith(
      fetch(event.request).catch(err => {
        console.warn('🌐 API Fetch failed (expected if offline):', err);
        return new Response(JSON.stringify({ success: false, error: 'Network unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
      .then(response => {
        if (!response) {
            return new Response('Offline: Resource not in cache.', { status: 503, statusText: 'Service Unavailable' });
        }
        return response;
      })
  );
});

// 🔔 PUSH NOTIFICATIONS
self.addEventListener('push', event => {
    let data = { title: 'Kredibly Notification', body: 'You have a new update.' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Kredibly', body: event.data.text() };
        }
    }

    const options = {
        body: data.body,
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/dashboard'
        },
        actions: [
            { action: 'view', title: 'View Details' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    const urlToOpen = event.notification.data.url || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                // If a tab is already open, focus it
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open a new tab
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});
