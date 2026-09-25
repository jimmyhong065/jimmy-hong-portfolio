import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { summarizeSeries } from '../lib/series'

// 已發布、且至少有一篇已發布章節的系列（依 display_order）
export function useSeries() {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      supabase.from('courses')
        .select('id, slug, title, subtitle, description, cover_url, display_order')
        .eq('published', true)
        .order('display_order'),
      supabase.from('posts')
        .select('course_id, tags')
        .eq('published', true)
        .not('course_id', 'is', null),
    ]).then(([courses, chapters]) => {
      if (cancelled) return
      setSeries(summarizeSeries(courses.data, chapters.data))
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [])

  return { series, loading }
}
