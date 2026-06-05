// functions/api/admin/email-broadcast.js
import { stripMarkdown, chunkArray, escapeHtml } from '../_utils.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

export async function onRequestPost({ request, env }) {
  const authHeader = request.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return json({ error: 'Unauthorized' }, 401)

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!userRes.ok) return json({ error: 'Unauthorized' }, 401)

  const user = await userRes.json()
  if (user?.email !== env.ADMIN_EMAIL) return json({ error: 'Forbidden' }, 403)

  let title, excerpt, slug
  try {
    ;({ title, excerpt, slug } = await request.json())
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  if (!title || !slug) return json({ error: 'Missing title or slug' }, 400)

  const sbHeaders = {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
  }

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/email_subscribers?confirmed=eq.true&select=email,token`,
    { headers: sbHeaders }
  )
  if (!res.ok) return json({ error: 'Failed to fetch subscribers' }, 500)
  const subscribers = await res.json()
  if (!Array.isArray(subscribers) || subscribers.length === 0) return json({ sent: 0 })

  const articleUrl = `${env.SITE_URL}/blog/${slug}`
  const cleanExcerpt = stripMarkdown(excerpt)

  let sent = 0
  for (const batch of chunkArray(subscribers, 50)) {
    await Promise.allSettled(batch.map(async ({ email, token: subToken }) => {
      const unsubUrl = `${env.SITE_URL}/api/email-unsubscribe?token=${subToken}`
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Jimmy Hong', email: env.BREVO_FROM },
          to: [{ email }],
          subject: title,
          htmlContent: `
            <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 32px;color:#222;">
              <p style="font-size:11px;color:#aaa;margin:0 0 24px;text-transform:uppercase;letter-spacing:.08em;">Jimmy Hong — 新文章</p>
              <h1 style="font-size:20px;font-weight:700;line-height:1.3;margin:0 0 12px;">${escapeHtml(title)}</h1>
              ${cleanExcerpt ? `<p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">${escapeHtml(cleanExcerpt)}</p>` : ''}
              <a href="${articleUrl}"
                style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;">
                閱讀文章
              </a>
              <hr style="margin:32px 0;border:none;border-top:1px solid #eee;">
              <p style="font-size:11px;color:#bbb;margin:0;">
                您收到此信是因為訂閱了 Jimmy Hong 部落格。
                <a href="${unsubUrl}" style="color:#bbb;">取消訂閱</a>
              </p>
            </div>
          `,
        }),
      })
      if (r.ok) sent++
    }))
  }

  return json({ sent })
}
