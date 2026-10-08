// Shared admin auth for Pages Functions.
// Admin endpoints must verify the caller's Supabase session (JWT) and that the
// user is ADMIN_EMAIL. Never use a static shared secret here: anything the
// browser sends must come from the login session, not from VITE_* build vars.

function deny(error, status) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Returns null when the caller is the admin, otherwise a 401/403 Response.
export async function requireAdmin(request, env) {
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return deny('Unauthorized', 401)

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${token}` },
  })
  if (!userRes.ok) return deny('Unauthorized', 401)

  const user = await userRes.json()
  const admin = (env.ADMIN_EMAIL ?? '').toLowerCase()
  if (!admin || (user?.email ?? '').toLowerCase() !== admin) return deny('Forbidden', 403)
  return null
}
