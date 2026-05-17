const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function onRequestPost(context) {
  const { request, env } = context

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization',
  }

  const auth = request.headers.get('Authorization') ?? ''
  if (auth !== `Bearer ${env.UPLOAD_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(JSON.stringify({ error: 'Invalid file type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: 'File too large (max 10MB)' }), {
      status: 413,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const filename = `${Date.now()}-${file.name}`
  const bytes = await file.arrayBuffer()

  try {
    await env.PHOTO_BUCKET.put(filename, bytes, {
      httpMetadata: { contentType: file.type },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const url = `${env.R2_PUBLIC_URL}/${filename}`

  return new Response(JSON.stringify({ url }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization',
    },
  })
}
