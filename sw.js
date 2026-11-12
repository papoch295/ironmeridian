// Service worker: makes the web version start offline and keeps updates clean.
// Network first: online every file is revalidated (cheap 304 on GitHub Pages), so a new push is live on the next start.
// Offline the cached copy is used. Bump CACHE when files are added, renamed or removed.
'use strict';

// The Beta 2 preview (…/beta2/) has its own cache family, so the two service workers never delete each other's cache.
const CH = /\/beta2\//.test(location.pathname) ? 'beta2-' : '';
const CACHE = 'ironmeridian-' + CH + 'v15';
const FAMILY = new RegExp('^ironmeridian-' + CH + 'v\\d+$');
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'assets/icon.svg', 'css/style.css',
  'js/data/world.js', 'js/data/scenario.js', 'js/data/units.js',
  'js/core/util.js', 'js/i18n.js', 'js/core/geo.js', 'js/core/path.js', 'js/core/game.js', 'js/core/sim.js',
  'js/core/tactics.js', 'js/core/ai.js', 'js/core/events.js',
  'js/render/symbols.js', 'js/render/models.js', 'js/render/models-land.js', 'js/render/models-east-land.js',
  'js/render/models-air.js', 'js/render/models-sea.js', 'js/render/models-beta2.js', 'js/render/renderer.js',
  'js/audio.js', 'js/save.js', 'js/ui/icons.js', 'js/ui/ui.js', 'js/ui/panels.js', 'js/ui/screens.js',
  'js/ui/input.js', 'js/ui/perf.js', 'js/crash.js', 'js/main.js',
];

self.addEventListener('install', (e) => {
  // 'no-cache' skips the browser's HTTP cache so a fresh install never stores outdated files.
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'no-cache' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => FAMILY.test(k) && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req, { cache: 'no-cache' }).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true })
    .then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
