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
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const target = self.location.origin + '/blog/' + event.notification.data.slug
      const existing = list.find(c => c.url.includes('/blog/' + event.notification.data.slug))
      if (existing) return existing.focus()
      return clients.openWindow(target)
    })
  )
})
