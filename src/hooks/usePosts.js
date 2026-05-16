import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePosts(tag = null) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setError(null)

    let query = supabase
      .from('posts')
      .select('id, title, slug, excerpt, tags, published_at')
      .eq('published', true)

    if (tag) {
      query = query.contains('tags', [tag])
    }

    query.order('published_at', { ascending: false }).then(({ data, error }) => {
      if (cancelled) return
      if (error) setError(error.message)
      else setPosts(data ?? [])
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [tag])

  return { posts, loading, error }
}
