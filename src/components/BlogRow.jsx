import { Link } from 'react-router-dom'

export default function BlogRow({ post }) {
  const date = post.published_at
    ? new Date(post.published_at).toISOString().slice(0, 10)
    : ''

  const readingMin = post.content
    ? Math.max(1, Math.ceil(post.content.replace(/\s/g, '').length / 400))
    : null

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="flex items-baseline justify-between py-4 border-b border-gray-100 hover:text-gray-900 group"
    >
      <div className="flex gap-4 items-baseline">
        <span className="text-xs text-gray-400 min-w-[80px]">{date}</span>
        <span className="text-sm text-gray-600 group-hover:text-gray-900">{post.title}</span>
      </div>
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        {readingMin && (
          <span className="text-xs text-gray-300 hidden sm:inline">{readingMin} 分</span>
        )}
        <div className="flex gap-1">
          {(post.tags ?? []).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
