const CACHE_NAME = 'metro-one-pwa-v3'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/metro-icon.svg', '/metro-icon-maskable.svg']

function isSameOrigin(requestUrl) {
  return new URL(requestUrl).origin === self.location.origin
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !isSameOrigin(event.request.url)) {
    return
  }

  const requestUrl = new URL(event.request.url)

  if (requestUrl.pathname.startsWith('/api/')) {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const clone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone))
          return networkResponse
        })
        .catch(async () => (await caches.match('/index.html')) || caches.match('/')),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }

          return networkResponse
        })
        .catch(() => cachedResponse)

      return cachedResponse || networkFetch
    }),
  )
})
