import { supabase } from './supabase'

// Authorization header for admin-only Pages Functions (verified server-side
// against the Supabase session + ADMIN_EMAIL).
export async function adminAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token ?? ''}` }
}
