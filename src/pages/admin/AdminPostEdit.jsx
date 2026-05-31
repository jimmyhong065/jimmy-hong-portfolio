import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import RichTextEditor from '../../components/RichTextEditor'
import MarkdownEditorPane from '../../components/MarkdownEditorPane'

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function wordCount(html) {
  const text = html?.replace(/<[^>]+>/g, '') ?? ''
  return text.replace(/\s/g, '').length
}

function SaveStatus({ status }) {
  if (!status || status === 'idle') return null
  if (status === 'pending') return <span className="text-xs text-gray-400">• 未儲存</span>
  if (status === 'saving') return <span className="text-xs text-gray-400">儲存中…</span>
  if (status === 'error') return <span className="text-xs text-red-400">自動儲存失敗</span>
  if (status.startsWith('saved:')) return <span className="text-xs text-gray-400">已儲存 {status.slice(6)}</span>
  return null
}

export default function AdminPostEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState({
    title: '', slug: '', content: '', excerpt: '',
    tags: '', published: false, published_at: null,
  })
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [slugError, setSlugError] = useState('')
  const [currentId, setCurrentId] = useState(isNew ? null : id)
  const [editorMode, setEditorMode] = useState(() => {
    const saved = localStorage.getItem(`editor-mode-${id}`)
    return saved || 'wysiwyg'
  })
  const autoSaveRef = useRef()
  const formRef = useRef(form)
  formRef.current = form

  useEffect(() => {
    if (!isNew) {
      supabase.from('posts').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setForm({ ...data, tags: (data.tags ?? []).join(', ') })
      })
    }
  }, [id, isNew])

  const doSave = useCallback(async (explicitId) => {
    const f = formRef.current
    const targetId = explicitId ?? currentId
    if (!targetId) return
    const payload = {
      title: f.title,
      slug: f.slug,
      excerpt: f.excerpt,
      content: f.content,
      tags: f.tags.split(',').map(t => t.trim()).filter(Boolean),
    }
    setSaveStatus('saving')
    const { error } = await supabase.from('posts').update(payload).eq('id', targetId)
    if (error) {
      setSaveStatus('error')
    } else {
      const now = new Date()
      setSaveStatus(`saved:${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`)
    }
  }, [currentId])

  // Auto-save 5s debounce
  useEffect(() => {
    if (!currentId) return
    setSaveStatus('pending')
    clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => doSave(), 5000)
    return () => clearTimeout(autoSaveRef.current)
  }, [form, currentId, doSave])

  // Ctrl+S
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        clearTimeout(autoSaveRef.current)
        doSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [doSave])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => {
      const updated = { ...f, [name]: type === 'checkbox' ? checked : value }
      if (name === 'title' && isNew) updated.slug = slugify(value)
      return updated
    })
    if (name === 'slug') setSlugError('')
  }

  async function switchMode(newMode) {
    if (newMode === editorMode) return
    if (form.content?.trim()) {
      try {
        if (newMode === 'markdown' && form.content.trimStart().startsWith('<')) {
          const { default: TurndownService } = await import('turndown')
          const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
          const md = td.turndown(form.content)
          setForm(f => ({ ...f, content: md }))
        } else if (newMode === 'wysiwyg' && !form.content.trimStart().startsWith('<')) {
          const { marked } = await import('marked')
          const html = await marked(form.content)
          setForm(f => ({ ...f, content: html }))
        }
      } catch {
        // conversion failed, just switch mode without converting
      }
    }
    setEditorMode(newMode)
    localStorage.setItem(`editor-mode-${currentId ?? 'new'}`, newMode)
  }

  async function checkSlug(slug, skipId) {
    const { data } = await supabase.from('posts').select('id').eq('slug', slug)
    const conflict = (data ?? []).filter(p => p.id !== skipId)
    return conflict.length > 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSlugError('')

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const payload = {
      ...form,
      tags,
      published_at: form.published ? (form.published_at || new Date().toISOString()) : null,
    }

    if (isNew) {
      const conflict = await checkSlug(form.slug, null)
      if (conflict) {
        setSlugError('此 slug 已被使用，請修改')
        setSaving(false)
        return
      }
      const { data, error } = await supabase.from('posts').insert(payload).select('id').single()
      if (error) { setSaving(false); return }
      setCurrentId(data.id)
      navigate(`/admin/posts/${data.id}`, { replace: true })
    } else {
      const conflict = await checkSlug(form.slug, currentId)
      if (conflict) {
        setSlugError('此 slug 已被使用，請修改')
        setSaving(false)
        return
      }
      await supabase.from('posts').update(payload).eq('id', currentId)
      setSaveStatus(`saved:${new Date().getHours().toString().padStart(2,'0')}:${new Date().getMinutes().toString().padStart(2,'0')}`)
    }
    setSaving(false)
  }

  const wc = wordCount(form.content)

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-lg font-bold">{isNew ? '新增文章' : '編輯文章'}</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-300">{wc} 字</span>
          <SaveStatus status={saveStatus} />
        </div>
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
            className={`w-full text-sm border rounded-lg px-4 py-2.5 focus:outline-none ${slugError ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'}`} />
          {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
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
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-500">內容</label>
            <div className="flex gap-1">
              <button type="button" onClick={() => switchMode('wysiwyg')}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${editorMode === 'wysiwyg' ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                視覺編輯
              </button>
              <button type="button" onClick={() => switchMode('markdown')}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${editorMode === 'markdown' ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                Markdown
              </button>
            </div>
          </div>
          {editorMode === 'wysiwyg' ? (
            <RichTextEditor
              value={form.content}
              onChange={html => setForm(f => ({ ...f, content: html }))}
            />
          ) : (
            <MarkdownEditorPane
              value={form.content}
              onChange={md => setForm(f => ({ ...f, content: md }))}
            />
          )}
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" name="published" checked={form.published} onChange={handleChange} />
            發布
          </label>
          {form.published && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">發布日期</label>
              <input
                type="date"
                name="published_at"
                value={form.published_at ? form.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                onChange={e => setForm(f => ({ ...f, published_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                className="text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400"
              />
            </div>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <button type="submit" disabled={saving}
            className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? '儲存中…' : isNew ? '建立文章' : '儲存'}
          </button>
          {currentId && (
            <button type="button"
              onClick={() => { clearTimeout(autoSaveRef.current); doSave() }}
              className="text-sm border border-gray-200 px-4 py-2.5 rounded-lg hover:border-gray-400 text-gray-500">
              ⌘S 立即儲存
            </button>
          )}
          {currentId && (
            <button type="button"
              onClick={() => window.open(`/blog/${form.slug}?preview=1`, '_blank')}
              className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400">
              預覽 ↗
            </button>
          )}
          <button type="button" onClick={() => navigate('/admin/posts')}
            className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400">
            離開
          </button>
        </div>
        {currentId && (
          <p className="text-xs text-gray-300">Ctrl/⌘ + S 快速儲存</p>
        )}
      </form>
    </div>
  )
}
