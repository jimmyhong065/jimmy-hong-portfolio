import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUpload } from '../../hooks/useUpload'

export default function AdminProjectEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState({
    title: '', description: '', content: '',
    tags: '', github: '', demo: '',
    display_order: 0,
  })
  const [images, setImages] = useState([]) // [{url, caption}]
  const [saving, setSaving] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState(null)
  const fileInputRef = useRef(null)
  const { uploading, uploadError, uploadOne } = useUpload()

  useEffect(() => {
    if (!isNew) {
      supabase.from('projects').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setForm({
            ...data,
            tags: (data.tags ?? []).join(', '),
            github: data.links?.github ?? '',
            demo: data.links?.demo ?? '',
          })
          setImages(data.images ?? (data.cover_url ? [{ url: data.cover_url, caption: '' }] : []))
        }
      })
    }
  }, [id, isNew])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function handleImageChange(index, field, value) {
    setImages(imgs => imgs.map((img, i) => i === index ? { ...img, [field]: value } : img))
  }

  function addImage() {
    setImages(imgs => [...imgs, { url: '', caption: '' }])
  }

  function removeImage(index) {
    setImages(imgs => imgs.filter((_, i) => i !== index))
  }

  function triggerUpload(index) {
    setUploadingIndex(index)
    fileInputRef.current.click()
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    uploadOne(file, url => handleImageChange(uploadingIndex, 'url', url))
    e.target.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const validImages = images.filter(img => img.url.trim())
    const payload = {
      title: form.title,
      description: form.description,
      content: form.content,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      cover_url: validImages[0]?.url || null,
      images: validImages,
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

        {/* Multi-image editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500">作品圖片（第一張自動成為封面）</label>
            <button type="button" onClick={addImage}
              className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400">
              + 新增圖片
            </button>
          </div>
          {uploadError && <p className="text-xs text-red-500 mb-2">{uploadError}</p>}
          <div className="flex flex-col gap-3">
            {images.map((img, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-3 flex gap-3">
                {img.url && (
                  <img src={img.url} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
                )}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      value={img.url}
                      onChange={e => handleImageChange(i, 'url', e.target.value)}
                      placeholder="貼上圖片 URL 或點擊上傳（支援 GitHub、任意 URL）"
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
                    />
                    <button type="button"
                      disabled={uploading && uploadingIndex === i}
                      onClick={() => triggerUpload(i)}
                      className="text-xs border border-gray-200 px-3 py-2 rounded-lg hover:border-gray-400 disabled:opacity-50 whitespace-nowrap">
                      {uploading && uploadingIndex === i ? '上傳中…' : '上傳'}
                    </button>
                  </div>
                  <input
                    value={img.caption}
                    onChange={e => handleImageChange(i, 'caption', e.target.value)}
                    placeholder="圖片說明（選填）"
                    className="text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
                  />
                </div>
                <button type="button" onClick={() => removeImage(i)}
                  className="text-gray-400 hover:text-red-500 text-xs self-start pt-1">✕</button>
              </div>
            ))}
            {images.length === 0 && (
              <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
                <p className="text-xs text-gray-400">還沒有圖片，點擊「+ 新增圖片」開始</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
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
