# R2 Image Upload (v2) — Design Spec

**Date:** 2026-05-17
**Author:** Jimmy Hong
**Status:** Approved

---

## 1. Purpose

Allow admin to upload images directly from the admin panel to Cloudflare R2:
- **Avatar** upload in `/admin/settings`
- **Cover image** upload in `/admin/photo-projects/:id`
- **Gallery images** (multiple) upload in `/admin/photo-projects/:id`

Uploaded URLs are automatically populated into the relevant fields — no manual URL pasting needed.

---

## 2. Architecture

```
Admin clicks upload button → hidden file input opens
  → file(s) selected → useUpload hook called
      → POST /upload (multipart/form-data)
          Header: Authorization: Bearer <VITE_UPLOAD_SECRET>
      → functions/upload.js (Cloudflare Pages Function)
          → Validate Authorization header vs UPLOAD_SECRET env var
          → Upload to R2 bucket (PHOTO_BUCKET binding)
          → Return { url: "https://<R2_PUBLIC_URL>/<filename>" }
      → URL populated into form field (avatar_url / cover_url / images textarea)
```

---

## 3. Files

**Create:**
- `functions/upload.js` — Cloudflare Pages Function, POST /upload
- `src/hooks/useUpload.js` — shared upload hook used by all upload buttons

**Modify:**
- `src/pages/admin/AdminSettings.jsx` — add avatar upload button
- `src/pages/admin/AdminPhotoProjectEdit.jsx` — add cover + gallery upload buttons

---

## 4. `functions/upload.js`

```js
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

  const filename = `${Date.now()}-${file.name}`
  const bytes = await file.arrayBuffer()

  await env.PHOTO_BUCKET.put(filename, bytes, {
    httpMetadata: { contentType: file.type },
  })

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

## 5. `src/hooks/useUpload.js`

Shared hook encapsulating all upload logic:

```js
import { useState } from 'react'

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  async function upload(file) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${import.meta.env.VITE_UPLOAD_SECRET}` },
      body: fd,
    })
    if (!res.ok) throw new Error('上傳失敗，請重試')
    const { url } = await res.json()
    return url
  }

  async function uploadOne(file, onSuccess) {
    setUploading(true)
    setUploadError(null)
    try {
      const url = await upload(file)
      onSuccess(url)
    } catch (e) {
      setUploadError(e.message)
    } finally {
      setUploading(false)
    }
  }

  async function uploadMany(files, onEachSuccess, onProgress) {
    setUploading(true)
    setUploadError(null)
    try {
      for (let i = 0; i < files.length; i++) {
        onProgress?.(i + 1, files.length)
        const url = await upload(files[i])
        onEachSuccess(url)
      }
    } catch (e) {
      setUploadError(e.message)
    } finally {
      setUploading(false)
    }
  }

  return { uploading, uploadError, uploadOne, uploadMany }
}
```

- `uploadOne(file, onSuccess)` — single file, calls `onSuccess(url)` on completion
- `uploadMany(files, onEachSuccess, onProgress)` — multiple files, calls `onEachSuccess(url)` per file

---

## 6. AdminSettings — Avatar Upload

Add upload button inline with the `avatar_url` input field.

**UI pattern:**
```jsx
<div className="flex gap-2">
  <input name="avatar_url" value={form.avatar_url} onChange={handleChange} ... />
  <button type="button" onClick={() => avatarInputRef.current.click()} disabled={uploading}>
    {uploading ? '上傳中…' : '上傳'}
  </button>
  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
    onChange={e => {
      const file = e.target.files[0]
      if (file) uploadOne(file, url => setForm(f => ({ ...f, avatar_url: url })))
      e.target.value = ''
    }}
  />
</div>
{uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
```

Uses `useUpload()` hook. No separate upload state needed in the component.

---

## 7. AdminPhotoProjectEdit — Cover + Gallery Upload

### Cover image (single)

```jsx
<div className="flex gap-2">
  <input name="cover_url" value={form.cover_url} onChange={handleChange} ... />
  <button type="button" onClick={() => coverInputRef.current.click()} disabled={uploading}>
    {uploading ? '上傳中…' : '上傳'}
  </button>
  <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
    onChange={e => {
      const file = e.target.files[0]
      if (file) uploadOne(file, url => setForm(f => ({ ...f, cover_url: url })))
      e.target.value = ''
    }}
  />
</div>
```

### Gallery images (multiple)

```jsx
<div className="flex justify-between items-center mb-1">
  <label>Gallery 圖片 URL（每行一個）</label>
  <button type="button" onClick={() => galleryInputRef.current.click()} disabled={uploading}>
    {uploading ? `上傳中 ${progress}/${total}…` : '上傳多張'}
  </button>
  <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden"
    onChange={e => {
      const files = Array.from(e.target.files)
      uploadMany(
        files,
        url => setForm(f => ({ ...f, images: f.images ? `${f.images}\n${url}` : url })),
        (done, total) => setProgress({ done, total })
      )
      e.target.value = ''
    }}
  />
</div>
<textarea name="images" ... />
```

Progress state: `const [progress, setProgress] = useState({ done: 0, total: 0 })`

---

## 8. Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `UPLOAD_SECRET` | Cloudflare Pages env (server-side only) | Validates upload requests |
| `VITE_UPLOAD_SECRET` | `.env.local` + Cloudflare Pages env | Frontend auth header |
| `R2_PUBLIC_URL` | Cloudflare Pages env (server-side only) | R2 bucket public domain |
| `PHOTO_BUCKET` | Cloudflare Pages R2 binding | R2 bucket reference |

---

## 9. Cloudflare Setup (Prerequisites — must be done manually before deploy)

1. **Create R2 bucket:**
   - Cloudflare Dashboard → R2 → Create bucket → name: `r-bing-photos`
   - Bucket Settings → Public Access → Enable → note the `pub-xxx.r2.dev` URL

2. **Bind bucket to Pages project:**
   - Workers & Pages → jimmy-hong-portfolio → Settings → Bindings → Add R2 bucket binding
   - Variable name: `PHOTO_BUCKET`, bucket: `r-bing-photos`

3. **Set environment variables in Cloudflare Pages:**
   - `UPLOAD_SECRET` = (random secret, e.g. 32 chars)
   - `VITE_UPLOAD_SECRET` = (same value)
   - `R2_PUBLIC_URL` = `https://pub-xxx.r2.dev`

4. **Set in `.env.local` for build:**
   ```
   VITE_UPLOAD_SECRET=<same secret>
   ```

---

## 10. Deployment Note

`functions/upload.js` is a Cloudflare Pages Function. When deploying via `wrangler pages deploy dist --project-name jimmy-hong-portfolio`, wrangler automatically picks up the `functions/` directory from the project root and deploys the function alongside the static assets.

The `/upload` endpoint is only available on Cloudflare Pages (not local Vite dev server). In local dev, the upload buttons will show an error — this is expected. Test uploads on production after deploy.

---

## 11. Out of Scope

- Image resizing/compression
- Upload progress bar (only counter for gallery: "上傳中 2/5…")
- Deleting files from R2
- Local dev support for /upload endpoint
