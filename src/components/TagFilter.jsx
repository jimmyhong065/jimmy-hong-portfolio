export default function TagFilter({ tags, selected, onSelect, specialFilter = null, onSpecialFilter = () => {} }) {
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
        <button
          onClick={() => { onSelect(null); onSpecialFilter(null) }}
          className={btnClass(selected === null && specialFilter === null)}
        >
          全部
        </button>
        <button
          onClick={() => { onSpecialFilter('unread'); onSelect(null) }}
          className={btnClass(specialFilter === 'unread')}
        >
          未讀
        </button>
        <button
          onClick={() => { onSpecialFilter('saved'); onSelect(null) }}
          className={btnClass(specialFilter === 'saved')}
        >
          收藏
        </button>
        <span className="flex-shrink-0 self-center text-gray-300 px-1 select-none">|</span>
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => { onSelect(tag); onSpecialFilter(null) }}
            className={btnClass(selected === tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}
