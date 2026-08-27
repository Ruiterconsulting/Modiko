const CACHE = 'modiko-v9';

const MANIFEST = JSON.stringify({
  name: 'Modiko',
  short_name: 'Modiko',
  description: 'Planning & Registratie',
  start_url: '/Modiko/',
  display: 'standalone',
  orientation: 'portrait-primary',
  background_color: '#8B20AC',
  theme_color: '#8B20AC',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
  ]
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/Modiko/', '/Modiko/icon-192.png', '/Modiko/icon-512.png']))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Serve manifest inline
  if (url.pathname === '/Modiko/manifest.json') {
    e.respondWith(new Response(MANIFEST, {
      headers: { 'Content-Type': 'application/manifest+json' }
    }));
    return;
  }

  // Firebase: always network
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // App shell: cache-first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok && e.request.method === 'GET') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
