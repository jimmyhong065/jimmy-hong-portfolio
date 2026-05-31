import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('services').select('*').order('type').order('display_order')
    if (data) setServices(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    if (!confirm('確定刪除？')) return
    await supabase.from('services').delete().eq('id', id)
    setServices(s => s.filter(x => x.id !== id))
  }

  const qa = services.filter(s => s.type === 'qa')
  const photo = services.filter(s => s.type === 'photo')

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-lg font-bold">合作方式管理</h1>
        <Link to="/admin/services/new"
          className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
          + 新增
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">載入中…</p>
      ) : (
        <>
          <Section title="QA 網站" items={qa} onDelete={handleDelete} />
          <Section title="攝影網站" items={photo} onDelete={handleDelete} />
        </>
      )}
    </div>
  )
}

function Section({ title, items, onDelete }) {
  return (
    <div className="mb-8">
      <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-gray-300 pl-1">尚無項目</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(s => (
            <div key={s.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                {s.description && <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>}
              </div>
              <div className="flex gap-3 ml-4 flex-shrink-0">
                <Link to={`/admin/services/${s.id}`} className="text-xs text-gray-500 hover:text-gray-900">編輯</Link>
                <button onClick={() => onDelete(s.id)} className="text-xs text-red-400 hover:text-red-600">刪除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
