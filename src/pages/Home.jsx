import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import ProjectCard from '../components/ProjectCard'
import BlogRow from '../components/BlogRow'
import { usePosts } from '../hooks/usePosts'
import { useProjects } from '../hooks/useProjects'

const SERVICES = [
  { icon: '🗂', title: 'QA 流程審查', desc: '針對現有測試流程進行健診，找出瓶頸與缺口，提供具體改善建議。' },
  { icon: '🤖', title: '自動化導入顧問', desc: '協助團隊評估與導入自動化測試框架，從工具選型到 CI 整合一條龍。' },
  { icon: '📐', title: '測試策略規劃', desc: '依產品特性設計測試金字塔與覆蓋率目標，讓品質投入有效率。' },
]

export default function Home() {
  const { posts } = usePosts()
  const { projects } = useProjects()

  return (
    <>
      <SEOHead />
      <Nav />
      <main>
        {/* Hero */}
        <div className="max-w-5xl mx-auto px-12 py-20 grid grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex gap-7 items-start">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden ring-2 ring-gray-100 ring-offset-2">
                <img src="/avatar.jpg" alt="Jimmy Hong" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
              </div>
              <div>
                <p className="text-xs tracking-widest text-gray-400 uppercase mb-1">QA Engineer / 品質架構師</p>
                <h1 className="text-3xl font-bold mb-1">Jimmy Hong</h1>
                <p className="text-sm text-gray-500 mb-4">打造讓團隊信任的 QA 系統</p>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  專注測試流程設計與品質架構。<br />
                  從流程標準化到自動化導入，<br />
                  讓品質成為開發文化，而不是最後一道關卡。
                </p>
                <div className="flex gap-2 flex-wrap mb-6">
                  {['測試策略', 'CI/CD 整合', '自動化框架', 'QA 流程設計'].map(t => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <a href="/projects" className="text-xs bg-gray-900 text-white px-5 py-2.5 rounded-md hover:bg-gray-700">看作品集</a>
                  <a href="/blog" className="text-xs text-gray-500 border-b border-gray-300 pb-px hover:text-gray-900">閱讀文章</a>
                  <div className="flex gap-2 ml-1">
                    <a href="https://github.com/" target="_blank" rel="noreferrer" className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 hover:border-gray-400">gh</a>
                    <a href="https://linkedin.com/" target="_blank" rel="noreferrer" className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 hover:border-gray-400">in</a>
                    <a href="mailto:your@email.com" className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 hover:border-gray-400">✉</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Services card */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-7">
            <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">Services</p>
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {SERVICES.map(s => (
                <div key={s.title} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-lg mb-1">{s.icon}</div>
                  <div className="text-xs text-gray-600">{s.title}</div>
                </div>
              ))}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-lg mb-1">📊</div>
                <div className="text-xs text-gray-600">品質指標設計</div>
              </div>
            </div>
            <div className="flex gap-2">
              {[['3+', '年 QA 經驗'], ['10+', '專案'], ['5+', '文章']].map(([n, l]) => (
                <div key={l} className="flex-1 bg-gray-100 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold">{n}</div>
                  <div className="text-xs text-gray-400">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-gray-100 mx-12" />

        {/* Featured projects */}
        <section className="max-w-5xl mx-auto px-12 py-16">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">精選作品</p>
          <h2 className="text-xl font-bold mb-8">QA 作品集</h2>
          <div className="grid grid-cols-3 gap-5">
            {projects.slice(0, 3).map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        </section>

        <hr className="border-gray-100 mx-12" />

        {/* Recent posts */}
        <section className="max-w-5xl mx-auto px-12 py-16">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">近期文章</p>
          <h2 className="text-xl font-bold mb-2">部落格</h2>
          <div>
            {posts.slice(0, 3).map(p => <BlogRow key={p.id} post={p} />)}
          </div>
        </section>

        <hr className="border-gray-100 mx-12" />

        {/* Services */}
        <section className="max-w-5xl mx-auto px-12 py-16">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">合作方式</p>
          <h2 className="text-xl font-bold mb-8">Services</h2>
          <div className="grid grid-cols-3 gap-4">
            {SERVICES.map(s => (
              <div key={s.title} className="border border-gray-200 rounded-xl p-6">
                <div className="text-2xl mb-3">{s.icon}</div>
                <h3 className="text-sm font-semibold mb-2">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
