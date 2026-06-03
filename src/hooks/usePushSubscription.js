// src/hooks/usePushSubscription.js
import { useState, useEffect } from 'react'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

export function usePushSubscription() {
  const [state, setState] = useState('loading')
  const [swReg, setSwReg] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    navigator.serviceWorker.register('/sw.js').then(async reg => {
      setSwReg(reg)
      if (Notification.permission === 'denied') {
        setState('denied')
        return
      }
      const existing = await reg.pushManager.getSubscription()
      setState(existing ? 'subscribed' : 'unsubscribed')
    }).catch(() => setState('unsupported'))
  }, [])

  async function subscribe() {
    if (!swReg) return
    setError(null)
    try {
      const sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const j = sub.toJSON()
      const res = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys }),
      })
      if (!res.ok) throw new Error('Server error')
      setState('subscribed')
    } catch (e) {
      if (Notification.permission === 'denied') {
        setState('denied')
      } else {
        setError(e.message === 'Server error' ? '訂閱失敗，請稍後再試' : 'iOS 需先將網站加入主畫面')
      }
    }
  }

  async function unsubscribe() {
    if (!swReg) return
    setError(null)
    try {
      const sub = await swReg.pushManager.getSubscription()
      if (!sub) { setState('unsubscribed'); return }
      await fetch('/api/push-subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
      setState('unsubscribed')
    } catch {
      setError('取消訂閱失敗')
    }
  }

  return { state, error, subscribe, unsubscribe }
}
