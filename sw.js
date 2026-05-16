// sw.js — Real Cloud Share + QR Activation Integration
const CACHE_NAME = 'immm-cache-v15-2026-05-16-rc2.4-precompiled-runtime';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './dist/app.js',
  './dist/filters.js',
  './dist/webgl-engine.js',
  './dist/mediapipe-face.js',
  './dist/sticker-engine.js',
  './dist/session-model.js',
  './dist/session-adapter.js',
  './dist/result-asset-store.js',
  './dist/session-runtime-snapshot.js',
  './dist/cloud-share-adapter.js',
  './dist/share-contract.js',
  './dist/motion-export-contract.js',
  './dist/edit-recipe-contract.js',
  './dist/pwa-release-contract.js',
  './dist/frame-system.js',
  './dist/screens-v2.js',
  './dist/screens-v2-rest.js',
  './dist/screens-v2-deco.js',
  './dist/main.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('immm-cache-') && k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isCode =
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname.endsWith('.js');

  if (isCode) {
    // NETWORK-FIRST strategy for code files to prevent stale ReferenceErrors
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
