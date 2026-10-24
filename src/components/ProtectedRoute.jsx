import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { mfaDestination } from '../lib/mfa'

export default function ProtectedRoute({ children }) {
  const auth = useAuth()
  const location = useLocation()
  if (!auth.authReady) return null
  const returnTo = `${location.pathname}${location.search}`
  const destination = mfaDestination({ ...auth, returnTo })
  if (destination !== returnTo) return <Navigate to={destination} replace />
  return children
}
