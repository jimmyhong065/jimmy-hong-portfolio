import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { REQUIRED_TOTP_FACTORS } from '../lib/mfa'
import { supabase } from '../lib/supabase'

const REMOVE_ERROR = '移除失敗，請確認登入驗證仍有效後再試'
const REFRESH_ERROR = '無法重新確認驗證器狀態，請重新載入安全狀態'

export default function MfaFactorManager() {
  const { verifiedFactors, refreshAuth } = useAuth()
  const [error, setError] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [refreshRequired, setRefreshRequired] = useState(false)
  const [removedIds, setRemovedIds] = useState(() => new Set())
  const busy = useRef(false)
  const visibleFactors = verifiedFactors.filter(factor => !removedIds.has(factor.id))
  const canRemove = visibleFactors.length > REQUIRED_TOTP_FACTORS && !refreshRequired

  async function removeFactor(factor) {
    if (busy.current || !canRemove || !window.confirm(`確定移除「${factor.friendly_name || factor.id}」？`)) return
    busy.current = true
    setRemoving(factor.id)
    setError(null)
    try {
      const result = await supabase.auth.mfa.unenroll({ factorId: factor.id })
      if (result?.error) {
        setError(REMOVE_ERROR)
        return
      }
      setRemovedIds(current => new Set([...current, factor.id]))
      setRefreshRequired(true)
      try {
        await refreshAuth()
        setRefreshRequired(false)
      } catch {
        setError(REFRESH_ERROR)
      }
    } catch {
      setError(REMOVE_ERROR)
    } finally {
      busy.current = false
      setRemoving(null)
    }
  }

  async function retryRefresh() {
    if (busy.current) return
    busy.current = true
    setRemoving('refresh')
    setError(null)
    try {
      await refreshAuth()
      setRefreshRequired(false)
    } catch {
      setError(REFRESH_ERROR)
    } finally {
      busy.current = false
      setRemoving(null)
    }
  }

  return (
    <section className="mt-10 border-t border-gray-200 pt-8" aria-labelledby="mfa-heading">
      <h2 id="mfa-heading" className="text-base font-bold">登入安全性</h2>
      <p className="text-xs text-gray-500 mt-1">後台要求兩個 TOTP 驗證器與 aal2 登入。</p>
      <ul className="mt-4 space-y-2">
        {visibleFactors.map(factor => (
          <li key={factor.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
            <span className="min-w-0 break-words text-sm">{factor.friendly_name || '未命名驗證器'}</span>
            <button
              type="button"
              aria-label={`移除 ${factor.friendly_name || factor.id}`}
              disabled={!canRemove || removing !== null}
              onClick={() => removeFactor(factor)}
              className="shrink-0 text-sm text-red-600 disabled:opacity-40"
            >移除</button>
          </li>
        ))}
      </ul>
      {visibleFactors.length <= REQUIRED_TOTP_FACTORS && <p className="text-xs text-amber-600 mt-3">請先新增並驗證替代裝置，再移除舊裝置。</p>}
      <p className="text-xs text-gray-400 mt-2">Supabase 不支援直接重新命名；請新增新 factor 後移除舊 factor。</p>
      {error && <p role="alert" className="text-xs text-red-500 mt-2">{error}</p>}
      {refreshRequired && <button type="button" onClick={retryRefresh} disabled={removing !== null} className="block text-sm underline mt-3 disabled:opacity-40">重新載入安全狀態</button>}
      <Link className="inline-block text-sm mt-4 underline" to="/mfa/setup?returnTo=%2Fadmin%2Fsettings">
        新增驗證器
      </Link>
    </section>
  )
}
