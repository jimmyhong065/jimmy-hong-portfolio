import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TAG_EMOJI = [
  [['CI/CD', 'Actions', 'GitHub', 'github'], '⚙️'],
  [['Appium', '行動', 'mobile', 'Mobile'], '📱'],
  [['pytest', 'Python', 'BDD'], '🐍'],
  [['k6', '效能', 'performance', 'Performance'], '⚡'],
  [['測試工具', '測試框架', 'Playwright', 'Selenium'], '🧪'],
  [['職涯', '軟技能', '溝通', '協作'], '💼'],
  [['AI', 'LLM', '人工智慧'], '🤖'],
]

function getEmoji(tags = []) {
  for (const [keywords, emoji] of TAG_EMOJI) {
    if (tags.some(t => keywords.some(k => t.includes(k)))) return emoji
  }
  return '📄'
}

export default function RelatedPosts({ currentSlug, tags }) {
  const [related, setRelated] = useState([])

  useEffect(() => {
    if (!tags?.length) return
    supabase
      .from('posts')
      .select('id, title, slug, tags')
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
      <h2 className="text-sm font-semibold mb-4 text-gray-700">你可能也感興趣</h2>
      <div className="flex flex-col gap-3">
        {related.map(p => (
          <Link
            key={p.id}
            to={`/blog/${p.slug}`}
            className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors"
          >
            <span className="text-xl leading-none mt-0.5 flex-shrink-0">{getEmoji(p.tags)}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium line-clamp-2 text-gray-900 mb-1">{p.title}</p>
              <div className="flex gap-1 flex-wrap">
                {(p.tags ?? []).slice(0, 2).map(t => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
