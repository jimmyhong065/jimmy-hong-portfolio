# R2 Image Upload via Pages Function — Design Spec

**Date:** 2026-05-17
**Author:** Jimmy Hong
**Status:** Approved

---

## 1. Purpose

Allow admin to upload photos directly from the admin panel (`/admin/photo-projects/:id`) to Cloudflare R2, instead of manually uploading via Cloudflare Dashboard and pasting URLs. Uploaded photo URLs are automatically appended to the Gallery images textarea.

---

## 2. Architecture

```
Admin selects files (file input, multiple)
  → POST /upload (multipart/form-data)
      Header: Authorization: Bearer <VITE_UPLOAD_SECRET>
  → functions/upload.js (Cloudflare Pages Function)
      → Validate Authorization header against UPLOAD_SECRET env var
      → Upload file to R2 bucket (PHOTO_BUCKET binding)
      → Return { url: "https://<public-r2-domain>/<filename>" }
  → Frontend appends URL to images textarea (one URL per line)
```

---

## 3. Files

**Create:**
- `functions/upload.js` — Cloudflare Pages Function, handles POST /upload

**Modify:**
- `src/pages/admin/AdminPhotoProjectEdit.jsx` — add upload button + upload logic

---

## 4. Pages Function: `functions/upload.js`

```js
export async function onRequestPost(context) {
  const { request, env } = context

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization',
  }

  // Validate secret
  const auth = request.headers.get('Authorization') ?? ''
  if (auth !== `Bearer ${env.UPLOAD_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Parse multipart form
  const formData = await request.formData()
  const file = formData.get('file')
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Generate unique filename: timestamp-originalname
  const filename = `${Date.now()}-${file.name}`
  const bytes = await file.arrayBuffer()

  // Upload to R2
  await env.PHOTO_BUCKET.put(filename, bytes, {
    httpMetadata: { contentType: file.type },
  })

  // Return public URL (R2 public domain set in Cloudflare Dashboard)
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
```

---

## 5. Admin UI Changes (AdminPhotoProjectEdit)

Add upload button next to the Gallery images label. Hidden `<input type="file" multiple accept="image/*">` triggered by a styled button.

**Upload flow:**
1. User clicks "📁 上傳圖片" button
2. File picker opens (multiple selection allowed)
3. Each file is POSTed individually to `/upload` with `Authorization: Bearer ${VITE_UPLOAD_SECRET}`
4. On success: returned URL is appended to `form.images` textarea (newline-separated)
5. During upload: button shows "上傳中…" and is disabled
6. On error: show error message below the button

**Form state additions:**
```js
const [uploading, setUploading] = useState(false)
const [uploadError, setUploadError] = useState(null)
```

**Upload handler:**
```js
async function handleUpload(e) {
  const files = Array.from(e.target.files)
  if (!files.length) return
  setUploading(true)
  setUploadError(null)
  const urls = []
  for (const file of files) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${import.meta.env.VITE_UPLOAD_SECRET}` },
      body: fd,
    })
    if (!res.ok) {
      setUploadError('上傳失敗，請重試')
      setUploading(false)
      return
    }
    const { url } = await res.json()
    urls.push(url)
  }
  setForm(f => ({
    ...f,
    images: f.images ? `${f.images}\n${urls.join('\n')}` : urls.join('\n'),
  }))
  setUploading(false)
  e.target.value = ''
}
```

---

## 6. Environment Variables

| Variable | Where | Value |
|---|---|---|
| `UPLOAD_SECRET` | Cloudflare Pages env (server-side) | Any random secret string |
| `VITE_UPLOAD_SECRET` | `.env.local` + Cloudflare Pages env | Same value as UPLOAD_SECRET |
| `R2_PUBLIC_URL` | Cloudflare Pages env (server-side) | R2 bucket public domain (e.g. `https://pub-xxx.r2.dev`) |
| `PHOTO_BUCKET` | Cloudflare Pages R2 binding | R2 bucket name |

---

## 7. Manual Cloudflare Setup (One-Time)

1. **Create R2 bucket:**
   - Cloudflare Dashboard → R2 → Create bucket → name: `r-bing-photos`
   - Bucket Settings → Public Access → Enable → note the `pub-xxx.r2.dev` URL

2. **Bind bucket to Pages project:**
   - Cloudflare Pages → jimmy-hong-portfolio → Settings → Functions → R2 bucket bindings
   - Add binding: Variable name = `PHOTO_BUCKET`, R2 bucket = `r-bing-photos`

3. **Set environment variables in Cloudflare Pages:**
   - `UPLOAD_SECRET` = (generate any random string, e.g. 32 chars)
   - `VITE_UPLOAD_SECRET` = (same value)
   - `R2_PUBLIC_URL` = `https://pub-xxx.r2.dev` (from step 1)

4. **Set in `.env.local` for local dev:**
   ```
   VITE_UPLOAD_SECRET=<same secret>
   ```
   Note: `/upload` endpoint only works in Cloudflare Pages production/preview (Pages Functions don't run locally in Vite dev server). For local dev, paste URLs manually.

---

## 8. Security

- `UPLOAD_SECRET` is never exposed client-side — it lives only in Cloudflare Pages environment
- `VITE_UPLOAD_SECRET` IS bundled into the frontend JS (visible in browser DevTools)
- For a personal admin panel protected by Supabase auth, this is acceptable security
- R2 bucket is public-read only — no one can write to R2 without the secret

---

## 9. Out of Scope

- Image resizing/compression (upload as-is)
- Deleting files from R2 when removing from admin
- Upload progress bar (just a loading state)
- Local dev support for /upload endpoint (paste URLs manually in local dev)
