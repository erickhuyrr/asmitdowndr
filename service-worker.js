const CACHE_NAME = 'asmit-downloader-v1.0.0';
const API_CACHE = 'asmit-api-cache-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/asmit.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching files');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME && cache !== API_CACHE) {
            console.log('Service Worker: Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!url.protocol.startsWith('http')) return;

  if (url.hostname === 'asmitdwn20.vercel.app') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const resClone = response.clone();
          caches.open(API_CACHE).then(cache => cache.put(request, resClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
  } else {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request).then(networkResponse => {
          if (request.method === 'GET') {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, resClone));
          }
          return networkResponse;
        }))
        .catch(() => request.destination === 'document' ? caches.match('/index.html') : null)
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
