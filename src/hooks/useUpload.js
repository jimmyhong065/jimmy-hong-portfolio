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
