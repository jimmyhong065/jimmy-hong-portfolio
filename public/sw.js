// public/sw.js
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  const { title = '新文章', body = '', slug = '' } = data
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/avatar.jpg',
      badge: '/favicon.svg',
      tag: slug,
      data: { slug },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
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
