import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useUpload } from '../../hooks/useUpload'
import KeywordInput from '../../components/KeywordInput'
import { SVG_MAP, ICON_KEYS, FALLBACK_TABS } from '../../components/NavIconMap'

function IconPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ICON_KEYS.map(key => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors ${
            value === key
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 text-gray-500 hover:border-gray-400'
          }`}
          title={key}
        >
          {SVG_MAP[key]}
        </button>
      ))}
    </div>
  )
}

export default function AdminSettings() {
  const [form, setForm] = useState({ email: '', github_url: '', linkedin_url: '', avatar_url: '', photo_avatar_url: '', seo_keywords: '', seo_description: '', seo_photo_keywords: '', seo_photo_description: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [navTabs, setNavTabs] = useState(FALLBACK_TABS)
  const [navSaving, setNavSaving] = useState(false)
  const [navSuccess, setNavSuccess] = useState(false)
  const [navError, setNavError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ label: '', url: '', icon_key: 'link' })
  const [adding, setAdding] = useState(false)
  const [addForm, setAddForm] = useState({ label: '', url: '', icon_key: 'link' })
  const avatarInputRef = useRef(null)
  const photoAvatarInputRef = useRef(null)
  const { uploading, uploadError, uploadOne } = useUpload()

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) {
        setForm(data)
        if (data.nav_tabs?.length) setNavTabs(data.nav_tabs)
      }
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
      seo_keywords: form.seo_keywords,
      seo_description: form.seo_description,
      seo_photo_keywords: form.seo_photo_keywords,
      seo_photo_description: form.seo_photo_description,
    }).eq('id', 1)
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
    } else {
      setSuccess(true)
    }
  }

  function toggleVisible(id) {
    setNavTabs(tabs => tabs.map(t => t.id === id ? { ...t, visible: !t.visible } : t))
  }

  function moveTab(id, dir) {
    setNavTabs(tabs => {
      const arr = [...tabs].sort((a, b) => a.order - b.order)
      const idx = arr.findIndex(t => t.id === id)
      const target = idx + dir
      if (target < 0 || target >= arr.length) return tabs
      ;[arr[idx].order, arr[target].order] = [arr[target].order, arr[idx].order]
      return arr
    })
  }

  function deleteTab(id) {
    setNavTabs(tabs => tabs.filter(t => t.id !== id))
  }

  function startEdit(tab) {
    setEditingId(tab.id)
    setEditForm({ label: tab.label, url: tab.url, icon_key: tab.icon_key })
  }

  function saveEdit() {
    setNavTabs(tabs => tabs.map(t => t.id === editingId ? { ...t, ...editForm } : t))
    setEditingId(null)
  }

  function addTab() {
    const newTab = {
      id: Date.now().toString(),
      ...addForm,
      visible: true,
      order: navTabs.length,
    }
    setNavTabs(tabs => [...tabs, newTab])
    setAdding(false)
    setAddForm({ label: '', url: '', icon_key: 'link' })
  }

  async function saveNavTabs() {
    setNavSaving(true)
    setNavSuccess(false)
    setNavError(null)
    const normalized = [...navTabs]
      .sort((a, b) => a.order - b.order)
      .map((t, i) => ({ ...t, order: i }))
    const { error } = await supabase.from('settings').update({ nav_tabs: normalized }).eq('id', 1)
    setNavSaving(false)
    if (error) setNavError(error.message)
    else { setNavSuccess(true); setNavTabs(normalized) }
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
          <div className="flex gap-2 items-center">
            {form.avatar_url && (
              <img src={form.avatar_url} alt="頭像預覽"
                className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0" />
            )}
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
          <div className="flex gap-2 items-center">
            {form.photo_avatar_url && (
              <img src={form.photo_avatar_url} alt="攝影大頭貼預覽"
                className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0" />
            )}
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
        <hr className="border-gray-100" />
        <p className="text-xs tracking-widest text-gray-400 uppercase -mb-2">QA 網站 SEO</p>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">首頁 Meta Description</label>
          <textarea name="seo_description" value={form.seo_description} onChange={handleChange} rows={2}
            placeholder="留空則使用預設描述"
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">關鍵字</label>
          <KeywordInput
            value={form.seo_keywords}
            onChange={v => setForm(f => ({ ...f, seo_keywords: v }))}
          />
          <p className="text-xs text-gray-400 mt-1">按 Enter 或逗號新增，× 移除</p>
        </div>
        <hr className="border-gray-100" />
        <p className="text-xs tracking-widest text-gray-400 uppercase -mb-2">攝影網站 SEO</p>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">攝影站 Meta Description</label>
          <textarea name="seo_photo_description" value={form.seo_photo_description} onChange={handleChange} rows={2}
            placeholder="留空則使用預設描述"
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">攝影站關鍵字</label>
          <KeywordInput
            value={form.seo_photo_keywords}
            onChange={v => setForm(f => ({ ...f, seo_photo_keywords: v }))}
          />
          <p className="text-xs text-gray-400 mt-1">按 Enter 或逗號新增，× 移除</p>
        </div>
        {success && <p className="text-sm text-green-600">已儲存</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div>
          <button type="submit" disabled={saving}
            className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? '儲存中…' : '儲存'}
          </button>
        </div>

        <hr className="border-gray-100" />
        <p className="text-xs tracking-widest text-gray-400 uppercase -mb-2">手機底部選單</p>

        <div className="flex flex-col gap-2">
          {[...navTabs].sort((a, b) => a.order - b.order).map(tab => (
            <div key={tab.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2">
                <button type="button" onClick={() => toggleVisible(tab.id)} className="text-base leading-none" title={tab.visible ? '隱藏' : '顯示'}>
                  {tab.visible ? '👁' : <span className="opacity-30">👁</span>}
                </button>
                <span className="w-5 h-5 flex items-center justify-center text-gray-400">
                  {SVG_MAP[tab.icon_key] ?? SVG_MAP.link}
                </span>
                <span className="text-sm flex-1 truncate">{tab.label}</span>
                <span className="text-xs text-gray-400 truncate max-w-[100px]">{tab.url}</span>
                <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                  <button type="button" onClick={() => moveTab(tab.id, -1)} className="text-xs text-gray-400 hover:text-gray-700 px-1">⬆</button>
                  <button type="button" onClick={() => moveTab(tab.id, 1)} className="text-xs text-gray-400 hover:text-gray-700 px-1">⬇</button>
                  <button type="button" onClick={() => editingId === tab.id ? setEditingId(null) : startEdit(tab)} className="text-xs text-gray-400 hover:text-gray-700 px-1">✎</button>
                  <button type="button" onClick={() => deleteTab(tab.id)} className="text-xs text-red-400 hover:text-red-600 px-1">🗑</button>
                </div>
              </div>
              {editingId === tab.id && (
                <div className="px-3 pb-3 border-t border-gray-100 pt-3 flex flex-col gap-2">
                  <IconPicker value={editForm.icon_key} onChange={v => setEditForm(f => ({ ...f, icon_key: v }))} />
                  <input value={editForm.label} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="標籤" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
                  <input value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://... 或 /blog" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400">取消</button>
                    <button type="button" onClick={saveEdit} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700">確認</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {adding ? (
            <div className="border border-dashed border-gray-200 rounded-xl px-3 py-3 flex flex-col gap-2">
              <IconPicker value={addForm.icon_key} onChange={v => setAddForm(f => ({ ...f, icon_key: v }))} />
              <input value={addForm.label} onChange={e => setAddForm(f => ({ ...f, label: e.target.value }))}
                placeholder="標籤" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
              <input value={addForm.url} onChange={e => setAddForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://... 或 /blog" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setAdding(false)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400">取消</button>
                <button type="button" onClick={addTab} disabled={!addForm.label || !addForm.url}
                  className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-40">新增</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setAdding(true)}
              className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl px-3 py-2 hover:border-gray-400 hover:text-gray-600 text-left">
              + 新增 tab
            </button>
          )}
        </div>

        {navSuccess && <p className="text-sm text-green-600">選單已儲存</p>}
        {navError && <p className="text-sm text-red-500">{navError}</p>}
        <div>
          <button type="button" onClick={saveNavTabs} disabled={navSaving}
            className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {navSaving ? '儲存中…' : '儲存選單設定'}
          </button>
        </div>
      </form>
    </div>
  )
}
