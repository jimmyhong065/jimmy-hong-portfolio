// functions/api/email-send.js
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

function stripMarkdown(text) {
  return (text ?? '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/[*_~`#>]/g, '')
    .replace(/^\s*[-*+\d.]+\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function onRequestPost({ request, env }) {
  const auth = request.headers.get('Authorization') ?? ''
  if (auth !== `Bearer ${env.PUSH_SECRET}`) return json({ error: 'Unauthorized' }, 401)

  const { title, excerpt, slug } = await request.json()
  if (!title || !slug) return json({ error: 'Missing title or slug' }, 400)

  const sbHeaders = {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
  }

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/email_subscribers?confirmed=eq.true&select=email,token`,
    { headers: sbHeaders }
  )
  const subscribers = await res.json()
  if (!Array.isArray(subscribers) || subscribers.length === 0) return json({ sent: 0 })

  const articleUrl = `${env.SITE_URL}/blog/${slug}`
  const cleanExcerpt = stripMarkdown(excerpt)

  let sent = 0
  await Promise.allSettled(subscribers.map(async ({ email, token }) => {
    const unsubUrl = `${env.SITE_URL}/api/email-unsubscribe?token=${token}`
    const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: env.SENDGRID_FROM, name: 'Jimmy Hong' },
        personalizations: [{ to: [{ email }] }],
        subject: title,
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 32px;color:#222;">
              <p style="font-size:11px;color:#aaa;margin:0 0 24px;text-transform:uppercase;letter-spacing:.08em;">Jimmy Hong — 新文章</p>
              <h1 style="font-size:20px;font-weight:700;line-height:1.3;margin:0 0 12px;">${title}</h1>
              ${cleanExcerpt ? `<p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">${cleanExcerpt}</p>` : ''}
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
        }],
      }),
    })
    if (r.status === 202) sent++
  }))

  return json({ sent })
}
