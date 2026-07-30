const CACHE_PREFIX = "agroplano-demo-";
const SHELL_CACHE = `${CACHE_PREFIX}shell-v1.3.1`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-v1.3.1`;
const SHELL = [
  "./", "./index.html", "./i18n.js", "./demo-data.js", "./config.js", "./cloud-sync.js",
  "./manifest.webmanifest", "./assets/icon.svg", "./assets/icon-192.png",
  "./assets/icon-512.png", "./assets/plano-demo.svg", "./assets/plano-demo-en.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(CACHE_PREFIX) && ![SHELL_CACHE, RUNTIME_CACHE].includes(key)).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.hostname.endsWith(".supabase.co")) return;
  if (url.origin === self.location.origin) {
    const networkFirst = event.request.mode === "navigate" || ["/index.html", "/i18n.js", "/config.js", "/cloud-sync.js", "/demo-data.js"].some(path => url.pathname.endsWith(path));
    if (networkFirst) {
      event.respondWith(fetch(event.request).then(response => {
        if (response.ok) caches.open(SHELL_CACHE).then(cache => cache.put(event.request, response.clone()));
        return response;
      }).catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html"))));
      return;
    }
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match("./index.html"))));
    return;
  }
  if (url.hostname === "cdn.jsdelivr.net") {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, response.clone()));
      return response;
    })));
  }
});
