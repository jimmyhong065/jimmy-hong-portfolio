import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminTags() {
  const [posts, setPosts] = useState([])
  const [scope, setScope] = useState('published') // published | all
  const [sortKey, setSortKey] = useState('count')  // count | name
  const [renameFrom, setRenameFrom] = useState('')
  const [renameTo, setRenameTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select('id, title, tags, published')
    setPosts(data ?? [])
  }
  useEffect(() => { fetchPosts() }, [])

  const scoped = useMemo(
    () => scope === 'published' ? posts.filter(p => p.published) : posts,
    [posts, scope]
  )

  const stats = useMemo(() => {
    const count = {}
    let tagInstances = 0
    scoped.forEach(p => (p.tags ?? []).forEach(t => {
      count[t] = (count[t] || 0) + 1
      tagInstances++
    }))
    const entries = Object.entries(count)
    const sorted = [...entries].sort((a, b) =>
      sortKey === 'name'
        ? a[0].localeCompare(b[0], 'zh-Hant')
        : b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hant')
    )
    const singletons = entries.filter(([, c]) => c === 1).length
    const max = entries.reduce((m, [, c]) => Math.max(m, c), 0)
    return {
      sorted, max,
      distinct: entries.length,
      singletons,
      posts: scoped.length,
      avg: scoped.length ? (tagInstances / scoped.length).toFixed(1) : '0',
    }
  }, [scoped, sortKey])

  const allTagNames = useMemo(
    () => [...new Set(posts.flatMap(p => p.tags ?? []))].sort((a, b) => a.localeCompare(b, 'zh-Hant')),
    [posts]
  )

  // rename/merge: every post carrying `from` gets it swapped to `to`, deduped.
  // if `to` already exists on a post, this merges them.
  async function handleRename() {
    const from = renameFrom.trim()
    const to = renameTo.trim()
    if (!from || !to || from === to) return
    const affected = posts.filter(p => (p.tags ?? []).includes(from))
    if (!affected.length) { setMsg(`沒有文章使用「${from}」`); return }
    const verb = allTagNames.includes(to) ? `合併到既有的「${to}」` : `重新命名為「${to}」`
    if (!confirm(`將「${from}」${verb}，影響 ${affected.length} 篇文章。確定？`)) return
    setBusy(true)
    await Promise.all(affected.map(p => {
      const tags = [...new Set((p.tags ?? []).map(t => t === from ? to : t))]
      return supabase.from('posts').update({ tags }).eq('id', p.id)
    }))
    setBusy(false)
    setMsg(`✅ 已將「${from}」${verb}（${affected.length} 篇）`)
    setRenameFrom(''); setRenameTo('')
    fetchPosts()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-lg font-bold">標籤總覽</h1>
        <div className="flex gap-1">
          {[['published', '已發布'], ['all', '全部']].map(([val, label]) => (
            <button key={val} onClick={() => setScope(val)}
              className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                scope === val ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:border-gray-400'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          ['文章數', stats.posts, 'text-gray-900'],
          ['不同標籤', stats.distinct, 'text-gray-900'],
          ['只用一次', stats.singletons, stats.singletons > stats.distinct * 0.4 ? 'text-red-500' : 'text-gray-900'],
          ['平均每篇', stats.avg, 'text-gray-900'],
        ].map(([label, val, color]) => (
          <div key={label} className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{val}</div>
          </div>
        ))}
      </div>

      {stats.singletons > stats.distinct * 0.4 && (
        <div className="mb-5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          ⚠️ {stats.singletons} 個標籤只用過一次（佔 {Math.round(stats.singletons / stats.distinct * 100)}%）——
          標籤過於零散，建議用下方工具合併同義標籤。
        </div>
      )}

      {/* Rename / merge tool */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="text-sm font-medium mb-2">合併 / 重新命名標籤</div>
        <div className="flex gap-2 items-center flex-wrap">
          <select value={renameFrom} onChange={e => setRenameFrom(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-gray-400 min-w-[140px]">
            <option value="">選擇來源標籤…</option>
            {allTagNames.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="text-gray-400 text-sm">→</span>
          <input list="tag-targets" value={renameTo} onChange={e => setRenameTo(e.target.value)}
            placeholder="目標標籤（可選既有或打新的）"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-gray-400 flex-1 min-w-[180px]" />
          <datalist id="tag-targets">
            {allTagNames.map(t => <option key={t} value={t} />)}
          </datalist>
          <button onClick={handleRename} disabled={busy || !renameFrom || !renameTo}
            className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-40">
            {busy ? '處理中…' : '套用'}
          </button>
        </div>
        {msg && <div className="text-xs text-gray-600 mt-2">{msg}</div>}
      </div>

      {/* Bar chart */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">標籤分布（{scope === 'published' ? '已發布' : '全部'}）</span>
        <div className="flex gap-1">
          {[['count', '依數量'], ['name', '依名稱']].map(([val, label]) => (
            <button key={val} onClick={() => setSortKey(val)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                sortKey === val ? 'bg-gray-200 text-gray-800' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-1.5">
        {stats.sorted.map(([tag, count]) => (
          <div key={tag} className="flex items-center gap-3 text-sm">
            <button
              onClick={() => setRenameFrom(tag)}
              title="點擊填入合併工具"
              className="w-32 shrink-0 truncate text-right text-xs text-gray-600 hover:text-indigo-600 hover:underline">
              {tag}
            </button>
            <div className="flex-1 bg-gray-50 rounded h-5 overflow-hidden">
              <div
                className={`h-full rounded ${count === 1 ? 'bg-red-200' : 'bg-indigo-400'}`}
                style={{ width: `${Math.max((count / stats.max) * 100, 4)}%` }}
              />
            </div>
            <span className={`w-8 shrink-0 text-xs tabular-nums ${count === 1 ? 'text-red-400' : 'text-gray-500'}`}>
              {count}
            </span>
          </div>
        ))}
        {stats.sorted.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-8">沒有標籤</div>
        )}
      </div>
    </div>
  )
}
