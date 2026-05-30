import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import RichTextEditor from '../../components/RichTextEditor'

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function SaveStatus({ status }) {
  if (!status || status === 'idle') return null
  if (status === 'pending') return <span className="text-xs text-gray-400">• 未儲存變更</span>
  if (status === 'saving') return <span className="text-xs text-gray-400">儲存中…</span>
  if (status === 'error') return <span className="text-xs text-red-400">自動儲存失敗</span>
  if (status.startsWith('saved:')) return <span className="text-xs text-gray-400">已自動儲存 {status.slice(6)}</span>
  return null
}

export default function AdminPostEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState({
    title: '', slug: '', content: '', excerpt: '',
    tags: '', published: false,
  })
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle')
  const autoSaveRef = useRef()

  useEffect(() => {
    if (!isNew) {
      supabase.from('posts').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setForm({ ...data, tags: (data.tags ?? []).join(', ') })
      })
    }
  }, [id, isNew])

  // Auto-save: 30s debounce, existing posts only
  useEffect(() => {
    if (isNew) return
    setSaveStatus('pending')
    clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(async () => {
      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      }
      setSaveStatus('saving')
      const { error } = await supabase.from('posts').update(payload).eq('id', id)
      if (error) {
        setSaveStatus('error')
      } else {
        const now = new Date()
        const hh = now.getHours().toString().padStart(2, '0')
        const mm = now.getMinutes().toString().padStart(2, '0')
        setSaveStatus(`saved:${hh}:${mm}`)
      }
    }, 30000)
    return () => clearTimeout(autoSaveRef.current)
  }, [form, id, isNew])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => {
      const updated = { ...f, [name]: type === 'checkbox' ? checked : value }
      if (name === 'title' && isNew) updated.slug = slugify(value)
      return updated
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      published_at: form.published ? (form.published_at || new Date().toISOString()) : null,
    }
    if (isNew) {
      await supabase.from('posts').insert(payload)
    } else {
      await supabase.from('posts').update(payload).eq('id', id)
    }
    navigate('/admin/posts')
  }

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-lg font-bold">{isNew ? '新增文章' : '編輯文章'}</h1>
        <SaveStatus status={saveStatus} />
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">標題</label>
          <input aria-label="標題" name="title" value={form.title} onChange={handleChange} required
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Slug（URL）</label>
          <input name="slug" value={form.slug} onChange={handleChange} required
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">摘要</label>
          <input name="excerpt" value={form.excerpt} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">標籤（逗號分隔，如：測試策略, CI/CD）</label>
          <input name="tags" value={form.tags} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">內容</label>
          <RichTextEditor
            value={form.content}
            onChange={html => setForm(f => ({ ...f, content: html }))}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="published" checked={form.published} onChange={handleChange} />
          發布
        </label>
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? '儲存中…' : '儲存'}
          </button>
          {!isNew && (
            <button type="button"
              onClick={() => window.open(`/blog/${form.slug}`, '_blank')}
              className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400">
              預覽
            </button>
          )}
          <button type="button" onClick={() => navigate('/admin/posts')}
            className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
