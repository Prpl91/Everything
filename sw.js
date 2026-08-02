const C = "ciclo-v5";
const CORE = ["./","./index.html","./eat.html","./move.html","./bloom.html",
   "./eat.webmanifest","./move.webmanifest","./bloom.webmanifest",
   "./icon-192.png","./icon-512.png","./logo.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(CORE)));
  self.skipWaiting(); // don't wait for old tabs to close — take over immediately
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim()) // take control of already-open pages right now
  );
});

self.addEventListener("fetch", e => {
  const isPage = e.request.mode === "navigate" || e.request.destination === "" || e.request.headers.get("accept")?.includes("text/html");
  if (isPage) {
    // network-first for pages: always try to get the latest HTML; fall back to cache only if offline
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(C).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
    );
  } else {
    // cache-first for static assets (icons/logo) — they rarely change, so speed wins
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(C).then(c => c.put(e.request, clone));
        return res;
      }))
    );
  }
});
