const NAME = 'odrinetra-v1';
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(caches.open(NAME).then(async cache => {
    const hit = await cache.match(e.request);
    const net = fetch(e.request).then(r => { cache.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
