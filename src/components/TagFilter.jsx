export default function TagFilter({ tags, selected, onSelect }) {
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex gap-2 flex-wrap mb-8">
      <button
        onClick={() => onSelect(null)}
        className={`text-xs px-4 py-1.5 rounded-md border transition-colors ${
          selected === null
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
        }`}
      >
        全部
      </button>
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => onSelect(tag)}
          className={`text-xs px-4 py-1.5 rounded-md border transition-colors ${
            selected === tag
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
