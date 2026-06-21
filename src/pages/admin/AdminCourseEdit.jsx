import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUpload } from '../../hooks/useUpload'
import { moveChapter } from './courseOrder'

const EMPTY = { title: '', subtitle: '', description: '', cover_url: '', published: false, display_order: 0, slug: '' }

export default function AdminCourseEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [form, setForm] = useState(EMPTY)
  const [chapters, setChapters] = useState([])
  const [saving, setSaving] = useState(false)
  const { uploading, uploadError, uploadOne } = useUpload()
  const coverRef = useRef(null)
  const chapCoverRefs = useRef({})

  useEffect(() => {
    if (isNew) return
    supabase.from('courses').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({ ...EMPTY, ...data })
    })
    supabase.from('posts')
      .select('id, title, slug, course_order, cover_url, published')
      .eq('course_id', id).order('course_order')
      .then(({ data }) => setChapters(data ?? []))
  }, [id, isNew])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function saveChapterCover(chapterId, url) {
    setChapters(cs => cs.map(c => c.id === chapterId ? { ...c, cover_url: url } : c))
    await supabase.from('posts').update({ cover_url: url }).eq('id', chapterId)
  }

  async function reorder(index, dir) {
    const next = moveChapter(chapters, index, dir)
    if (next === chapters) return
    setChapters(next)
    await Promise.all(next.map(c => supabase.from('posts').update({ course_order: c.course_order }).eq('id', c.id)))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title, subtitle: form.subtitle || null, description: form.description || null,
      cover_url: form.cover_url || null, published: form.published,
      display_order: Number(form.display_order) || 0,
      slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-'),
    }
    if (isNew) await supabase.from('courses').insert(payload)
    else await supabase.from('courses').update(payload).eq('id', id)
    setSaving(false)
    navigate('/admin/courses')
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <h1 className="text-lg font-bold mb-4">{isNew ? '新增課程' : '編輯課程'}</h1>

      <label className="block text-sm mb-1">課名</label>
      <input name="title" value={form.title} onChange={handleChange} required className="w-full border rounded px-3 py-2 mb-3" />

      <label className="block text-sm mb-1">slug</label>
      <input name="slug" value={form.slug} onChange={handleChange} placeholder="course-xxx" className="w-full border rounded px-3 py-2 mb-3" />

      <label className="block text-sm mb-1">副標</label>
      <input name="subtitle" value={form.subtitle} onChange={handleChange} className="w-full border rounded px-3 py-2 mb-3" />

      <label className="block text-sm mb-1">簡介</label>
      <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full border rounded px-3 py-2 mb-3" />

      <label className="block text-sm mb-1">課程封面</label>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-28 h-20 bg-gray-100 rounded overflow-hidden">
          {form.cover_url && <img src={form.cover_url} alt="封面" className="w-full h-full object-cover" />}
        </div>
        <input type="file" accept="image/*" ref={coverRef} className="hidden"
          onChange={e => { const f = e.target.files[0]; if (f) uploadOne(f, url => setForm(s => ({ ...s, cover_url: url }))) }} />
        <button type="button" disabled={uploading} onClick={() => coverRef.current.click()}
          className="text-xs border px-3 py-2 rounded">{uploading ? '上傳中…' : '上傳封面'}</button>
      </div>
      {uploadError && <p className="text-xs text-red-500 mb-2">{uploadError}</p>}

      <div className="flex items-center gap-2 mb-3">
        <input type="checkbox" name="published" checked={form.published} onChange={handleChange} id="pub" />
        <label htmlFor="pub" className="text-sm">公開（本輪請保持未勾）</label>
      </div>

      <label className="block text-sm mb-1">顯示順序</label>
      <input name="display_order" type="number" value={form.display_order} onChange={handleChange} className="w-28 border rounded px-3 py-2 mb-5" />

      {!isNew && (
        <div className="mb-5">
          <h2 className="text-sm font-bold mb-2">章節（{chapters.length}）</h2>
          <div className="space-y-2">
            {chapters.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 border rounded p-2">
                <span className="text-xs text-gray-400 w-6">{c.course_order}</span>
                <div className="w-14 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {c.cover_url && <img src={c.cover_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <a href={`/admin/posts/${c.id}`} className="flex-1 min-w-0 text-sm truncate hover:underline">{c.title}</a>
                <input type="file" accept="image/*" className="hidden"
                  ref={el => (chapCoverRefs.current[c.id] = el)}
                  onChange={e => { const f = e.target.files[0]; if (f) uploadOne(f, url => saveChapterCover(c.id, url)) }} />
                <button type="button" disabled={uploading} onClick={() => chapCoverRefs.current[c.id].click()}
                  className="text-xs border px-2 py-1 rounded">封面</button>
                <button type="button" onClick={() => reorder(i, 'up')} disabled={i === 0} className="text-xs px-2 disabled:opacity-30">↑</button>
                <button type="button" onClick={() => reorder(i, 'down')} disabled={i === chapters.length - 1} className="text-xs px-2 disabled:opacity-30">↓</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button type="submit" disabled={saving} className="bg-gray-900 text-white px-5 py-2 rounded text-sm">
        {saving ? '儲存中…' : '儲存'}
      </button>
    </form>
  )
}
