const CACHE = 'brainbite-v2.0-shell-v1';
const FALLBACK = './index.html';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './brainbite-core.mjs',
  './manifest.webmanifest',
  './privacy.html',
  './terms.html',
  './support.html',
  './assets/art/nib.svg',
  './assets/art/zip.svg',
  './assets/art/bloop.svg',
  './assets/art/scout.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './audio/AUDIO_MANIFEST.json',
  './audio/AUDIO_MANIFEST_v1.8.json',
  './audio/AUDIO_FILES_v6.json',
];

self.addEventListener('install', event => {
  event.waitUntil(Promise.all([
    caches.open(CACHE).then(cache => cache.addAll(CORE)),
    self.skipWaiting(),
  ]));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => response.ok ? response : Promise.reject()).catch(() => caches.match(FALLBACK)));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && response.type === 'basic') caches.open(CACHE).then(cache => cache.put(request, response.clone()));
    return response;
  })));
});
