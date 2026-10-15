const CACHE_NAME = 'agentdesk-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests or SSE streams (which shouldn't be cached this way)
  const url = new URL(event.request.url);
  if (url.pathname.includes('/stream') || url.pathname.includes('/research/stream')) {
     return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache documents and valid responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
         // When offline and fetch fails, return a mock response for API calls if needed
         if (event.request.url.includes('/api/')) {
             return new Response(JSON.stringify({ error: 'Offline', isOffline: true }), { headers: { 'Content-Type': 'application/json' }});
         }
      });
    })
  );
});
