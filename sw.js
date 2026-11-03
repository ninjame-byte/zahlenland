/* App-Shell-Cache: bei Änderungen VERSION erhöhen, damit Updates ankommen. */
const VERSION = 'zahlenfreunde-v1';
const APP_FILES = [
  './',
  './index.html',
  './css/styles.css',
  './js/config.js',
  './js/audio.js',
  './js/app.js',
  './manifest.webmanifest',
  './assets/favicon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(APP_FILES);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('zahlenfreunde-') && key !== VERSION).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Keine fremden Requests abfangen.

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      // Lokale neue Aufnahmen/Dateien nach dem ersten Abruf mitnehmen.
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(VERSION);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (_) {
      if (request.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      return Response.error();
    }
  })());
});
