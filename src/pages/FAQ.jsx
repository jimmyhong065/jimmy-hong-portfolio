import { useState } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import { useFAQs } from '../hooks/useFAQs'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['服務諮詢', '報價詢問', '現有合作調整', '技術諮詢', '其他']

const INIT = { name: '', email: '', category: '', message: '', line_id: '', privacy: false }

export default function FAQ() {
  const { faqs, loading } = useFAQs()
  const [open, setOpen] = useState(null)
  const [form, setForm] = useState(INIT)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const grouped = faqs.reduce((acc, faq) => {
    const cat = faq.category || '一般問題'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(faq)
    return acc
  }, {})

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.privacy) { setError('請勾選同意隱私權條款'); return }
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabase.from('faq_submissions').insert({
      name: form.name,
      email: form.email,
      category: form.category,
      message: form.message,
      line_id: form.line_id || null,
    })
    setSubmitting(false)
    if (err) { setError('送出失敗，請稍後再試'); return }
    setSubmitted(true)
    setForm(INIT)
  }

  return (
    <>
      <SEOHead title="常見問題" description="Jimmy Hong QA 工程師的常見問題與諮詢表單。" />
      <Nav />
      <main className="max-w-3xl mx-auto px-4 md:px-12 py-16">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">FAQ</p>
        <h1 className="text-2xl font-bold mb-12">常見問題</h1>

        {loading ? (
          <p className="text-sm text-gray-400">載入中…</p>
        ) : faqs.length === 0 ? (
          <p className="text-sm text-gray-400 mb-16">尚無常見問題。</p>
        ) : (
          <div className="mb-16 flex flex-col gap-10">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">{cat}</p>
                <div className="flex flex-col divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                  {items.map(faq => (
                    <div key={faq.id}>
                      <button
                        className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                        onClick={() => setOpen(open === faq.id ? null : faq.id)}
                      >
                        <span className="text-sm font-medium text-gray-900 pr-4">{faq.question}</span>
                        <svg
                          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open === faq.id ? 'rotate-180' : ''}`}
                          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {open === faq.id && (
                        <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">
                          <p className="text-sm text-gray-600 leading-relaxed pt-4 whitespace-pre-line">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 提問表單 */}
        <div className="border-t border-gray-100 pt-12">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">提出問題</p>
          <h2 className="text-xl font-bold mb-2">沒找到答案？</h2>
          <p className="text-sm text-gray-500 mb-8">填寫下方表單，我會在 24–48 小時內回覆。</p>

          {submitted ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-8 py-10 text-center">
              <p className="text-2xl mb-3">✓</p>
              <p className="text-sm font-semibold text-gray-900 mb-1">已收到你的提問！</p>
              <p className="text-xs text-gray-500">我會在 24–48 小時內以 Email 回覆，請留意信箱。</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">姓名 / 暱稱 <span className="text-red-400">*</span></label>
                  <input required name="name" value={form.name} onChange={handleChange}
                    className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">電子郵件 <span className="text-red-400">*</span></label>
                  <input required type="email" name="email" value={form.email} onChange={handleChange}
                    className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">問題類別 <span className="text-red-400">*</span></label>
                <select required name="category" value={form.category} onChange={handleChange}
                  className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400 bg-white">
                  <option value="">請選擇</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">提問內容 <span className="text-red-400">*</span></label>
                <textarea required name="message" value={form.message} onChange={handleChange} rows={5}
                  placeholder="請描述你的問題…"
                  className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400 resize-none" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">LINE ID（選填）</label>
                <input name="line_id" value={form.line_id} onChange={handleChange}
                  placeholder="方便時可用 LINE 回覆"
                  className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400" />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="privacy" checked={form.privacy} onChange={handleChange}
                  className="mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-500">我已閱讀並同意，所填寫的個人資料僅用於回覆本次諮詢，不會轉作其他用途。</span>
              </label>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div>
                <button type="submit" disabled={submitting}
                  className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
                  {submitting ? '送出中…' : '送出提問'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
