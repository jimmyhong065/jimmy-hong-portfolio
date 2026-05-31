import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminServiceEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState({ type: 'qa', title: '', description: '', display_order: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isNew) {
      supabase.from('services').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setForm(data)
      })
    }
  }, [id, isNew])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      type: form.type,
      title: form.title,
      description: form.description,
      display_order: Number(form.display_order),
    }
    if (isNew) {
      await supabase.from('services').insert(payload)
    } else {
      await supabase.from('services').update(payload).eq('id', id)
    }
    navigate('/admin/services')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-bold mb-7">{isNew ? '新增合作方式' : '編輯合作方式'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">網站</label>
          <select name="type" value={form.type} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400 bg-white">
            <option value="qa">QA 網站</option>
            <option value="photo">攝影網站</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">標題</label>
          <input name="title" value={form.title} onChange={handleChange} required
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">說明</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">排序（數字越小越前面）</label>
          <input name="display_order" type="number" value={form.display_order} onChange={handleChange}
            className="w-32 text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? '儲存中…' : '儲存'}
          </button>
          <button type="button" onClick={() => navigate('/admin/services')}
            className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
