import { useState, useMemo } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import ProjectCard from '../components/ProjectCard'
import TagFilter from '../components/TagFilter'
import { useProjects } from '../hooks/useProjects'

export default function Projects() {
  const [selectedTag, setSelectedTag] = useState(null)
  const { projects, loading } = useProjects()

  const allTags = useMemo(() => {
    const set = new Set(projects.flatMap(p => p.tags ?? []))
    return [...set]
  }, [projects])

  const filtered = selectedTag
    ? projects.filter(p => p.tags?.includes(selectedTag))
    : projects

  return (
    <>
      <SEOHead title="QA 作品集" description="Jimmy Hong 的 QA 工程實務作品集，涵蓋自動化測試框架、CI/CD 整合、測試策略設計與品質流程改善。" canonical="/projects" />
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-12 py-16">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">Portfolio</p>
        <h1 className="text-xl font-bold mb-4">QA 作品集</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-2xl">
          這裡收錄我在 QA 工程實務中做過的專案，涵蓋自動化測試框架、CI/CD 整合、測試策略設計與品質流程改善。每個專案都反映了我在不同情境下如何思考測試問題、選擇工具，並推動落地。
        </p>
        <TagFilter tags={allTags} selected={selectedTag} onSelect={setSelectedTag} />
        {loading ? (
          <p className="text-sm text-gray-400">載入中…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
        <div className="mt-16 pt-10 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500 mb-3">有測試需求或想交流？</p>
          <a
            href="https://www.linkedin.com/in/jimmy-hong-qa"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm border border-gray-300 px-5 py-2 rounded-lg hover:border-gray-500 transition-colors"
          >
            LinkedIn 聯絡我 →
          </a>
        </div>
      </main>
      <Footer />
    </>
  )
}
