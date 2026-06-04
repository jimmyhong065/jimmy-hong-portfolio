export default function TagFilter({ tags, selected, onSelect }) {
  if (!tags || tags.length === 0) return null

  const btnClass = (active) =>
    `flex-shrink-0 text-xs px-4 py-1.5 rounded-full border transition-colors ${
      active
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
    }`

  return (
    <div className="relative mb-8">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 px-1">
        <button onClick={() => onSelect(null)} className={btnClass(selected === null)}>
          全部
        </button>
        {tags.map(tag => (
          <button key={tag} onClick={() => onSelect(tag)} className={btnClass(selected === tag)}>
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}
