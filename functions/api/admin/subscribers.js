// functions/api/admin/subscribers.js
import { requireAdmin } from '../_auth.js'

const CORS = {
  'Access-Control-Allow-Origin': 'https://qa-lens.com',
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
  const denied = await requireAdmin(request, env)
  if (denied) return denied

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
