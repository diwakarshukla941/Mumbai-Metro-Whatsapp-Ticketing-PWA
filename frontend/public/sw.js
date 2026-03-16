const CACHE_NAME = 'metro-one-pwa-v2'
const APP_SHELL = [
  '/manifest.webmanifest',
  '/metro-icon.svg',
  '/metro-icon-maskable.svg',
]

function isSameOrigin(requestUrl) {
  return new URL(requestUrl).origin === self.location.origin
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
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
  const isNavigationRequest = event.request.mode === 'navigate'
  const isApiRequest = requestUrl.pathname.startsWith('/api/')

  if (isApiRequest) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse
        }

        const responseClone = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
        return networkResponse
      })
      .catch(() => {
        if (isNavigationRequest) {
          return caches.match('/')
        }

        return caches.match(event.request)
      })
      .then((response) => {
        if (response) {
          return response
        }

        return caches.match(event.request)
      })
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse
          }

          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
          return networkResponse
        })
      }),
  )
})
