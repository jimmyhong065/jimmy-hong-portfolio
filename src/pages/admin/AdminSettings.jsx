import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useUpload } from '../../hooks/useUpload'

export default function AdminSettings() {
  const [form, setForm] = useState({ email: '', github_url: '', linkedin_url: '', avatar_url: '', photo_avatar_url: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const avatarInputRef = useRef(null)
  const photoAvatarInputRef = useRef(null)
  const { uploading, uploadError, uploadOne } = useUpload()

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) setForm(data)
    })
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError(null)
    const { error: saveError } = await supabase.from('settings').update({
      email: form.email,
      github_url: form.github_url,
      linkedin_url: form.linkedin_url,
      avatar_url: form.avatar_url,
      photo_avatar_url: form.photo_avatar_url,
    }).eq('id', 1)
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold mb-7">個人設定</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">電子郵件</label>
          <input name="email" value={form.email} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">GitHub 網址</label>
          <input name="github_url" value={form.github_url} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">LinkedIn 網址</label>
          <input name="linkedin_url" value={form.linkedin_url} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">頭像圖片網址</label>
          <div className="flex gap-2">
            <input name="avatar_url" value={form.avatar_url} onChange={handleChange}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
            <button
              type="button"
              disabled={uploading}
              onClick={() => avatarInputRef.current.click()}
              className="text-sm border border-gray-200 px-4 py-2.5 rounded-lg hover:border-gray-400 disabled:opacity-50 whitespace-nowrap"
            >
              {uploading ? '上傳中…' : '上傳'}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files[0]
                if (file) uploadOne(file, url => setForm(f => ({ ...f, avatar_url: url })))
                e.target.value = ''
              }}
            />
          </div>
          {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">攝影站大頭貼網址</label>
          <div className="flex gap-2">
            <input name="photo_avatar_url" value={form.photo_avatar_url} onChange={handleChange}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
            <button
              type="button"
              disabled={uploading}
              onClick={() => photoAvatarInputRef.current.click()}
              className="text-sm border border-gray-200 px-4 py-2.5 rounded-lg hover:border-gray-400 disabled:opacity-50 whitespace-nowrap"
            >
              {uploading ? '上傳中…' : '上傳'}
            </button>
            <input
              ref={photoAvatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files[0]
                if (file) uploadOne(file, url => setForm(f => ({ ...f, photo_avatar_url: url })))
                e.target.value = ''
              }}
            />
          </div>
        </div>
        {success && <p className="text-sm text-green-600">已儲存</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div>
          <button type="submit" disabled={saving}
            className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? '儲存中…' : '儲存'}
          </button>
        </div>
      </form>
    </div>
  )
}
