// functions/api/wish-submit.js — reader submits an article wish (許願池).
// Writes status=pending via the service role. Public wall only shows featured wishes.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}))
  const { content, email, nickname, category, website } = body

  // Honeypot: bots fill the hidden "website" field. Pretend success, drop it.
  if (website) return json({ status: 'ok' })

  const text = (content ?? '').trim()
  if (text.length < 4 || text.length > 1000) {
    return json({ error: 'Invalid content' }, 400)
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Invalid email' }, 400)
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? ''
  const headers = {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }

  // Rate limit: same IP at most once per 30s.
  if (ip) {
    const since = new Date(Date.now() - 30_000).toISOString()
    const recentRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/article_wishes?ip=eq.${encodeURIComponent(ip)}&created_at=gte.${encodeURIComponent(since)}&select=id&limit=1`,
      { headers }
    )
    const recent = await recentRes.json().catch(() => [])
    if (Array.isArray(recent) && recent.length > 0) {
      return json({ error: 'Too many requests' }, 429)
    }
  }

  const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/article_wishes`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      content: text,
      email: email?.trim() || null,
      nickname: nickname?.trim()?.slice(0, 40) || null,
      category: category?.trim()?.slice(0, 40) || null,
      status: 'pending',
      ip: ip || null,
    }),
  })

  if (!insertRes.ok) {
    return json({ error: 'Insert failed' }, 500)
  }
  return json({ status: 'ok' })
}
