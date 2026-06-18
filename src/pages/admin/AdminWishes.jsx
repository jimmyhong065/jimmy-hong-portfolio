import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const STATUS_LABEL = { pending: '待審', featured: '已精選', archived: '已封存' }
const STATUS_COLOR = {
  pending: 'bg-amber-100 text-amber-700',
  featured: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
}
const FILTERS = [
  { key: 'pending', label: '待審' },
  { key: 'featured', label: '已精選' },
  { key: 'archived', label: '已封存' },
  { key: 'all', label: '全部' },
]

export default function AdminWishes() {
  const [wishes, setWishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  async function load() {
    const { data } = await supabase
      .from('article_wishes')
      .select('*')
      .order('created_at', { ascending: false })
    setWishes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function setStatus(id, status) {
    await supabase.from('article_wishes').update({ status }).eq('id', id)
    setWishes(prev => prev.map(w => w.id === id ? { ...w, status } : w))
  }

  async function remove(id) {
    if (!confirm('確定刪除這個願望？')) return
    await supabase.from('article_wishes').delete().eq('id', id)
    setWishes(prev => prev.filter(w => w.id !== id))
  }

  const pendingCount = wishes.filter(w => w.status === 'pending').length
  const shown = filter === 'all' ? wishes : wishes.filter(w => w.status === filter)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-5">
        <h1 className="text-lg font-bold">許願池</h1>
        {pendingCount > 0 && (
          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">{pendingCount} 則待審</span>
        )}
      </div>

      <div className="flex gap-1.5 mb-6">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-md border ${filter === f.key ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">載入中…</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-gray-400">沒有願望。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map(w => (
            <div key={w.id} className="border border-gray-100 rounded-xl p-4 bg-white">
              <div className="flex items-start gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[w.status]}`}>
                  {STATUS_LABEL[w.status] ?? w.status}
                </span>
                {w.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100 flex-shrink-0">
                    {w.category}
                  </span>
                )}
                <span className="text-xs text-gray-300 ml-auto flex-shrink-0">
                  {new Date(w.created_at).toISOString().slice(0, 10)}
                </span>
              </div>

              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-2">{w.content}</p>

              <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                <span>— {w.nickname || '匿名'}</span>
                {w.email && <a href={`mailto:${w.email}`} className="text-gray-500 hover:text-gray-700">{w.email}</a>}
              </div>

              <div className="flex items-center gap-2">
                {w.status !== 'featured' && (
                  <button onClick={() => setStatus(w.id, 'featured')}
                    className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-700">
                    設為精選
                  </button>
                )}
                {w.status === 'featured' && (
                  <button onClick={() => setStatus(w.id, 'pending')}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">
                    取消精選
                  </button>
                )}
                {w.status !== 'archived' && (
                  <button onClick={() => setStatus(w.id, 'archived')}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">
                    封存
                  </button>
                )}
                <button onClick={() => remove(w.id)}
                  className="text-xs text-red-400 hover:text-red-600 ml-auto">
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
