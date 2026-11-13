// Service worker: guarda o jogo no aparelho para abrir rápido e jogar sem internet.
const CACHE = 'race-cities-v11';
const THREE = 'https://cdn.jsdelivr.net/npm/three@0.160.0/';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-192.png', 'icons/maskable-512.png',
  'icons/apple-touch-icon.png', 'icons/favicon-32.png',
  'js/main.js', 'js/race.js', 'js/kart.js', 'js/track.js', 'js/tracks.js', 'js/items.js',
  'js/obstacles.js', 'js/ai.js', 'js/characters.js', 'js/effects.js', 'js/audio.js',
  'js/hud.js', 'js/input.js', 'js/touch.js', 'js/textures.js', 'js/utils.js',
  'js/net.js', 'js/netrace.js', 'js/online.js', 'js/pigeons.js', 'js/trackgen.js', 'js/ads.js', 'js/ads-config.js', 'css/ads.css',
  'js/cities/kits.js', 'js/cities/build.js', 'js/cities/common.js', 'js/cities/landmarks.js', 'js/cities/osasco.js',
  'js/cities/lm-west.js', 'js/cities/lm-east.js', 'js/cities/props.js', 'js/cities/vehicles.js',
  THREE + 'build/three.module.js',
  THREE + 'examples/jsm/geometries/RoundedBoxGeometry.js',
  THREE + 'examples/jsm/utils/BufferGeometryUtils.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Arquivos do jogo: usa a rede quando há internet (pega atualizações) e o cache quando não há.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // anúncios e outros domínios passam direto para a rede: só guardamos o jogo e as bibliotecas dele
  const u = new URL(req.url);
  if (u.origin !== location.origin && !req.url.startsWith(THREE) && !/(^|\.)(jsdelivr\.net|googleapis\.com|gstatic\.com)$/.test(u.hostname)) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
