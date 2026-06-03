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
      <SEOHead title="QA 作品集" description="Jimmy Hong 的 QA 專案作品集，涵蓋自動化測試、流程設計、品質儀表板。" canonical="/projects" />
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-12 py-16">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">Portfolio</p>
        <h1 className="text-xl font-bold mb-8">QA 作品集</h1>
        <TagFilter tags={allTags} selected={selectedTag} onSelect={setSelectedTag} />
        {loading ? (
          <p className="text-sm text-gray-400">載入中…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
