export const registerAuroraServiceWorker = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || '/'
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => undefined)
  }, { once: true })
}
