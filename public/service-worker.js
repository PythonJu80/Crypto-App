const CACHE_NAME = 'crypto-app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/static/images/logo.png',
  '/manifest.json',
  '/favicon.ico'
];

const API_CACHE_NAME = 'crypto-app-api-v1';
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE_NAME
            )
            .map((cacheName) => caches.delete(cacheName))
        );
      })
    ])
  );
});

// Helper function to determine if a request is for an API
const isApiRequest = (request) => {
  return request.url.includes('/api/');
};

// Helper function to determine if a response should be cached
const shouldCacheResponse = (response) => {
  return response.status === 200 && 
         response.headers.get('content-type')?.includes('application/json');
};

// Helper function to determine if a cached response is still valid
const isCachedResponseValid = (response) => {
  if (!response) return false;
  const cachedTime = new Date(response.headers.get('cached-time'));
  return (Date.now() - cachedTime.getTime()) < API_CACHE_DURATION;
};

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Handle API requests
  if (isApiRequest(request)) {
    event.respondWith(
      caches.open(API_CACHE_NAME)
        .then(async (cache) => {
          // Try to get the cached response
          const cachedResponse = await cache.match(request);
          
          if (cachedResponse && isCachedResponseValid(cachedResponse)) {
            return cachedResponse;
          }

          // If no valid cache, make network request
          try {
            const networkResponse = await fetch(request);
            
            if (shouldCacheResponse(networkResponse)) {
              const clonedResponse = networkResponse.clone();
              const headers = new Headers(clonedResponse.headers);
              headers.append('cached-time', new Date().toISOString());
              
              const responseToCache = new Response(
                await clonedResponse.blob(), 
                { 
                  status: clonedResponse.status,
                  statusText: clonedResponse.statusText,
                  headers: headers
                }
              );
              
              cache.put(request, responseToCache);
            }
            
            return networkResponse;
          } catch (error) {
            // If network request fails and we have a cached response, return it
            if (cachedResponse) {
              return cachedResponse;
            }
            throw error;
          }
        })
    );
    return;
  }

  // Handle static assets and other requests
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            // Cache successful GET requests for static assets
            if (request.method === 'GET' && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch((error) => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            throw error;
          });
      })
  );
});
