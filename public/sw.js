const CACHE_NAME = "wexls-cache-v1";
const OFFLINE_URL = "/";

// Assets to cache immediately on SW install
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/globals.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Exclude api calls, hot-reload / webpack endpoints, and dev server sockets
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.includes("webpack") ||
    url.hostname === "localhost" && url.port === "3000" && url.pathname.includes("hmr")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          // If offline and request is document/page navigation, show offline fallback page (the homepage)
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
          throw err;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
