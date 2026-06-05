import { useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useInfiniteRead(initialTags, initialSlug) {
  const seenSlugs = useRef(new Set([initialSlug]))
  const loadingRef = useRef(false)

  async function fetchNext() {
    if (loadingRef.current || !initialTags?.length) return null
    loadingRef.current = true
    try {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
      if (!data) return null
      const next = data
        .filter(p => !seenSlugs.current.has(p.slug))
        .map(p => ({
          ...p,
          _score: (p.tags ?? []).filter(t => initialTags.includes(t)).length,
        }))
        .filter(p => p._score > 0)
        .sort((a, b) => b._score - a._score)[0] ?? null
      if (next) seenSlugs.current.add(next.slug)
      return next
    } finally {
      loadingRef.current = false
    }
  }

  return { fetchNext }
}
