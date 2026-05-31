import { useState, useEffect, useRef, useCallback } from 'react'
import { useUpload } from '../../hooks/useUpload'

const SECRET = import.meta.env.VITE_UPLOAD_SECRET

async function r2List(cursor) {
  const url = cursor ? `/r2-manage?cursor=${cursor}` : '/r2-manage'
  const res = await fetch(url, { headers: { Authorization: `Bearer ${SECRET}` } })
  return res.json()
}

async function r2Delete(key) {
  const res = await fetch('/r2-manage', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  })
  return res.json()
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function AdminPhotos() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [view, setView] = useState('grid')
  const fileInputRef = useRef()
  const { uploading, uploadError, uploadMany } = useUpload()

  const load = useCallback(async (nextCursor = null) => {
    setLoading(true)
    const data = await r2List(nextCursor)
    setFiles(prev => nextCursor ? [...prev, ...(data.files ?? [])] : (data.files ?? []))
    setHasMore(data.truncated ?? false)
    setCursor(data.cursor ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleUpload(e) {
    const selected = Array.from(e.target.files)
    if (!selected.length) return
    const newUrls = []
    await uploadMany(selected, url => newUrls.push(url), () => {})
    e.target.value = ''
    load()
  }

  async function handleDelete(file) {
    if (!confirm(`確定刪除 ${file.key}？`)) return
    setDeleting(file.key)
    await r2Delete(file.key)
    setFiles(prev => prev.filter(f => f.key !== file.key))
    setDeleting(null)
  }

  async function handleCopy(url) {
    await navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = files.filter(f =>
    !search || f.key.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-bold">相簿管理</h1>
          <p className="text-xs text-gray-400 mt-0.5">R2 儲存空間 · {files.length} 張圖片</p>
        </div>
        <button onClick={() => fileInputRef.current.click()} disabled={uploading}
          className="text-xs bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50">
          {uploading ? '上傳中…' : '+ 上傳圖片'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
      </div>

      {uploadError && <p className="text-xs text-red-500 mb-4">{uploadError}</p>}

      {/* Toolbar */}
      <div className="flex gap-2 mb-4">
        <input type="text" placeholder="🔍 搜尋檔名…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 flex-1" />
        <button onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')}
          className="text-xs border border-gray-200 px-3 py-2 rounded-lg hover:border-gray-400">
          {view === 'grid' ? '≡ 列表' : '⊞ 格狀'}
        </button>
      </div>

      {loading && files.length === 0 ? (
        <p className="text-sm text-gray-400">載入中…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">沒有圖片</p>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(f => (
            <div key={f.key} className="group relative border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
              <div className="aspect-square overflow-hidden">
                <img src={f.url} alt={f.key} loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end gap-1">
                  <button onClick={() => handleCopy(f.url)}
                    className="text-xs bg-white/90 text-gray-800 px-2 py-1 rounded hover:bg-white">
                    {copied === f.url ? '✓' : '複製'}
                  </button>
                  <button onClick={() => handleDelete(f)} disabled={deleting === f.key}
                    className="text-xs bg-red-500/90 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50">
                    {deleting === f.key ? '…' : '刪除'}
                  </button>
                </div>
                <div>
                  <p className="text-xs text-white/90 truncate">{f.key}</p>
                  <p className="text-xs text-white/60">{formatSize(f.size)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">預覽</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">檔名</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">大小</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">日期</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.key} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <img src={f.url} alt={f.key} className="w-10 h-10 object-cover rounded" loading="lazy" />
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600 max-w-xs truncate">{f.key}</td>
                  <td className="px-4 py-2 text-xs text-gray-400">{formatSize(f.size)}</td>
                  <td className="px-4 py-2 text-xs text-gray-400">
                    {f.uploaded ? new Date(f.uploaded).toISOString().slice(0, 10) : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button onClick={() => handleCopy(f.url)}
                        className="text-xs border border-gray-200 px-2 py-1 rounded hover:border-gray-400">
                        {copied === f.url ? '✓ 已複製' : '複製 URL'}
                      </button>
                      <button onClick={() => handleDelete(f)} disabled={deleting === f.key}
                        className="text-xs border border-red-100 text-red-500 px-2 py-1 rounded hover:border-red-300 disabled:opacity-50">
                        {deleting === f.key ? '刪除中…' : '刪除'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <div className="mt-6 text-center">
          <button onClick={() => load(cursor)} disabled={loading}
            className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400 disabled:opacity-50">
            {loading ? '載入中…' : '載入更多'}
          </button>
        </div>
      )}
    </div>
  )
}
