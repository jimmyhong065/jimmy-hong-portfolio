import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminAnnouncementEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState({ title: '', content: '', active: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isNew) {
      supabase.from('announcements').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setForm(data)
      })
    }
  }, [id, isNew])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = { title: form.title, content: form.content, active: form.active }
    if (isNew) {
      await supabase.from('announcements').insert(payload)
    } else {
      await supabase.from('announcements').update(payload).eq('id', id)
    }
    navigate('/admin/announcements')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-bold mb-7">{isNew ? '新增公告' : '編輯公告'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">標題 *</label>
          <input name="title" value={form.title} onChange={handleChange} required
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">內容</label>
          <textarea name="content" value={form.content} onChange={handleChange} rows={4}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="active" checked={form.active} onChange={handleChange}
            className="rounded" />
          <span className="text-sm text-gray-600">上架顯示</span>
        </label>
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? '儲存中…' : '儲存'}
          </button>
          <button type="button" onClick={() => navigate('/admin/announcements')}
            className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
