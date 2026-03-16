export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      let refreshing = false

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })

      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => registration.update())
        .catch(() => {})
    })
  }
}
