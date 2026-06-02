import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUpload } from '../../hooks/useUpload'

export default function AdminPhotoProjectEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState({
    title: '', description: '', content: '', cover_url: '', tags: '', display_order: 0,
  })
  const [imageList, setImageList] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 })
  const [draggingIdx, setDraggingIdx] = useState(null)

  const coverInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const { uploading, uploadError, uploadOne, uploadMany } = useUpload()

  useEffect(() => {
    if (!isNew) {
      supabase.from('photo_projects').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setForm({
            title: data.title ?? '',
            description: data.description ?? '',
            content: data.content ?? '',
            cover_url: data.cover_url ?? '',
            tags: (data.tags ?? []).join(', '),
            display_order: data.display_order ?? 0,
          })
          setImageList(data.images ?? [])
        }
      })
    }
  }, [id, isNew])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function removeImage(idx) {
    setImageList(prev => prev.filter((_, i) => i !== idx))
  }

  // drag-and-drop handlers
  const dragOver = useRef(null)
  function onDragStart(idx) { setDraggingIdx(idx) }
  function onDragEnter(idx) {
    if (draggingIdx === null || draggingIdx === idx) return
    dragOver.current = idx
    setImageList(prev => {
      const next = [...prev]
      const [moved] = next.splice(draggingIdx, 1)
      next.splice(idx, 0, moved)
      setDraggingIdx(idx)
      return next
    })
  }
  function onDragEnd() { setDraggingIdx(null); dragOver.current = null }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description,
      content: form.content,
      cover_url: form.cover_url || null,
      images: imageList,
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

        {/* Cover image + preview */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">封面圖片</label>
          <div className="flex gap-2 items-start">
            {form.cover_url && (
              <img src={form.cover_url} alt="封面預覽"
                className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
            )}
            <div className="flex-1 flex gap-2">
              <input name="cover_url" value={form.cover_url} onChange={handleChange}
                placeholder="https://..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
              <button type="button" disabled={uploading} onClick={() => coverInputRef.current.click()}
                className="text-sm border border-gray-200 px-4 py-2.5 rounded-lg hover:border-gray-400 disabled:opacity-50 whitespace-nowrap">
                {uploading ? '上傳中…' : '上傳'}
              </button>
            </div>
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => {
              const file = e.target.files[0]
              if (file) uploadOne(file, url => setForm(f => ({ ...f, cover_url: url })))
              e.target.value = ''
            }} />
        </div>

        {/* Gallery drag-and-drop */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500">Gallery 圖片（拖曳排序）</label>
            <button type="button" disabled={uploading} onClick={() => galleryInputRef.current.click()}
              className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400 disabled:opacity-50">
              {uploading && uploadProgress.total > 0
                ? `上傳中 ${uploadProgress.done}/${uploadProgress.total}…`
                : '上傳多張'}
            </button>
          </div>
          {uploadError && <p className="text-xs text-red-500 mb-2">{uploadError}</p>}
          <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => {
              const files = Array.from(e.target.files)
              if (!files.length) return
              setUploadProgress({ done: 0, total: files.length })
              uploadMany(
                files,
                url => setImageList(prev => [...prev, url]),
                (done, total) => setUploadProgress({ done, total })
              )
              e.target.value = ''
            }} />

          {imageList.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400">
              上傳圖片後會在這裡顯示，可拖曳調整順序
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {imageList.map((url, idx) => (
                <div
                  key={url + idx}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragEnter={() => onDragEnter(idx)}
                  onDragEnd={onDragEnd}
                  onDragOver={e => e.preventDefault()}
                  className={`relative group rounded-lg overflow-hidden border cursor-grab active:cursor-grabbing transition-opacity ${draggingIdx === idx ? 'opacity-40 border-gray-400' : 'border-gray-200'}`}
                >
                  <img src={url} alt="" className="w-full aspect-square object-cover" />
                  {/* Drag handle */}
                  <div className="absolute top-1 left-1 bg-black/40 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                      <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                      <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                    </svg>
                  </div>
                  {/* Order badge */}
                  <div className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {idx + 1}
                  </div>
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute bottom-1 right-1 bg-red-500 text-white rounded px-1.5 py-0.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    刪除
                  </button>
                </div>
              ))}
            </div>
          )}
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
