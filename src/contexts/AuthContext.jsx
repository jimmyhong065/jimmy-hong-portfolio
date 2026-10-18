import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadMfaState } from '../lib/mfa'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext(null)
const EMPTY_AUTH = { session: null, currentLevel: null, nextLevel: null, verifiedFactors: [] }

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(EMPTY_AUTH)
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState(null)
  const mounted = useRef(false)
  const requestVersion = useRef(0)
  const refreshTimer = useRef(null)

  const refreshAuth = useCallback(async () => {
    const version = ++requestVersion.current
    try {
      const next = await loadMfaState()
      if (mounted.current && version === requestVersion.current) {
        setAuth(next)
        setAuthError(null)
        setAuthReady(true)
      }
      return next
    } catch (error) {
      if (mounted.current && version === requestVersion.current) {
        setAuthError(error)
        setAuthReady(true)
      }
      throw error
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    refreshAuth().catch(() => {})
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Invalidate in-flight MFA reads as soon as the session changes.
      requestVersion.current += 1
      window.clearTimeout(refreshTimer.current)
      setAuth(current => ({ ...current, session }))
      setAuthReady(false)
      refreshTimer.current = window.setTimeout(() => refreshAuth().catch(() => {}), 0)
    })
    return () => {
      mounted.current = false
      requestVersion.current += 1
      window.clearTimeout(refreshTimer.current)
      subscription.unsubscribe()
    }
  }, [refreshAuth])

  const signOut = useCallback(async () => {
    const result = await supabase.auth.signOut()
    if (!result.error && mounted.current) {
      requestVersion.current += 1
      window.clearTimeout(refreshTimer.current)
      setAuth(EMPTY_AUTH)
      setAuthError(null)
      setAuthReady(true)
    }
    return result
  }, [])

  const value = useMemo(() => ({
    ...auth, authReady, loading: !authReady, authError, refreshAuth, signOut,
  }), [auth, authReady, authError, refreshAuth, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
