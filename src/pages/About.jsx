import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'

const SKILLS = [
  'Appium', 'Playwright', 'pytest', 'Python',
  'CI/CD', 'GitHub Actions', 'Supabase', 'Linear',
  '測試策略', '流程設計', 'QA 系統設計',
]

const EXPERIENCE = [
  {
    company: 'Seekrtech',
    role: 'QA Engineer',
    period: '2023 — 現在',
    desc: '建立 Mobile App 自動化測試框架（iOS/Android）、QA 流程規範、品質儀表板。導入 Appium + CI/CD 讓 regression 週期縮短 60%。',
  },
]

const SERVICES = [
  { icon: '🗂', title: 'QA 流程審查', desc: '針對現有測試流程進行健診，找出瓶頸與缺口，提供具體改善建議。' },
  { icon: '🤖', title: '自動化導入顧問', desc: '協助團隊評估與導入自動化測試框架，從工具選型到 CI 整合一條龍。' },
  { icon: '📐', title: '測試策略規劃', desc: '依產品特性設計測試金字塔與覆蓋率目標，讓品質投入有效率。' },
]

export default function About() {
  return (
    <>
      <SEOHead title="關於我" description="Jimmy Hong — QA Engineer，專注測試流程設計與品質架構。" />
      <Nav />
      <main className="max-w-2xl mx-auto px-12 py-16">
        <div className="flex gap-6 items-start mb-8">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden ring-2 ring-gray-100 ring-offset-2">
            <img src="/avatar.jpg" alt="Jimmy Hong" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
          </div>
          <div>
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-1">About</p>
            <h1 className="text-2xl font-bold mb-1">Hi，我是 Jimmy Hong</h1>
            <p className="text-sm text-gray-500">QA Engineer / 品質架構師</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-10">
          我相信「品質是設計出來的，不是測出來的」。<br /><br />
          從手動測試起步，逐步建立自動化框架與測試流程，目前專注於幫助團隊設計可擴展的 QA 系統——讓品質內化成開發文化，而不是 release 前的最後一關。<br /><br />
          平時喜歡把工作上遇到的流程問題和解法整理成文章，分享給同樣在 QA 路上的夥伴。
        </p>
        <hr className="border-gray-100 mb-10" />
        <h2 className="text-sm font-semibold mb-4">技能</h2>
        <div className="flex gap-2 flex-wrap mb-10">
          {SKILLS.map(s => <span key={s} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{s}</span>)}
        </div>
        <hr className="border-gray-100 mb-10" />
        <h2 className="text-sm font-semibold mb-6">工作經歷</h2>
        {EXPERIENCE.map(e => (
          <div key={e.company} className="mb-6">
            <div className="text-sm font-semibold">{e.role} · {e.company}</div>
            <div className="text-xs text-gray-400 mt-1 mb-2">{e.period}</div>
            <p className="text-sm text-gray-500 leading-relaxed">{e.desc}</p>
          </div>
        ))}
        <hr className="border-gray-100 mb-10" />
        <h2 className="text-sm font-semibold mb-4">合作方式</h2>
        <div className="grid grid-cols-1 gap-4 mb-10">
          {SERVICES.map(s => (
            <div key={s.title} className="border border-gray-200 rounded-xl p-5 flex gap-4">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <h3 className="text-sm font-semibold mb-1">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <a href="mailto:your@email.com" className="inline-block text-xs bg-gray-900 text-white px-5 py-2.5 rounded-md hover:bg-gray-700">聯絡我</a>
        <div className="flex gap-2 mt-4">
          <a href="https://github.com/" target="_blank" rel="noreferrer" className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 hover:border-gray-400">gh</a>
          <a href="https://linkedin.com/" target="_blank" rel="noreferrer" className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 hover:border-gray-400">in</a>
        </div>
      </main>
      <Footer />
    </>
  )
}
