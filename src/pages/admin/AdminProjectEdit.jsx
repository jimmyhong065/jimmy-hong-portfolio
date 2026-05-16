import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminProjectEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState({
    title: '', description: '', content: '',
    tags: '', cover_url: '',
    github: '', demo: '',
    display_order: 0,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isNew) {
      supabase.from('projects').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setForm({
          ...data,
          tags: (data.tags ?? []).join(', '),
          github: data.links?.github ?? '',
          demo: data.links?.demo ?? '',
        })
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
      title: form.title,
      description: form.description,
      content: form.content,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      cover_url: form.cover_url || null,
      links: { github: form.github || null, demo: form.demo || null },
      display_order: Number(form.display_order),
    }
    if (isNew) {
      await supabase.from('projects').insert(payload)
    } else {
      await supabase.from('projects').update(payload).eq('id', id)
    }
    navigate('/admin/projects')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold mb-7">{isNew ? '新增作品' : '編輯作品'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">標題</label>
          <input name="title" value={form.title} onChange={handleChange} required
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">描述（簡短說明）</label>
          <input name="description" value={form.description} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">標籤（逗號分隔）</label>
          <input name="tags" value={form.tags} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">封面圖片 URL</label>
          <input name="cover_url" value={form.cover_url} onChange={handleChange}
            placeholder="https://..."
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">GitHub URL</label>
            <input name="github" value={form.github} onChange={handleChange}
              placeholder="https://github.com/..."
              className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Demo URL</label>
            <input name="demo" value={form.demo} onChange={handleChange}
              placeholder="https://..."
              className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">內容（Markdown）</label>
          <textarea name="content" value={form.content} onChange={handleChange} rows={14}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400 font-mono" />
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
          <button type="button" onClick={() => navigate('/admin/projects')}
            className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
