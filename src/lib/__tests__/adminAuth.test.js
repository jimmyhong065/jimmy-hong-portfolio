import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('../supabase', () => ({ supabase: { auth: { getSession } } }))

import { adminFetch, MFA_REQUIRED_EVENT } from '../adminAuth'

beforeEach(() => {
  getSession.mockResolvedValue({ data: { session: { access_token: 'test-token' } }, error: null })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('sends the current token and keeps caller headers', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')))
  await adminFetch('/api/email-send', { headers: { 'Content-Type': 'application/json' } })
  const headers = fetch.mock.calls[0][1].headers
  expect(headers.get('Authorization')).toBe('Bearer test-token')
  expect(headers.get('Content-Type')).toBe('application/json')
})

it('does not send an admin request without a session token', async () => {
  getSession.mockResolvedValue({ data: { session: null }, error: null })
  vi.stubGlobal('fetch', vi.fn())
  await expect(adminFetch('/upload')).rejects.toThrow('Admin session required')
  expect(fetch).not.toHaveBeenCalled()
})

it('dispatches MFA_REQUIRED without consuming the response body', async () => {
  const listener = vi.fn()
  window.addEventListener(MFA_REQUIRED_EVENT, listener, { once: true })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
    JSON.stringify({ error: 'MFA required', code: 'MFA_REQUIRED' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } },
  )))
  const response = await adminFetch('/api/admin/subscribers')
  expect(listener).toHaveBeenCalledOnce()
  await expect(response.json()).resolves.toMatchObject({ code: 'MFA_REQUIRED' })
})

it('does not trigger MFA for another 403 error', async () => {
  const listener = vi.fn()
  window.addEventListener(MFA_REQUIRED_EVENT, listener, { once: true })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
    JSON.stringify({ error: 'Forbidden' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } },
  )))
  await adminFetch('/api/admin/subscribers')
  expect(listener).not.toHaveBeenCalled()
  window.removeEventListener(MFA_REQUIRED_EVENT, listener)
})
