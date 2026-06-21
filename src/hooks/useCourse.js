import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCourse(slug, { preview = false } = {}) {
  const [course, setCourse] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)

    async function load() {
      const { data: courseRow } = await supabase
        .from('courses').select('*').eq('slug', slug).single()
      if (cancelled) return

      if (!courseRow || (!preview && !courseRow.published)) {
        setCourse(null)
        setChapters([])
        setNotFound(true)
        setLoading(false)
        return
      }

      let q = supabase
        .from('posts')
        .select('id, title, slug, course_order, cover_url, published')
        .eq('course_id', courseRow.id)
      if (!preview) q = q.eq('published', true)
      const { data: chapterRows } = await q.order('course_order')
      if (cancelled) return

      setCourse(courseRow)
      setChapters(chapterRows ?? [])
      setNotFound(false)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [slug, preview])

  return { course, chapters, loading, notFound }
}

export function adjacentChapters(chapters, slug) {
  const i = chapters.findIndex(c => c.slug === slug)
  if (i === -1) return { prev: null, next: null }
  return {
    prev: i > 0 ? chapters[i - 1] : null,
    next: i < chapters.length - 1 ? chapters[i + 1] : null,
  }
}
