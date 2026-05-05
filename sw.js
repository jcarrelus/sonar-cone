const CACHE_NAME = "sonar-cone-cache-v3";
const ASSETS = [
  "/sonar-cone/index.html",
  "/sonar-cone/styles-v3.css",
  "/sonar-cone/app.js",
  "/sonar-cone/manifest.json",
  "/sonar-cone/icons/icon-192.png",
  "/sonar-cone/icons/icon-512.png"
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activate: delete old caches
self.addEventListener("activate", (event) => {
  clients.claim();
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

// Fetch: NETWORK FIRST for HTML/CSS/JS
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Always try network first for HTML/CSS/JS
  if (url.endsWith(".html") || url.endsWith(".css") || url.endsWith(".js")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with fresh version
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For everything else: cache-first fallback
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
