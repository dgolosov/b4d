const cacheName = 'cache-v1';
const precacheResources = [
  '/',
  '/404.html',
  '/ru/',
  '/css/main.min.css',
  'manifest.json',
  '/icons/android-chrome-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-16x16.png',
  '/icons/favicon-32x32.png',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(cacheName)
      .then(function (cache) {
        cache.addAll(precacheResources)
      })
  );
});

self.addEventListener('activate', function (event) {
});

self.addEventListener('fetch', function (event) {
  if (event.request.url.startsWith('http')) {
    event.respondWith(
      caches.match(event.request)
        .then(function (cachedResponse) {
            if (cachedResponse) {
              return cachedResponse;
            }
            return fetch(event.request);
        }),
    );
  }
});
