import { useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { mfaDestination, REQUIRED_TOTP_FACTORS, safeAdminReturnTo } from '../lib/mfa'
import SEOHead from '../components/SEOHead'

const SECURITY_ERROR = '無法確認登入安全狀態，請稍後再試'

export default function MfaSetup() {
  const { session, currentLevel, verifiedFactors, authReady, authError, refreshAuth, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const returnTo = safeAdminReturnTo(new URLSearchParams(location.search).get('returnTo'))
  const [friendlyName, setFriendlyName] = useState('')
  const [enrollment, setEnrollment] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [recoveryRequired, setRecoveryRequired] = useState(false)
  const busy = useRef(false)

  async function refreshSecurity() {
    try {
      const next = await refreshAuth()
      if (!next?.session) throw new Error('Missing session')
      setRecoveryRequired(false)
      setError(null)
      if (next.currentLevel !== 'aal2' || next.verifiedFactors.length >= REQUIRED_TOTP_FACTORS) {
        navigate(mfaDestination({ ...next, returnTo }), { replace: true })
      } else {
        setNotice(`還需要再新增 ${REQUIRED_TOTP_FACTORS - next.verifiedFactors.length} 個備援驗證器`)
      }
    } catch {
      setRecoveryRequired(true)
      setError(SECURITY_ERROR)
    }
  }

  async function startEnrollment(event) {
    event.preventDefault()
    if (busy.current || !session || recoveryRequired || authError) return
    const name = friendlyName.trim()
    if (!name) return setError('請輸入驗證器名稱')
    if (verifiedFactors.some(factor => factor.friendly_name === name)) return setError('驗證器名稱不可重複')
    busy.current = true
    setLoading(true)
    setError(null)
    setNotice(null)
    let failure = '無法讀取驗證器，請稍後再試'
    try {
      const listed = await supabase.auth.mfa.listFactors()
      if (listed.error) throw listed.error
      if (listed.data.all.some(factor => factor.factor_type === 'totp' && factor.status === 'verified' && factor.friendly_name === name)) {
        setError('驗證器名稱不可重複')
        return
      }
      failure = '無法清理未完成的設定，請稍後再試'
      for (const factor of listed.data.all.filter(factor => factor.factor_type === 'totp' && factor.status === 'unverified')) {
        const removed = await supabase.auth.mfa.unenroll({ factorId: factor.id })
        if (removed.error) throw removed.error
      }
      failure = '無法產生驗證器設定，請稍後再試'
      const result = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: name, issuer: 'QA Lens' })
      if (result.error || !result.data?.id || !result.data?.totp?.qr_code || !result.data?.totp?.secret) throw new Error('Enrollment unavailable')
      setEnrollment(result.data)
    } catch {
      setError(failure)
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  async function verifyEnrollment(event) {
    event.preventDefault()
    if (busy.current || !session || !enrollment || recoveryRequired) return
    if (!/^[0-9]{6}$/.test(code)) return setError('請輸入六位數驗證碼')
    busy.current = true
    setLoading(true)
    setError(null)
    try {
      let result
      try {
        result = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollment.id, code })
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
      setEnrollment(null)
      setFriendlyName('')
      await refreshSecurity()
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  async function retrySecurity() {
    if (busy.current) return
    busy.current = true
    setLoading(true)
    try {
      await refreshSecurity()
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  async function handleSignOut() {
    if (busy.current) return
    busy.current = true
    setLoading(true)
    setEnrollment(null)
    setCode('')
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

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(enrollment.totp.secret)
      setNotice('已複製設定金鑰，完成後請清除剪貼簿')
    } catch {
      setError('無法複製，請手動輸入設定金鑰')
    }
  }

  if (!authReady && !loading) return <div className="min-h-screen bg-gray-50" />
  if (!loading && !recoveryRequired && !authError && (!session || (verifiedFactors.length > 0 && currentLevel !== 'aal2'))) {
    return <Navigate to={mfaDestination({ session, currentLevel, verifiedFactors, returnTo })} replace />
  }
  const securityUnavailable = recoveryRequired || Boolean(authError)

  return <>
    <SEOHead title="設定雙重驗證" noindex />
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
        <h1 className="text-lg font-bold mb-2">設定雙重驗證</h1>
        <p className="text-sm text-gray-500 mb-6">請準備兩個獨立的驗證器，例如手機及另一台裝置或密碼管理工具。請勿只在同一支手機保存兩份。</p>
        {notice && <p role="status" className="text-sm text-gray-600 mb-4">{notice}</p>}
        {!securityUnavailable && (enrollment ? <form onSubmit={verifyEnrollment}>
          <img src={enrollment.totp.qr_code} alt="TOTP QR Code" className="w-56 max-w-full mx-auto mb-4" />
          <label htmlFor="mfa-secret" className="block text-sm mb-2">手動設定金鑰</label>
          <input id="mfa-secret" value={enrollment.totp.secret} readOnly className="w-full min-w-0 border rounded-lg px-3 py-2 text-sm" />
          <button type="button" onClick={copySecret} disabled={loading} className="text-sm underline mt-2 mb-4">複製設定金鑰</button>
          <label htmlFor="setup-code" className="block text-sm mb-2">六位數驗證碼</label>
          <input id="setup-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={event => setCode(event.target.value)} disabled={loading} className="w-full border rounded-lg px-4 py-2.5 mb-4 text-sm" />
          <button type="submit" disabled={loading} aria-busy={loading} className="w-full text-sm bg-gray-900 text-white py-2.5 rounded-lg disabled:opacity-50">驗證並啟用</button>
        </form> : <form onSubmit={startEnrollment}>
          <label htmlFor="factor-name" className="block text-sm mb-2">驗證器名稱</label>
          <input id="factor-name" value={friendlyName} onChange={event => setFriendlyName(event.target.value)} disabled={loading} autoComplete="off" className="w-full border rounded-lg px-4 py-2.5 mb-4 text-sm" />
          <button type="submit" disabled={loading} aria-busy={loading} className="w-full text-sm bg-gray-900 text-white py-2.5 rounded-lg disabled:opacity-50">產生 QR Code</button>
        </form>)}
        {(error || authError) && <p role="alert" className="text-xs text-red-500 mt-3">{error || SECURITY_ERROR}</p>}
        {securityUnavailable && <button type="button" disabled={loading} onClick={retrySecurity} className="w-full text-sm mt-4 disabled:opacity-50">重新載入安全狀態</button>}
        <button type="button" disabled={loading} onClick={handleSignOut} className="w-full text-sm text-gray-500 mt-4 disabled:opacity-50">登出</button>
      </div>
    </div>
  </>
}
