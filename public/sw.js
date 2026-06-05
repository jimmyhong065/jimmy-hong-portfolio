const CACHE = 'qa-lab-v1'
const PRECACHE = ['/', '/pwa-icon.png', '/favicon.svg', '/favicon-camera.svg']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (!request.url.startsWith(self.location.origin)) return
  if (request.method !== 'GET') return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    )
    return
  }

  event.respondWith(
    caches.match(request).then(cached =>
      cached ?? fetch(request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(request, res.clone()))
        return res
      })
    )
  )
})

self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  const { title = '新文章', body = '', slug = '' } = data
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body,
        icon: '/pwa-icon.png',
        badge: '/favicon.svg',
        tag: slug,
        data: { slug },
      }),
      navigator?.setAppBadge?.(1).catch(() => {}),
    ])
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  navigator?.clearAppBadge?.().catch(() => {})
  const slug = event.notification.data?.slug ?? ''
  const path = '/blog/' + slug
  const target = self.location.origin + path

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) {
        list[0].postMessage({ type: 'push-navigate', url: path })
        return list[0].focus()
      }
      return clients.openWindow(target)
    })
  )
})
