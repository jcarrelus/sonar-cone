const CACHE_NAME = "sonar-cone-cache-v1";
const ASSETS = [
  "/sonar-cone/index.html",
  "/sonar-cone/styles.css",
  "/sonar-cone/app.js",
  "/sonar-cone/manifest.json",
  "/sonar-cone/icons/icon-192.png",
  "/sonar-cone/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  clients.claim();
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() =>
          caches.match("/sonar-cone/index.html")
        )
      );
    })
  );
});

