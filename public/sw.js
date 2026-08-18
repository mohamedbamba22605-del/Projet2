const CACHE_NAME = 'le-match-continue-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-32.png',
  '/icon.svg'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, fallback to network (for static assets)
  cacheFirst: async (request) => {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  },
  
  // Network first, fallback to cache (for API calls)
  networkFirst: async (request) => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      throw error;
    }
  },
  
  // Stale while revalidate (for HTML and dynamic content)
  staleWhileRevalidate: async (request) => {
    const cached = await caches.match(request);
    const fetchPromise = fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    });
    
    return cached || fetchPromise;
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache assets one by one to avoid complete failure if one is missing
      return Promise.allSettled(
        STATIC_ASSETS.map(url => {
          return cache.add(new Request(url, { cache: 'reload' }))
            .catch(err => {
              console.log('Failed to cache:', url, err);
              // Continue even if one asset fails
            });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle GET requests from same origin
  if (url.origin !== location.origin || event.request.method !== 'GET') {
    return;
  }

  // Determine strategy based on request type
  let strategy;
  
  if (url.pathname.includes('/api/')) {
    // API calls - network first
    strategy = CACHE_STRATEGIES.networkFirst;
  } else if (
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  ) {
    // Static assets - cache first
    strategy = CACHE_STRATEGIES.cacheFirst;
  } else {
    // HTML and other content - stale while revalidate
    strategy = CACHE_STRATEGIES.staleWhileRevalidate;
  }

  event.respondWith(strategy(event.request));
});
