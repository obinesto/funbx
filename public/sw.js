const STATIC_CACHE = "funbx-static-v1";
const RUNTIME_CACHE = "funbx-runtime-v1";
const RSC_CACHE = "funbx-rsc-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/favicon.ico",
  "/apple-icon.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

const PAGE_CACHE_URLS = [
  "/",
  "/auth",
  "/auth/reset-password",
  "/gaming",
  "/history",
  "/liked-videos",
  "/movies",
  "/music",
  "/saved-videos",
  "/settings",
  "/studio/upload",
  "/subscriptions",
  "/trending",
  "/your-videos",
];

async function cacheResponse(cacheName, request, response) {
  if (!response?.ok || response.redirected) {
    return;
  }

  const responseClone = response.clone();
  const cache = await caches.open(cacheName);
  await cache.put(request, responseClone);
}

async function warmPageCache() {
  const cache = await caches.open(RUNTIME_CACHE);

  await Promise.allSettled(
    PAGE_CACHE_URLS.map(async (url) => {
      const request = new Request(url, {
        credentials: "same-origin",
        redirect: "follow",
      });
      const response = await fetch(request);

      if (response.ok && !response.redirected) {
        await cache.put(request, response);
      }
    }),
  );
}

async function getCachedNavigationResponse(request, isNextRoutePayload) {
  if (isNextRoutePayload) {
    return (
      (await caches.match(request)) ||
      new Response(null, {
        status: 503,
        statusText: "Offline",
      })
    );
  }

  const url = new URL(request.url);
  const pathOnlyUrl = new URL(url.pathname, self.location.origin);

  const responses = await Promise.all([
    caches.match(request),
    caches.match(pathOnlyUrl.href),
    caches.match(OFFLINE_URL),
  ]);

  return responses.find(Boolean);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
      warmPageCache(),
    ]).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== STATIC_CACHE &&
                key !== RUNTIME_CACHE &&
                key !== RSC_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  const isNextRoutePayload =
    request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");

  if (request.mode === "navigate" || isNextRoutePayload) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          event.waitUntil(
            cacheResponse(
              isNextRoutePayload ? RSC_CACHE : RUNTIME_CACHE,
              request,
              response,
            ),
          );
          return response;
        })
        .catch(async () => {
          return getCachedNavigationResponse(request, isNextRoutePayload);
        }),
    );
    return;
  }

  if (
    url.pathname.startsWith("/api/youtube/") ||
    url.pathname.startsWith("/api/search") ||
    url.pathname.startsWith("/api/games")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          event.waitUntil(cacheResponse(RUNTIME_CACHE, request, response));
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            new Response(JSON.stringify({ error: "Offline" }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            })
          );
        }),
    );
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (
    ["style", "script", "worker", "image", "font", "manifest"].includes(
      request.destination,
    ) ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          event.waitUntil(cacheResponse(RUNTIME_CACHE, request, response));
          return response;
        });
      }),
    );
  }
});

self.addEventListener("push", (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || "FunBx";
  const options = {
    body: payload.body || "You have a new notification.",
    icon: payload.icon || "/web-app-manifest-192x192.png",
    badge: payload.badge || "/web-app-manifest-192x192.png",
    tag: payload.tag || "funbx-notification",
    data: {
      url: payload.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "/",
    self.location.origin,
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
