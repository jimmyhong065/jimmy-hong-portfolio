import { useState, useEffect, useRef } from 'react'
import SEOHead from '../components/SEOHead'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

const CATEGORIES = ['自動化測試', 'API 測試', 'QA 職涯', '測試工具', '流程設計', '其他']

const CATEGORY_STYLE = 'text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100'

export default function Wish() {
  const [content, setContent] = useState('')
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [category, setCategory] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState('idle') // idle | sending | tossing | done | error | limited
  const [tossText, setTossText] = useState('')

  const [wishes, setWishes] = useState([])
  const [wallLoading, setWallLoading] = useState(true)
  const tossTimer = useRef(null)
  const wellRef = useRef(null)

  useEffect(() => {
    fetch('/api/wishes')
      .then(r => r.json())
      .then(d => setWishes(d.wishes ?? []))
      .catch(() => setWishes([]))
      .finally(() => setWallLoading(false))
  }, [])

  useEffect(() => () => clearTimeout(tossTimer.current), [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (status === 'sending' || status === 'tossing') return
    setStatus('sending')
    try {
      const res = await fetch('/api/wish-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, email, nickname, category, website }),
      })
      if (res.status === 429) {
        setStatus('limited')
        return
      }
      if (!res.ok) throw new Error()

      // 播丟幣動畫 — 先把許願井捲回畫面，手機填完表單已捲到下方才看得到
      setTossText(content.trim().slice(0, 24))
      setStatus('tossing')
      wellRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'wish_submit', { category: category || 'none' })
      }
      tossTimer.current = setTimeout(() => {
        setStatus('done')
        setContent(''); setEmail(''); setNickname(''); setCategory('')
      }, 2600)
    } catch {
      setStatus('error')
    }
  }

  function wishAgain() {
    setTossText('')
    setStatus('idle')
  }

  const tossing = status === 'tossing'

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEOHead
        title="許願池"
        description="許下你想看的文章方向，投一塊錢進許願池，我會挑選願望寫成文章。"
        canonical="/wish"
      />
      <Nav />

      <main className="flex-1 max-w-2xl w-full mx-auto px-5 sm:px-6 pt-10 pb-20">
        {/* Hero */}
        <header className="text-center mb-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">許願池</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">許一個想看的文章</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            想看什麼 QA 主題？投一塊錢進池子許個願，<br className="hidden sm:block" />
            我會從願望裡挑題目寫成文章。
          </p>
        </header>

        {/* Wishing well — hand-drawn illustration + animation overlay */}
        <div ref={wellRef} className="wish-well mx-auto mb-3">
          <svg viewBox="0 0 240 210" className="wish-illu" aria-hidden="true">
            {/* soft ground shadow */}
            <ellipse cx="120" cy="172" rx="80" ry="13" fill="#000000" opacity="0.06" />
            {/* outer stone rim */}
            <ellipse cx="120" cy="120" rx="94" ry="62" fill="#f4ecd8" stroke="#5f4530" strokeWidth="4" />
            {/* inner well wall */}
            <ellipse cx="120" cy="120" rx="74" ry="46" fill="#e6d6b6" stroke="#5f4530" strokeWidth="2.5" />
            {/* water */}
            <ellipse cx="120" cy="122" rx="68" ry="40" fill="#74c4b2" stroke="#46897a" strokeWidth="3" />
            {/* water highlight */}
            <ellipse cx="98" cy="110" rx="30" ry="11" fill="#ffffff" opacity="0.22" />
            {/* hand-drawn ripple lines */}
            <path d="M86 128 Q120 142 154 128" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
            <path d="M98 137 Q120 146 142 137" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.38" />
            {/* twinkling sparkles */}
            <g transform="translate(206 48)">
              <path className="wish-spark" d="M0,-7 C1.2,-1.2 1.2,-1.2 7,0 C1.2,1.2 1.2,1.2 0,7 C-1.2,1.2 -1.2,1.2 -7,0 C-1.2,-1.2 -1.2,-1.2 0,-7 Z" fill="#d97706" />
            </g>
            <g transform="translate(32 66) scale(0.7)">
              <path className="wish-spark s2" d="M0,-7 C1.2,-1.2 1.2,-1.2 7,0 C1.2,1.2 1.2,1.2 0,7 C-1.2,1.2 -1.2,1.2 -7,0 C-1.2,-1.2 -1.2,-1.2 0,-7 Z" fill="#46897a" />
            </g>
            <g transform="translate(214 152) scale(0.6)">
              <path className="wish-spark s3" d="M0,-7 C1.2,-1.2 1.2,-1.2 7,0 C1.2,1.2 1.2,1.2 0,7 C-1.2,1.2 -1.2,1.2 -7,0 C-1.2,-1.2 -1.2,-1.2 0,-7 Z" fill="#d97706" />
            </g>
          </svg>

          <div className="wish-stage">
            {tossing && (
              <>
                <span className="wish-coin">$</span>
                <span className="wish-ripple" />
                <span className="wish-ripple r2" />
                {tossText && <span className="wish-float">「{tossText}」</span>}
              </>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mb-8">投一塊錢，許個願</p>

        {/* States */}
        {status === 'done' && (
          <div className="text-center py-6">
            <p className="text-base font-medium text-gray-800 mb-1">願望已投入許願池</p>
            <p className="text-sm text-gray-500 mb-4">謝謝你的許願，我會認真考慮這個方向。</p>
            <button onClick={wishAgain} className="text-sm bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-700">
              再許一個
            </button>
          </div>
        )}

        {status === 'limited' && (
          <p className="text-center text-sm text-amber-600 py-4">許願太快囉，請 30 秒後再試一次。</p>
        )}

        {/* Form */}
        {(status === 'idle' || status === 'sending' || status === 'tossing' || status === 'error' || status === 'limited') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                想看的文章方向 <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                minLength={4}
                maxLength={1000}
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={4}
                placeholder="例如：想看如何用 Playwright 處理登入後的 session 重用…"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">類別<span className="text-gray-400 font-normal">（選填）</span></label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 bg-white"
                >
                  <option value="">不指定</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">暱稱<span className="text-gray-400 font-normal">（選填）</span></label>
                <input
                  type="text"
                  maxLength={40}
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="願望牆上的署名"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email<span className="text-gray-400 font-normal">（選填，文章寫出來時通知你）</span></label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Honeypot — hidden from humans */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              className="hidden"
              aria-hidden="true"
            />

            {status === 'error' && (
              <p className="text-sm text-red-500">送出失敗，請稍後再試。</p>
            )}

            <button
              type="submit"
              disabled={status === 'sending' || status === 'tossing'}
              className="w-full sm:w-auto text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {status === 'sending' ? '投幣中…' : tossing ? '許願中…' : '投一塊錢許願'}
            </button>
          </form>
        )}

        {/* Wishing wall */}
        <section className="mt-16 pt-8 border-t border-gray-100">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-5">精選願望牆</h2>
          {wallLoading ? (
            <p className="text-sm text-gray-400">載入中…</p>
          ) : wishes.length === 0 ? (
            <p className="text-sm text-gray-400">還沒有精選願望，許下第一個吧。</p>
          ) : (
            <ul className="space-y-3">
              {wishes.map(w => (
                <li key={w.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/60">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{w.content}</p>
                  <div className="flex items-center gap-2 mt-2.5">
                    {w.category && <span className={CATEGORY_STYLE}>{w.category}</span>}
                    <span className="text-xs text-gray-400">— {w.nickname || '匿名'}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
