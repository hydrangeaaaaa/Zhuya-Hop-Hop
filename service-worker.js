const CACHE_NAME = 'little-runner-v1';
const APP_FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/audio.js',
  './js/player.js',
  './js/obstacles.js',
  './js/game.js',
  './assets/player/idle.png',
  './assets/player/run_01.png',
  './assets/player/run_02.png',
  './assets/player/hit.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});

