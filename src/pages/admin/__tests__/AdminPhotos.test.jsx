import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'

vi.mock('../../../hooks/useUpload', () => ({
  useUpload: () => ({ uploading: false, uploadError: null, uploadMany: vi.fn() }),
}))
const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('../../../lib/supabase', () => ({ supabase: { auth: { getSession } } }))

import AdminPhotos from '../AdminPhotos'

beforeEach(() => {
  vi.restoreAllMocks()
  getSession.mockResolvedValue({ data: { session: { access_token: 'photos-token' } }, error: null })
  vi.stubGlobal('fetch', vi.fn(async (_url, init) => new Response(JSON.stringify(
    init?.method === 'DELETE' ? { ok: true } : {
      files: [{ key: 'test.png', url: 'https://example.com/test.png', size: 20 }],
    },
  ))))
})

it('authenticates R2 listing and deletion through the same client', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  render(<AdminPhotos />)
  await screen.findAllByText('test.png')
  expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer photos-token')
  fireEvent.click(screen.getAllByRole('button', { name: '刪除' })[0])
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/r2-manage', expect.objectContaining({ method: 'DELETE' })))
  const deleteCall = fetch.mock.calls.find(([, init]) => init?.method === 'DELETE')
  expect(deleteCall[1].headers.get('Authorization')).toBe('Bearer photos-token')
})

it('keeps the photo visible when deletion is denied by MFA', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  fetch.mockImplementation(async (_url, init) => new Response(JSON.stringify(
    init?.method === 'DELETE'
      ? { error: 'MFA required', code: 'MFA_REQUIRED' }
      : { files: [{ key: 'test.png', url: 'https://example.com/test.png', size: 20 }] },
  ), { status: init?.method === 'DELETE' ? 403 : 200, headers: { 'Content-Type': 'application/json' } }))
  render(<AdminPhotos />)
  await screen.findAllByText('test.png')
  fireEvent.click(screen.getAllByRole('button', { name: '刪除' })[0])
  expect(await screen.findByRole('alert')).toHaveTextContent('刪除失敗')
  expect(screen.getAllByText('test.png')).not.toHaveLength(0)
})
