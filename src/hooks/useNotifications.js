import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'qa_read_notifs'

function getReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')) }
  catch { return new Set() }
}

function saveReadIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState(() => getReadIds())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from('notifications')
      .select('id, title, body, url, sent_at')
      .order('sent_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) console.error('[useNotifications]', error)
        setNotifications(data ?? [])
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const markAllRead = useCallback(() => {
    const allIds = new Set(notifications.map(n => n.id))
    saveReadIds(allIds)
    setReadIds(allIds)
  }, [notifications])

  return { notifications, unreadCount, loading, markAllRead }
}
