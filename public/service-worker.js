// Service Worker for New Boss Gym PWA - Robust Update & Fresh Data Architecture
const CACHE_VERSION = 'boss-gym-v4.0';
const STATIC_CACHE = `boss-gym-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `boss-gym-runtime-${CACHE_VERSION}`;

// Essential static assets to cache on install (app shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
];

// URLs/Domains that must NEVER be permanently cached (Fresh Dynamic Data requirement)
const DYNAMIC_PATTERNS = [
  'supabase.co',
  'googleapis.com',
  'firebaseio.com',
  'firestore',
  '/api/',
  'wa.me',
  'gym_locations',
  'attendance',
  'sessions',
  'members',
  'qr_config',
];

// Helper to determine if a request is dynamic data
function isDynamicRequest(url) {
  return DYNAMIC_PATTERNS.some((pattern) => url.includes(pattern));
}

// Install event - pre-cache static application shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static app shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.warn('[SW] Pre-caching warning:', err);
      })
  );
});

// Activate event - clean up old caches safely
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Purge old versions of static and runtime caches
              return cacheName.startsWith('boss-gym-') &&
                     cacheName !== STATIC_CACHE &&
                     cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting deprecated cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients for current version');
        return self.clients.claim();
      })
  );
});

// Fetch event - strictly separate static assets from live dynamic data
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Skip non-GET requests (mutations always go straight to network)
  if (request.method !== 'GET') return;

  // 2. Skip browser extensions and non-http(s) schemes
  if (!request.url.startsWith('http')) return;

  const url = request.url;

  // 3. Dynamic Database & API requests (Supabase, Firebase, REST)
  // MUST NEVER RETURN STALE CACHE. ALWAYS GO TO NETWORK!
  if (isDynamicRequest(url)) {
    event.respondWith(
      fetch(request).catch(() => {
        // If device is offline, check if there's any offline indication or let it fail gracefully
        return new Response(
          JSON.stringify({ error: 'Network unavailable. Operating offline.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 4. Navigation requests (HTML page loads) - Network-first with offline.html fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlinePage = await caches.match('/offline.html');
          return offlinePage || new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // 5. Versioned static assets (/assets/*, fonts, scripts, css) - Stale-while-revalidate or Cache-first
  const isStaticAsset = (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.includes('/assets/') ||
    url.includes('/icons/') ||
    url.includes('/photos/')
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch update in background for next time if not hashed
          if (!url.includes('/assets/index-')) {
            fetch(request).then((freshResponse) => {
              if (freshResponse && freshResponse.status === 200) {
                caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, freshResponse));
              }
            }).catch(() => {});
          }
          return cachedResponse;
        }

        // Cache miss -> fetch from network and cache
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // 6. Default fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Message event - handle skip waiting and cache clear commands
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING signal, activating now...');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (event.data) {
    let data;
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'New Boss Gym', body: event.data.text() };
    }

    const options = {
      body: data.body || 'New alert from New Boss Gym',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        dateOfArrival: Date.now(),
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'New Boss Gym', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
