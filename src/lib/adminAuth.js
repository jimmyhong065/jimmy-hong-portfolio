import { supabase } from './supabase'

export const MFA_REQUIRED_EVENT = 'admin:mfa-required'

// Authorization header for admin-only Pages Functions (verified server-side
// against the Supabase session + ADMIN_EMAIL).
export async function adminAuthHeader() {
  const { data, error } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (error || !token) throw new Error('Admin session required')
  return { Authorization: `Bearer ${token}` }
}

export async function adminFetch(input, init = {}) {
  const headers = new Headers(init.headers)
  headers.set('Authorization', (await adminAuthHeader()).Authorization)
  const response = await fetch(input, { ...init, headers })
  if (response.status === 403) {
    const payload = await response.clone().json().catch(() => null)
    if (payload?.code === 'MFA_REQUIRED') {
      window.dispatchEvent(new CustomEvent(MFA_REQUIRED_EVENT))
    }
  }
  return response
}
