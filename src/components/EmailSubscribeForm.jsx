import { useState } from 'react'

export default function EmailSubscribeForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | already | error

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/email-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error()
      setStatus(data.status === 'already_confirmed' ? 'already' : 'sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">訂閱通知</p>
      <p className="text-sm text-gray-500 mb-4">有新文章時收到 Email 通知</p>

      {status === 'sent' && (
        <p className="text-sm text-gray-600">確認信已寄出，請至信箱點擊確認連結完成訂閱。</p>
      )}
      {status === 'already' && (
        <p className="text-sm text-gray-600">此 Email 已訂閱。</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-500">訂閱失敗，請稍後再試。</p>
      )}

      {(status === 'idle' || status === 'error') && (
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 whitespace-nowrap"
          >
            {status === 'sending' ? '送出中…' : '訂閱'}
          </button>
        </form>
      )}
    </div>
  )
}
