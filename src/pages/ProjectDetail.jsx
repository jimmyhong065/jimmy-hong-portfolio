import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import MarkdownContent from '../components/MarkdownContent'
import { supabase } from '../lib/supabase'

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProject(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return <><Nav /><div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">載入中…</div><Footer /></>
  if (!project) return <><Nav /><div className="max-w-3xl mx-auto px-12 py-16 text-sm text-gray-400">找不到此作品。</div><Footer /></>

  return (
    <>
      <SEOHead title={project.title} description={project.description} />
      <Nav />
      <main className="max-w-3xl mx-auto px-12 py-16">
        {project.cover_url && (
          <img src={project.cover_url} alt={project.title} className="w-full rounded-xl mb-8 border border-gray-100" />
        )}
        <div className="flex gap-2 flex-wrap mb-3">
          {(project.tags ?? []).map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
        <h1 className="text-2xl font-bold mb-4">{project.title}</h1>
        {project.links && Object.entries(project.links).length > 0 && (
          <div className="flex gap-3 mb-8">
            {project.links.github && <a href={project.links.github} target="_blank" rel="noreferrer" className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">GitHub →</a>}
            {project.links.demo && <a href={project.links.demo} target="_blank" rel="noreferrer" className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:border-gray-400">Demo →</a>}
          </div>
        )}
        <MarkdownContent content={project.content} />
        <div className="mt-12">
          <Link to="/projects" className="text-xs text-gray-400 hover:text-gray-700">← 回作品集</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
