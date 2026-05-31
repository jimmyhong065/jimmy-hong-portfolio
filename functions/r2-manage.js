const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function onRequest(context) {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const auth = request.headers.get('Authorization') ?? ''
  if (auth !== `Bearer ${env.UPLOAD_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (request.method === 'GET') {
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor') || undefined
    const result = await env.PHOTO_BUCKET.list({ limit: 100, cursor })
    const files = result.objects
      .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded))
      .map(obj => ({
        key: obj.key,
        url: `${env.R2_PUBLIC_URL}/${obj.key}`,
        size: obj.size,
        uploaded: obj.uploaded,
      }))
    return new Response(JSON.stringify({ files, truncated: result.truncated, cursor: result.cursor }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (request.method === 'DELETE') {
    const { key } = await request.json()
    if (!key) return new Response(JSON.stringify({ error: 'Missing key' }), { status: 400, headers: corsHeaders })
    await env.PHOTO_BUCKET.delete(key)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response('Method not allowed', { status: 405 })
}
