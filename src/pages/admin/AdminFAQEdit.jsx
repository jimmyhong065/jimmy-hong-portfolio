import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const INIT = { question: '', answer: '', category: '一般問題', display_order: 0, published: true }

export default function AdminFAQEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [form, setForm] = useState(INIT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isNew) return
    supabase.from('faqs').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm(data)
    })
  }, [id, isNew])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      question: form.question,
      answer: form.answer,
      category: form.category,
      display_order: Number(form.display_order),
      published: form.published,
    }
    const { error: err } = isNew
      ? await supabase.from('faqs').insert(payload)
      : await supabase.from('faqs').update(payload).eq('id', id)
    setSaving(false)
    if (err) { setError(err.message); return }
    navigate('/admin/faqs')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold mb-7">{isNew ? '新增 FAQ' : '編輯 FAQ'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">問題類別</label>
          <input name="category" value={form.category} onChange={handleChange}
            placeholder="例：服務諮詢"
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">問題</label>
          <input required name="question" value={form.question} onChange={handleChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">回答</label>
          <textarea required name="answer" value={form.answer} onChange={handleChange} rows={6}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400 resize-none" />
        </div>
        <div className="flex gap-5">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">排序（數字越小越前面）</label>
            <input type="number" name="display_order" value={form.display_order} onChange={handleChange}
              className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="published" checked={form.published} onChange={handleChange} />
              <span className="text-sm text-gray-600">上架</span>
            </label>
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? '儲存中…' : '儲存'}
          </button>
          <button type="button" onClick={() => navigate('/admin/faqs')}
            className="text-sm text-gray-500 px-4 py-2.5 rounded-lg hover:bg-gray-100">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
