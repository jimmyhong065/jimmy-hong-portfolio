// Shared admin auth for Pages Functions.
// Admin endpoints must verify the caller's Supabase session (JWT) and that the
// user is ADMIN_EMAIL. Never use a static shared secret here: anything the
// browser sends must come from the login session, not from VITE_* build vars.

function deny(error, status, code) {
  return new Response(JSON.stringify({ error, ...(code ? { code } : {}) }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// The signature and expiry are checked by Supabase's /auth/v1/user endpoint.
// Decode only the assurance claim from that already validated access token.
function jwtPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts.every(Boolean)) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(padded), character => character.charCodeAt(0))
    const claims = JSON.parse(new TextDecoder().decode(bytes))
    return claims && typeof claims === 'object' && !Array.isArray(claims) ? claims : null
  } catch {
    return null
  }
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

  const claims = jwtPayload(token)
  if (!claims) return deny('Unauthorized', 401)
  const user = await userRes.json()
  const admin = (env.ADMIN_EMAIL ?? '').toLowerCase()
  if (!admin || (user?.email ?? '').toLowerCase() !== admin) return deny('Forbidden', 403)
  if (claims.aal !== 'aal2') return deny('MFA required', 403, 'MFA_REQUIRED')
  return null
}
