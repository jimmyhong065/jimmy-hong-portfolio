import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const STATUS_LABEL = { unread: '未讀', read: '已讀', replied: '已回覆' }
const STATUS_COLOR = { unread: 'bg-red-100 text-red-600', read: 'bg-gray-100 text-gray-500', replied: 'bg-green-100 text-green-700' }

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  async function load() {
    const { data } = await supabase.from('faq_submissions').select('*').order('created_at', { ascending: false })
    setSubmissions(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function setStatus(id, status) {
    await supabase.from('faq_submissions').update({ status }).eq('id', id)
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  async function remove(id) {
    if (!confirm('確定刪除？')) return
    await supabase.from('faq_submissions').delete().eq('id', id)
    setSubmissions(prev => prev.filter(s => s.id !== id))
    if (expanded === id) setExpanded(null)
  }

  function toggle(id) {
    setExpanded(expanded === id ? null : id)
    const s = submissions.find(s => s.id === id)
    if (s?.status === 'unread') setStatus(id, 'read')
  }

  const unreadCount = submissions.filter(s => s.status === 'unread').length

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-7">
        <h1 className="text-lg font-bold">提問收件匣</h1>
        {unreadCount > 0 && (
          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{unreadCount} 則未讀</span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">載入中…</p>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-gray-400">尚無提問。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {submissions.map(s => (
            <div key={s.id} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => toggle(s.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                {s.status === 'unread' && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{s.name}</span>
                    <span className="text-xs text-gray-400">{s.email}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">[{s.category}] {s.message}</p>
                </div>
                <span className="text-xs text-gray-300 flex-shrink-0">
                  {new Date(s.created_at).toISOString().slice(0, 10)}
                </span>
              </button>

              {expanded === s.id && (
                <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                  <div className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-gray-400">姓名</span><p className="text-gray-900 mt-0.5">{s.name}</p></div>
                      <div><span className="text-gray-400">Email</span><p className="text-gray-900 mt-0.5">{s.email}</p></div>
                      <div><span className="text-gray-400">類別</span><p className="text-gray-900 mt-0.5">{s.category}</p></div>
                      {s.line_id && <div><span className="text-gray-400">LINE ID</span><p className="text-gray-900 mt-0.5">{s.line_id}</p></div>}
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">提問內容</span>
                      <p className="text-sm text-gray-800 mt-1 leading-relaxed whitespace-pre-line">{s.message}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <a href={`mailto:${s.email}?subject=Re: ${s.category}`}
                        onClick={() => setStatus(s.id, 'replied')}
                        className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-700">
                        回覆 Email
                      </a>
                      {s.status !== 'replied' && (
                        <button onClick={() => setStatus(s.id, 'replied')}
                          className="text-xs border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">
                          標記已回覆
                        </button>
                      )}
                      {s.status !== 'read' && s.status !== 'replied' && (
                        <button onClick={() => setStatus(s.id, 'read')}
                          className="text-xs border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">
                          標記已讀
                        </button>
                      )}
                      <button onClick={() => remove(s.id)}
                        className="text-xs text-red-400 hover:text-red-600 ml-auto">
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
