// Cache names
const staticCache = 'static-cache-v1';
const dynamicCache = 'dynamic-cache-v1';
const apiCache = 'api-cache-v1';

// Assets to cache
const assetsToCache = [
  '/offline.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json',
  '/static/js/vendor-react.js',
  '/static/js/vendor-ui.js',
  '/static/js/vendor-charts.js',
  '/static/js/vendor-network.js',
  '/static/js/vendor-utils.js'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCache).then(cache => {
      return cache.addAll(assetsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== staticCache && key !== dynamicCache && key !== apiCache)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // API requests
  if (request.url.includes('/api/')) {
    event.respondWith(
      caches.open(apiCache).then(cache => {
        return fetch(request)
          .then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cache.match(request));
      })
    );
    return;
  }

  // Static assets
  if (request.url.includes('/static/')) {
    event.respondWith(
      caches.open(staticCache).then(cache => {
        return cache.match(request).then(response => {
          return response || fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Dynamic content
  event.respondWith(
    caches.match(request).then(cacheResponse => {
      return cacheResponse || fetch(request).then(networkResponse => {
        return caches.open(dynamicCache).then(cache => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        if (request.headers.get('Accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
      });
    })
  );
});
