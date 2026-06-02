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
      className="flex flex-col md:flex-row md:items-baseline md:justify-between py-4 border-b border-gray-100 hover:text-gray-900 group"
    >
      {/* 標題行：手機上標題在上，桌面靠左 */}
      <div className="flex flex-col md:flex-row md:gap-4 md:items-baseline min-w-0">
        <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900 leading-snug">{post.title}</span>
        <span className="text-xs text-gray-400 mt-0.5 md:mt-0 md:min-w-[80px]">{date}</span>
      </div>
      {/* Tags：手機靠左下方，桌面靠右 */}
      <div className="flex items-center gap-2 mt-2 md:mt-0 md:ml-4 flex-shrink-0">
        {readingMin && (
          <span className="text-xs text-gray-300 hidden sm:inline">{readingMin} 分</span>
        )}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {(post.tags ?? []).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex-shrink-0">{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
