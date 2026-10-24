import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { MFA_REQUIRED_EVENT } from '../lib/adminAuth'
import { mfaDestination, safeAdminReturnTo } from '../lib/mfa'

export default function MfaRequiredRedirect() {
  const location = useLocation()
  const navigate = useNavigate()
  const { refreshAuth, signOut } = useAuth()
  const busy = useRef(false)

  useEffect(() => {
    async function redirect() {
      if (busy.current || !/^\/admin(?:\/|$)/.test(location.pathname)) return
      busy.current = true
      const returnTo = safeAdminReturnTo(`${location.pathname}${location.search}${location.hash}`)
      try {
        const next = await refreshAuth()
        const destination = mfaDestination({ ...next, returnTo })
        // A server MFA denial paired with a refreshed aal2 client state is
        // contradictory. End that session so it cannot bounce back to admin.
        if (destination === returnTo) {
          await signOut()
          navigate('/login', { replace: true })
        } else {
          navigate(destination, { replace: true })
        }
      } catch {
        try { await signOut() } catch { /* fail closed in the UI */ }
        navigate('/login', { replace: true })
      } finally {
        busy.current = false
      }
    }
    window.addEventListener(MFA_REQUIRED_EVENT, redirect)
    return () => window.removeEventListener(MFA_REQUIRED_EVENT, redirect)
  }, [location.pathname, location.search, location.hash, navigate, refreshAuth, signOut])

  return null
}
