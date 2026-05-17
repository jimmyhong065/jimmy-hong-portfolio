import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePhotoProjects(tag = null) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setError(null)

    let query = supabase
      .from('photo_projects')
      .select('id, title, description, tags, cover_url, display_order')

    if (tag) {
      query = query.contains('tags', [tag])
    }

    query.order('display_order', { ascending: true }).then(({ data, error }) => {
      if (cancelled) return
      if (error) setError(error.message)
      else setProjects(data ?? [])
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [tag])

  return { projects, loading, error }
}
