import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUpload } from '../../hooks/useUpload'

export default function AdminPhotoProjectEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState({
    title: '', description: '', content: '',
    cover_url: '', images: '', tags: '', display_order: 0,
  })
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 })

  const coverInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const { uploading, uploadError, uploadOne, uploadMany } = useUpload()

  useEffect(() => {
    if (!isNew) {
      supabase.from('photo_projects').select('*').eq('id', id).single().then(({ data, error }) => {
        if (!error && data) setForm({
          ...data,
          tags: (data.tags ?? []).join(', '),
          images: (data.images ?? []).join('\n'),
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
      cover_url: form.cover_url || null,
      images: form.images.split('\n').map(u => u.trim()).filter(Boolean),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      display_order: Number(form.display_order),
    }
    if (isNew) {
      await supabase.from('photo_projects').insert(payload)
    } else {
      await supabase.from('photo_projects').update(payload).eq('id', id)
    }
    navigate('/admin/photo-projects')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold mb-7">{isNew ? '新增攝影作品' : '編輯攝影作品'}</h1>
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
            placeholder="人像, 商業, 風景"
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">封面圖片</label>
          <div className="flex gap-2">
            <input name="cover_url" value={form.cover_url} onChange={handleChange}
              placeholder="https://..."
              className="flex-1 text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
            <button
              type="button"
              disabled={uploading}
              onClick={() => coverInputRef.current.click()}
              className="text-sm border border-gray-200 px-4 py-2.5 rounded-lg hover:border-gray-400 disabled:opacity-50 whitespace-nowrap"
            >
              {uploading ? '上傳中…' : '上傳'}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files[0]
                if (file) uploadOne(file, url => setForm(f => ({ ...f, cover_url: url })))
                e.target.value = ''
              }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-500">Gallery 圖片（每行一個 URL）</label>
            <button
              type="button"
              disabled={uploading}
              onClick={() => galleryInputRef.current.click()}
              className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400 disabled:opacity-50"
            >
              {uploading
                ? `上傳中 ${uploadProgress.done}/${uploadProgress.total}…`
                : '上傳多張'}
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => {
                const files = Array.from(e.target.files)
                if (!files.length) return
                setUploadProgress({ done: 0, total: files.length })
                uploadMany(
                  files,
                  url => setForm(f => ({ ...f, images: f.images ? `${f.images}\n${url}` : url })),
                  (done, total) => setUploadProgress({ done, total })
                )
                e.target.value = ''
              }}
            />
          </div>
          {uploadError && <p className="text-xs text-red-500 mb-1">{uploadError}</p>}
          <textarea name="images" value={form.images} onChange={handleChange} rows={6}
            placeholder={"https://pub-xxx.r2.dev/photo1.jpg\nhttps://pub-xxx.r2.dev/photo2.jpg"}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400 font-mono" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">內容（Markdown，拍攝故事說明）</label>
          <textarea name="content" value={form.content} onChange={handleChange} rows={10}
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
          <button type="button" onClick={() => navigate('/admin/photo-projects')}
            className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
