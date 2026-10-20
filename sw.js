// Offline support: the whole game is cached on the first visit.
// Stale-while-revalidate: answers from the cache at once and refreshes it in the background,
// so a new release reaches players on their next launch.
// Bump VERSION with every release; tests/sw.test.js checks that SHELL lists every file the game needs.
// Both the install and the refresh bypass the HTTP cache (GitHub Pages sends max-age=600),
// otherwise a new release could be cached from stale or mixed files.
const VERSION = 3;
const CACHE = `ugaday-v${VERSION}`;
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/fonts.css',
  './css/game.css',
  './js/art.js',
  './js/cards.js',
  './js/config.js',
  './js/game.js',
  './js/icons.js',
  './js/input.js',
  './js/main.js',
  './js/render.js',
  './js/sound.js',
  './js/storage.js',
  './fonts/caveat-cyrillic.woff2',
  './fonts/caveat-latin.woff2',
  './fonts/nunito-cyrillic.woff2',
  './fonts/nunito-latin.woff2',
  './fonts/unbounded-cyrillic.woff2',
  './fonts/unbounded-latin.woff2',
  './icons/favicon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(SHELL.map(url => new Request(url, {cache: 'reload'}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('ugaday-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(req, {ignoreSearch: true});
    // a navigation request cannot be copied with options, so it is rebuilt from its URL
    const fresh = fetch(req.mode === 'navigate' ? new Request(req.url, {cache: 'no-cache'}) : new Request(req, {cache: 'no-cache'})).then(res => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    });
    if (cached){
      event.waitUntil(fresh.catch(() => {}));
      return cached;
    }
    return fresh;
  }));
});
