import { useState, useRef } from 'react'

export default function KeywordInput({ value, onChange }) {
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const tags = value
    ? value.split(',').map(t => t.trim()).filter(Boolean)
    : []

  function commit(raw) {
    const word = raw.trim()
    if (!word || tags.includes(word)) { setInput(''); return }
    onChange([...tags, word].join(', '))
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit(input)
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1).join(', '))
    }
  }

  function remove(tag) {
    onChange(tags.filter(t => t !== tag).join(', '))
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 min-h-[42px] border border-gray-200 rounded-lg px-3 py-2 cursor-text focus-within:border-gray-400 transition-colors"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
          {tag}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); remove(tag) }}
            className="text-gray-400 hover:text-gray-700 leading-none"
            aria-label={`移除 ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input.trim() && commit(input)}
        placeholder={tags.length === 0 ? '輸入關鍵字，按 Enter 或逗號新增' : ''}
        className="flex-1 min-w-[140px] text-sm outline-none bg-transparent py-0.5"
      />
    </div>
  )
}
