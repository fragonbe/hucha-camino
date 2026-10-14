const V = 'hucha-v15';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // Páginas y recursos propios: red primero (para recibir actualizaciones), caché si no hay conexión.
  if (u.origin === location.origin) {
    e.respondWith(
      fetch(r).then(res => {
        if (res.ok) { const c = res.clone(); caches.open(V).then(ch => ch.put(r, c)); }
        return res;
      }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('index.html')))
    );
    return;
  }
  // Tipografías de Google: caché primero, se rellena la primera vez que hay conexión.
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(r).then(m => m || fetch(r).then(res => {
        const c = res.clone(); caches.open(V).then(ch => ch.put(r, c)); return res;
      }))
    );
  }
});
