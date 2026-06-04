import { Link } from 'react-router-dom'

export default function BlogCard({ post }) {
  const date = post.published_at ? post.published_at.slice(0, 10) : ''
  const tags = (post.tags ?? []).slice(0, 3)

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="block rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 hover:shadow-md transition-shadow"
    >
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
    </Link>
  )
}
