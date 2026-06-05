import { useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(0, mins)} 分鐘前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小時前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return `${Math.floor(days / 30)} 個月前`
}

export default function Notifications() {
  const { notifications, loading, markAllRead } = useNotifications()

  useEffect(() => {
    markAllRead()
  }, [markAllRead])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
      <h1 className="text-lg font-bold mb-6">通知</h1>
      {loading ? (
        <p className="text-sm text-gray-400">載入中…</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-gray-400">還沒有通知</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {notifications.map(n => (
            <a
              key={n.id}
              href={n.url}
              className="py-4 block hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
            >
              <p className="text-sm font-medium text-gray-900 mb-1">{n.title}</p>
              <p className="text-xs text-gray-500 line-clamp-2 mb-1">{n.body}</p>
              <p className="text-xs text-gray-400">{relativeTime(n.sent_at)}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
