/**
 * Cryptic Fox - Service Worker
 * Provides offline support and caching for static assets
 */

const CACHE_NAME = 'cryptic-fox-v3';
const RUNTIME_CACHE = 'cryptic-fox-runtime-v3';

// Assets to cache on install
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/decrypt.html',
    '/frequency.html',
    '/red.html',
    '/blog.html',
    '/js/components.js',
    '/js/script.js',
    '/js/utils.js',
    '/images/Fox-Thumbnail.jpg',
    '/images/favicon-32x32.png',
    '/images/apple-touch-icon.png'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Precaching static assets');
                return cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] Precache failed:', err))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Network-first strategy for HTML pages (for freshness)
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Clone and cache the response
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then(cache => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request)
                        .then(cached => cached || caches.match('/offline.html'))
                        .catch(() => new Response('Offline', { status: 503 }));
                })
        );
        return;
    }

    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(request)
            .then(cached => {
                if (cached) {
                    // Return cached version and update in background
                    fetch(request)
                        .then(response => {
                            if (response.ok) {
                                caches.open(RUNTIME_CACHE).then(cache => {
                                    cache.put(request, response.clone());
                                });
                            }
                        })
                        .catch(() => {}); // Ignore network errors
                    
                    return cached;
                }

                // Not in cache, fetch from network
                return fetch(request)
                    .then(response => {
                        // Don't cache error responses
                        if (!response.ok) {
                            return response;
                        }

                        // Clone and cache successful responses
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then(cache => {
                            cache.put(request, responseClone);
                        });

                        return response;
                    })
                    .catch(err => {
                        console.error('[SW] Fetch failed:', err);
                        return new Response('Network error', { status: 503 });
                    });
            })
    );
});

// Message event - allow clients to control the service worker
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data === 'clearCache') {
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(name => caches.delete(name))
                );
            })
        );
    }
});
