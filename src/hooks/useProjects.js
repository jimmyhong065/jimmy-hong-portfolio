import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProjects(tag = null) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let query = supabase
      .from('projects')
      .select('id, title, description, tags, cover_url, links, display_order')

    if (tag) {
      query = query.contains('tags', [tag])
    }

    query.order('display_order', { ascending: true }).then(({ data, error }) => {
      if (error) setError(error.message)
      else setProjects(data ?? [])
      setLoading(false)
    })
  }, [tag])

  return { projects, loading, error }
}
