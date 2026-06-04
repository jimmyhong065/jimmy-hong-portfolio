// functions/api/admin/subscribers.js
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function onRequestGet({ request, env }) {
  const auth = request.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '')
  if (!token) return json({ error: 'Unauthorized' }, 401)

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!userRes.ok) return json({ error: 'Unauthorized' }, 401)
  const user = await userRes.json()
  if (user.email !== env.ADMIN_EMAIL) return json({ error: 'Forbidden' }, 403)

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/email_subscribers?select=email,confirmed,created_at&order=created_at.desc`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  )
  if (!res.ok) return json({ error: 'Failed to fetch subscribers' }, 500)
  const data = await res.json()
  return json(data)
}
