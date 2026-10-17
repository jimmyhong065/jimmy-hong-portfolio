import { supabase } from './supabase'

export const REQUIRED_TOTP_FACTORS = 2

export function safeAdminReturnTo(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return '/admin'
  }

  const origin = 'https://admin-mfa.invalid'
  const parsed = new URL(value, origin)
  const isAdminPath = parsed.pathname === '/admin' || parsed.pathname.startsWith('/admin/')

  if (parsed.origin !== origin || !isAdminPath) return '/admin'
  return `${parsed.pathname}${parsed.search}${parsed.hash}`
}

function mfaUrl(path, returnTo) {
  return `${path}?returnTo=${encodeURIComponent(safeAdminReturnTo(returnTo))}`
}

export function mfaDestination({
  session,
  currentLevel = null,
  verifiedFactors = [],
  returnTo = '/admin',
}) {
  if (!session) return '/login'
  if (verifiedFactors.length === 0) return mfaUrl('/mfa/setup', returnTo)
  if (currentLevel !== 'aal2') return mfaUrl('/mfa/verify', returnTo)
  if (verifiedFactors.length < REQUIRED_TOTP_FACTORS) return mfaUrl('/mfa/setup', returnTo)
  return safeAdminReturnTo(returnTo)
}

export async function loadMfaState(client = supabase) {
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throw sessionError
  const session = sessionData.session
  if (!session) {
    return { session: null, currentLevel: null, nextLevel: null, verifiedFactors: [] }
  }

  const [factorsResult, aalResult] = await Promise.all([
    client.auth.mfa.listFactors(),
    client.auth.mfa.getAuthenticatorAssuranceLevel(),
  ])
  if (factorsResult.error) throw factorsResult.error
  if (aalResult.error) throw aalResult.error

  return {
    session,
    currentLevel: aalResult.data.currentLevel,
    nextLevel: aalResult.data.nextLevel,
    verifiedFactors: factorsResult.data.totp,
  }
}
