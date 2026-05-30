// src/components/RelatedPosts.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RelatedPosts({ currentSlug, tags }) {
  const [related, setRelated] = useState([])

  useEffect(() => {
    if (!tags?.length) return
    supabase
      .from('posts')
      .select('id, title, slug, tags, excerpt')
      .eq('published', true)
      .neq('slug', currentSlug)
      .then(({ data }) => {
        if (!data) return
        const scored = data
          .map(p => ({
            ...p,
            score: (p.tags ?? []).filter(t => tags.includes(t)).length,
          }))
          .filter(p => p.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
        setRelated(scored)
      })
  }, [currentSlug, tags])

  if (!related.length) return null

  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      <h2 className="text-sm font-semibold mb-6 text-gray-700">相關文章</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {related.map(p => (
          <Link
            key={p.id}
            to={`/blog/${p.slug}`}
            className="block p-4 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors"
          >
            <p className="text-sm font-medium mb-2 line-clamp-2 text-gray-900">{p.title}</p>
            <div className="flex gap-1 flex-wrap mb-2">
              {(p.tags ?? []).slice(0, 2).map(t => (
                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 line-clamp-2">{p.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
