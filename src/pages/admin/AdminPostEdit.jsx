import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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

function plainText(content) {
  return (content ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/```[^\n`]*\n([\s\S]*?)```/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*[-+*]\s+/gm, ' ')
    .replace(/^\s*\d+\.\s+/gm, ' ')
    .replace(/[`*_~>#[\]()!|:-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseTags(tags) {
  if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(Boolean)
  return (tags ?? '').split(',').map(t => t.trim()).filter(Boolean)
}

function draftSlugFallback(currentId) {
  return `draft-${currentId ?? Date.now()}`
}

function payloadSlug(form, currentId) {
  const slug = form.slug?.trim() ?? ''
  if (slug) return slug
  return form.published ? slug : draftSlugFallback(currentId)
}

function buildPublishChecks(form) {
  const tags = parseTags(form.tags)
  return [
    { key: 'title', label: '標題', passed: Boolean(form.title?.trim()) },
    { key: 'slug', label: 'Slug', passed: Boolean(form.slug?.trim()) },
    { key: 'excerpt', label: '摘要', passed: Boolean(form.excerpt?.trim()) },
    { key: 'content', label: '內容', passed: Boolean(plainText(form.content)) },
    { key: 'tags', label: '至少一個標籤', passed: tags.length > 0 },
  ]
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
  const [pushResult, setPushResult] = useState(null)
  const [emailResult, setEmailResult] = useState(null)
  const [slugError, setSlugError] = useState('')
  const [publishCheckError, setPublishCheckError] = useState('')
  const [currentId, setCurrentId] = useState(isNew ? null : id)
  const [editorMode, setEditorMode] = useState(() => {
    const saved = localStorage.getItem(`editor-mode-${id}`)
    return saved || 'wysiwyg'
  })
  const [showModeToggle, setShowModeToggle] = useState(false)
  const autoSaveRef = useRef()
  const formRef = useRef(form)
  formRef.current = form
  const emailSendingRef = useRef(false)
  const pushSendingRef = useRef(false)
  const hasUnsavedRef = useRef(false)

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
      slug: payloadSlug(f, targetId),
      excerpt: f.excerpt,
      content: f.content,
      tags: parseTags(f.tags),
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

  // Track unsaved state for beforeunload
  useEffect(() => {
    hasUnsavedRef.current =
      saveStatus === 'pending' || saveStatus === 'saving' || saveStatus === 'error' ||
      (isNew && !!(form.title || form.content))
  }, [saveStatus, isNew, form.title, form.content])

  useEffect(() => {
    function onBeforeUnload(e) {
      if (hasUnsavedRef.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

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
    if (publishCheckError) setPublishCheckError('')
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
    setPublishCheckError('')

    const currentPublishChecks = buildPublishChecks(form)
    if (form.published && currentPublishChecks.some(check => !check.passed)) {
      setPublishCheckError('請先完成發布檢查')
      setSaving(false)
      return
    }

    const tags = parseTags(form.tags)
    const slug = payloadSlug(form, currentId)
    const payload = {
      ...form,
      slug,
      tags,
      published_at: form.published ? (form.published_at || new Date().toISOString()) : null,
    }

    if (isNew) {
      const conflict = await checkSlug(slug, null)
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
      const conflict = await checkSlug(slug, currentId)
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

  async function sendEmailNotification() {
    if (emailSendingRef.current) return
    emailSendingRef.current = true
    setEmailResult('sending')
    try {
      const res = await fetch('/api/email-send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PUSH_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: form.title, excerpt: form.excerpt, slug: form.slug }),
      })
      if (!res.ok) throw new Error()
      setEmailResult(await res.json())
    } catch {
      setEmailResult('error')
    } finally {
      emailSendingRef.current = false
    }
  }

  async function sendPushNotification() {
    if (pushSendingRef.current) return
    pushSendingRef.current = true
    setPushResult('sending')
    try {
      const res = await fetch('/api/push-send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PUSH_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: form.title,
          excerpt: form.excerpt,
          slug: form.slug,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPushResult(data)
    } catch {
      setPushResult('error')
    } finally {
      pushSendingRef.current = false
    }
  }

  const wc = wordCount(form.content)
  const publishChecks = useMemo(() => buildPublishChecks(form), [form])
  const publishCheckPassed = publishChecks.every(check => check.passed)
  const showPublishCheck = form.published || publishCheckError

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
          <input aria-label="標題" name="title" value={form.title} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Slug（URL）</label>
          <input name="slug" value={form.slug} onChange={handleChange}
            className={`w-full text-sm border rounded-lg px-4 py-2.5 focus:outline-none ${slugError ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'}`} />
          {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
          {!isNew && !slugError && <p className="text-xs text-gray-400 mt-1">URL 路徑，建立後請勿修改</p>}
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
            <div className="flex items-center gap-2">
              {showModeToggle && (
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
              )}
              <button type="button" onClick={() => setShowModeToggle(v => !v)}
                className="text-xs text-gray-300 hover:text-gray-500 transition-colors">
                {showModeToggle ? '收起' : '進階'}
              </button>
            </div>
          </div>
          {editorMode === 'wysiwyg' ? (
            <RichTextEditor
              value={form.content}
              onChange={html => {
                if (publishCheckError) setPublishCheckError('')
                setForm(f => ({ ...f, content: html }))
              }}
            />
          ) : (
            <MarkdownEditorPane
              value={form.content}
              onChange={md => {
                if (publishCheckError) setPublishCheckError('')
                setForm(f => ({ ...f, content: md }))
              }}
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
        {showPublishCheck && (
          <div data-testid="publish-checklist" className={`border rounded-xl p-4 ${
            publishCheckError ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">發布檢查</p>
              <span className={`text-xs ${publishCheckPassed ? 'text-green-600' : 'text-gray-400'}`}>
                {publishCheckPassed ? '已完成' : '尚未完成'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {publishChecks.map(check => (
                <div key={check.key} className="flex items-center gap-2 text-xs">
                  <span className={`inline-flex w-4 h-4 items-center justify-center rounded-full text-[10px] ${
                    check.passed ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {check.passed ? '✓' : '!'}
                  </span>
                  <span className={check.passed ? 'text-gray-600' : 'text-gray-500'}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
            {publishCheckError && (
              <p className="text-xs text-red-500 mt-3">{publishCheckError}</p>
            )}
          </div>
        )}
        {form.published && currentId && (
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex flex-col gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Email 通知</p>
              <p className="text-xs text-gray-400 mb-3">標題：{form.title}</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={sendEmailNotification}
                  disabled={emailResult === 'sending'}
                  className="text-xs bg-gray-900 text-white px-4 py-1.5 rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  {emailResult === 'sending' ? '送出中…' : '發送 Email 給所有訂閱者'}
                </button>
                {emailResult && emailResult !== 'sending' && (
                  <span className={`text-xs ${emailResult === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
                    {emailResult === 'error' ? '發送失敗' : `已送出 ${emailResult.sent} 封`}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">推播通知</p>
            <p className="text-xs text-gray-400 mb-1">標題：{form.title}</p>
            <p className="text-xs text-gray-400 mb-3">摘要：{(form.excerpt ?? '').slice(0, 80)}{form.excerpt?.length > 80 ? '…' : ''}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={sendPushNotification}
                disabled={pushResult === 'sending'}
                className="text-xs bg-gray-900 text-white px-4 py-1.5 rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                {pushResult === 'sending' ? '送出中…' : '送出通知給所有訂閱者'}
              </button>
              {pushResult && pushResult !== 'sending' && (
                <span className={`text-xs ${pushResult === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
                  {pushResult === 'error'
                    ? '送出失敗'
                    : `已送出 ${pushResult.sent} 人${pushResult.removed > 0 ? `，清理 ${pushResult.removed} 個過期訂閱` : ''}`
                  }
                </span>
              )}
            </div>
            </div>
          </div>
        )}
        <div className="flex gap-3 flex-wrap">
          <button type="submit" disabled={saving}
            className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? '儲存中…' : isNew ? '建立文章' : '儲存'}
          </button>
          {currentId && (
            <button type="button"
              onClick={() => { clearTimeout(autoSaveRef.current); doSave() }}
              disabled={saveStatus === 'saving'}
              className={`text-sm border px-4 py-2.5 rounded-lg transition-colors ${
                saveStatus === 'saving'
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : saveStatus.startsWith('saved:')
                    ? 'border-green-300 text-green-600 hover:border-green-400'
                    : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}>
              {saveStatus === 'saving' ? '儲存中…' : saveStatus.startsWith('saved:') ? `✓ 已儲存 ${saveStatus.slice(6)}` : '⌘S 立即儲存'}
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
