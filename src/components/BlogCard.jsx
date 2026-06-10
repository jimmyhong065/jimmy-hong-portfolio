import { Link } from 'react-router-dom'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { getArticleImage } from '../lib/articleImages'

export default function BlogCard({ post, isRead = false }) {
  const { settings } = useSiteSettings()
  const date = post.published_at ? post.published_at.slice(0, 10) : ''
  const tags = (post.tags ?? []).slice(0, 3)
  const thumb = getArticleImage(post.tags ?? [])

  const decorClass =
    settings.card_style === 'bordered' ? 'border border-gray-200 shadow-none hover:border-gray-400' :
    settings.card_style === 'minimal'  ? 'border border-transparent shadow-none' :
    'border border-gray-100 shadow-sm hover:shadow-md'

  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`flex gap-3 rounded-2xl ${decorClass} p-4 mb-3 transition-all hover:-translate-y-0.5 relative${isRead ? ' opacity-60' : ''}`}
    >
      <div className="flex-1 min-w-0">
        {isRead && (
          <span className="absolute top-3 right-3 text-[10px] text-gray-400">✓</span>
        )}
        {tags.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {tags.map(tag => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">{post.title}</p>
        {post.excerpt && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
        )}
        {date && <p className="text-xs text-gray-400">{date}</p>}
      </div>
      <img
        src={thumb}
        alt=""
        className="w-14 h-14 object-contain flex-shrink-0 self-center -rotate-2 drop-shadow-sm"
        loading="lazy"
      />
    </Link>
  )
}
