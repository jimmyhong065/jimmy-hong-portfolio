import { useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { mfaDestination, safeAdminReturnTo } from '../lib/mfa'
import SEOHead from '../components/SEOHead'

const SECURITY_ERROR = '無法確認登入安全狀態，請稍後再試'

export default function MfaVerify() {
  const { session, currentLevel, verifiedFactors, authReady, refreshAuth, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const returnTo = safeAdminReturnTo(new URLSearchParams(location.search).get('returnTo'))
  const [selectedFactorId, setSelectedFactorId] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const busy = useRef(false)
  const factorId = verifiedFactors.some(factor => factor.id === selectedFactorId)
    ? selectedFactorId : verifiedFactors[0]?.id

  async function handleSubmit(event) {
    event.preventDefault()
    if (busy.current) return
    if (!session || !factorId) {
      setError(SECURITY_ERROR)
      return
    }
    if (!/^[0-9]{6}$/.test(code)) {
      setError('請輸入六位數驗證碼')
      return
    }
    busy.current = true
    setLoading(true)
    setError(null)
    try {
      let result
      try {
        result = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
      } catch {
        setError('驗證碼錯誤或已過期，請輸入目前顯示的代碼')
        return
      } finally {
        setCode('')
      }
      if (result.error) {
        setError('驗證碼錯誤或已過期，請輸入目前顯示的代碼')
        return
      }
      try {
        const next = await refreshAuth()
        if (!next?.session) throw new Error('Missing session')
        navigate(mfaDestination({ ...next, returnTo }), { replace: true })
      } catch {
        setError(SECURITY_ERROR)
      }
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  async function handleSignOut() {
    if (busy.current) return
    busy.current = true
    setLoading(true)
    setError(null)
    try {
      const result = await signOut()
      if (result?.error) throw result.error
      navigate('/login', { replace: true })
    } catch {
      setError(SECURITY_ERROR)
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  if (!authReady) return <div className="min-h-screen bg-gray-50" />
  // Refresh may clear context factors on failure; keep the error here for retry/sign-out.
  if (!loading && error !== SECURITY_ERROR && (!session || verifiedFactors.length === 0 || currentLevel === 'aal2')) {
    return <Navigate to={mfaDestination({ session, currentLevel, verifiedFactors, returnTo })} replace />
  }

  return (
    <>
      <SEOHead title="雙重驗證" noindex />
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-8">
          <h1 className="text-lg font-bold mb-2">雙重驗證</h1>
          <p className="text-sm text-gray-500 mb-6">開啟驗證器，輸入目前顯示的六位數驗證碼。</p>
          <form onSubmit={handleSubmit}>
            {verifiedFactors.length > 1 && <div className="mb-4">
              <label htmlFor="mfa-factor" className="block text-sm mb-2">驗證器</label>
              <select id="mfa-factor" value={factorId} disabled={loading} onChange={event => setSelectedFactorId(event.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5">
                {verifiedFactors.map((factor, index) => <option key={factor.id} value={factor.id}>{factor.friendly_name || `驗證器 ${index + 1}`}</option>)}
              </select>
            </div>}
            <label htmlFor="mfa-code" className="block text-sm mb-2">六位數驗證碼</label>
            <input id="mfa-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} disabled={loading} onChange={event => setCode(event.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 mb-3 focus:outline-none focus:border-gray-400" />
            {error && <p role="alert" className="text-xs text-red-500 mb-3">{error}</p>}
            <button type="submit" disabled={loading} aria-busy={loading} className="w-full text-sm bg-gray-900 text-white py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">驗證</button>
          </form>
          <button type="button" onClick={handleSignOut} disabled={loading} className="w-full text-sm text-gray-500 mt-4 disabled:opacity-50">登出</button>
        </div>
      </div>
    </>
  )
}
