import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminFAQs() {
  const [faqs, setFAQs] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('faqs').select('*').order('category').order('display_order')
    setFAQs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function togglePublished(faq) {
    await supabase.from('faqs').update({ published: !faq.published }).eq('id', faq.id)
    setFAQs(prev => prev.map(f => f.id === faq.id ? { ...f, published: !f.published } : f))
  }

  async function remove(id) {
    if (!confirm('確定刪除？')) return
    await supabase.from('faqs').delete().eq('id', id)
    setFAQs(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-lg font-bold">FAQ 管理</h1>
        <Link to="/admin/faqs/new"
          className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
          + 新增 FAQ
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">載入中…</p>
      ) : faqs.length === 0 ? (
        <p className="text-sm text-gray-400">尚無 FAQ，點右上角新增。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {faqs.map(faq => (
            <div key={faq.id} className="flex items-start gap-3 border border-gray-100 rounded-xl px-4 py-3 bg-white">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">{faq.category}</p>
                <p className="text-sm font-medium text-gray-900 truncate">{faq.question}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => togglePublished(faq)}
                  className={`text-xs px-2.5 py-1 rounded-full ${faq.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {faq.published ? '上架' : '下架'}
                </button>
                <Link to={`/admin/faqs/${faq.id}`} className="text-xs text-gray-500 hover:text-gray-900">編輯</Link>
                <button onClick={() => remove(faq.id)} className="text-xs text-red-400 hover:text-red-600">刪除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
