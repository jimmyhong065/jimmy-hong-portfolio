import { useState, useMemo } from 'react'
import rawDrafts from '../../assets/linkedin-drafts.md?raw'

function parseDrafts(raw) {
  const sections = raw.split(/\n---\n/).filter(s => s.trim())
  const drafts = []
  for (const section of sections) {
    const lines = section.trim().split('\n')
    const headerLine = lines.find(l => /^## \d+｜/.test(l))
    if (!headerLine) continue
    const match = headerLine.match(/^## (\d+)｜(.+)$/)
    if (!match) continue
    const num = parseInt(match[1])
    const title = match[2].trim()
    const contentLines = lines.filter(l => l !== headerLine)
    const content = contentLines.join('\n').trim()
    drafts.push({ num, title, content })
  }
  return drafts.sort((a, b) => a.num - b.num)
}

const STORAGE_KEY = 'linkedin_posted'

function getPosted() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) }
  catch { return new Set() }
}

function savePosted(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export default function AdminLinkedIn() {
  const drafts = useMemo(() => parseDrafts(rawDrafts), [])
  const [posted, setPosted] = useState(() => getPosted())
  const [copied, setCopied] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  function togglePosted(num) {
    setPosted(prev => {
      const next = new Set(prev)
      next.has(num) ? next.delete(num) : next.add(num)
      savePosted(next)
      return next
    })
  }

  function copyDraft(draft) {
    navigator.clipboard.writeText(draft.content)
    setCopied(draft.num)
    setTimeout(() => setCopied(null), 2000)
  }

  const visible = drafts.filter(d => {
    const matchFilter = filter === 'all' ? true : filter === 'posted' ? posted.has(d.num) : !posted.has(d.num)
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const postedCount = drafts.filter(d => posted.has(d.num)).length

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-lg font-bold">LinkedIn 草稿</h1>
        <span className="text-xs text-gray-500">
          已發布 <strong className="text-green-600">{postedCount}</strong> / {drafts.length} 篇
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all"
          style={{ width: `${(postedCount / drafts.length) * 100}%` }}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="搜尋標題…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[160px] focus:outline-none focus:border-gray-400"
        />
        <div className="flex gap-1">
          {[['all', '全部'], ['pending', '待發布'], ['posted', '已發布']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                filter === val ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:border-gray-400'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {visible.map(draft => {
          const isPosted = posted.has(draft.num)
          const isExpanded = expanded === draft.num
          return (
            <div key={draft.num}
              className={`border rounded-xl overflow-hidden transition-colors ${
                isPosted ? 'border-green-100 bg-green-50/30' : 'border-gray-200'
              }`}>
              {/* Header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs text-gray-400 w-6 shrink-0">#{draft.num}</span>
                <span
                  className={`flex-1 text-sm font-medium cursor-pointer hover:text-blue-600 ${
                    isPosted ? 'text-gray-400 line-through' : 'text-gray-800'
                  }`}
                  onClick={() => setExpanded(isExpanded ? null : draft.num)}
                >
                  {draft.title}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyDraft(draft)}
                    className="text-xs border border-gray-200 px-3 py-1 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    {copied === draft.num ? '✓ 已複製' : '複製'}
                  </button>
                  <button
                    onClick={() => togglePosted(draft.num)}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                      isPosted
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'border border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {isPosted ? '已發布' : '標記已發'}
                  </button>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : draft.num)}
                    className="text-gray-400 hover:text-gray-600 text-xs px-1"
                  >
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 py-4 bg-white">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {draft.content}
                  </pre>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => copyDraft(draft)}
                      className="text-xs bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700"
                    >
                      {copied === draft.num ? '✓ 已複製' : '複製全文'}
                    </button>
                    <a
                      href="https://www.linkedin.com/post/new/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs border border-gray-200 px-4 py-1.5 rounded-lg hover:border-gray-400"
                    >
                      開啟 LinkedIn ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {visible.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-400">
            沒有符合條件的草稿
          </div>
        )}
      </div>
    </div>
  )
}
