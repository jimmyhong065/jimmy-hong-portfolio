import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useUpload } from '../useUpload'

vi.stubEnv('VITE_UPLOAD_SECRET', 'test-secret')

describe('useUpload', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with uploading=false and no error', () => {
    const { result } = renderHook(() => useUpload())
    expect(result.current.uploading).toBe(false)
    expect(result.current.uploadError).toBeNull()
  })

  it('uploadOne: calls onSuccess with URL on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://r2.example.com/photo.jpg' }),
    })

    const { result } = renderHook(() => useUpload())
    const onSuccess = vi.fn()
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.uploadOne(file, onSuccess)
    })

    expect(onSuccess).toHaveBeenCalledWith('https://r2.example.com/photo.jpg')
    expect(result.current.uploading).toBe(false)
    expect(result.current.uploadError).toBeNull()
  })

  it('uploadOne: sets uploadError on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false })

    const { result } = renderHook(() => useUpload())
    const onSuccess = vi.fn()
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.uploadOne(file, onSuccess)
    })

    expect(onSuccess).not.toHaveBeenCalled()
    expect(result.current.uploadError).toBe('上傳失敗，請重試')
    expect(result.current.uploading).toBe(false)
  })

  it('uploadMany: calls onEachSuccess for each file', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ url: 'https://r2.example.com/a.jpg' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ url: 'https://r2.example.com/b.jpg' }) })

    const { result } = renderHook(() => useUpload())
    const onEachSuccess = vi.fn()
    const files = [
      new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
    ]

    await act(async () => {
      await result.current.uploadMany(files, onEachSuccess, () => {})
    })

    expect(onEachSuccess).toHaveBeenCalledTimes(2)
    expect(onEachSuccess).toHaveBeenNthCalledWith(1, 'https://r2.example.com/a.jpg')
    expect(onEachSuccess).toHaveBeenNthCalledWith(2, 'https://r2.example.com/b.jpg')
  })

  it('uploadMany: sets fetch Authorization header with secret', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://r2.example.com/a.jpg' }),
    })

    const { result } = renderHook(() => useUpload())
    const file = new File(['a'], 'a.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.uploadOne(file, () => {})
    })

    expect(fetch).toHaveBeenCalledWith('/upload', expect.objectContaining({
      method: 'POST',
      headers: { Authorization: 'Bearer test-secret' },
    }))
  })
})
