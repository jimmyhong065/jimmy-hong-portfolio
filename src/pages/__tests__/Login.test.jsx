import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: { auth: { signInWithPassword: vi.fn() } },
}))
vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Login from '../Login'

const refreshAuth = vi.fn()
const session = { user: { id: 'admin' } }
const one = { id: 'one' }
const two = { id: 'two' }

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}{location.search}</output>
}

function renderLogin(initialEntry = '/login') {
  const user = userEvent.setup()
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationProbe />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<div>Destination</div>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  )
  return user
}

async function submitLogin(user) {
  await user.type(screen.getByPlaceholderText('your@email.com'), 'admin@example.com')
  await user.type(screen.getByPlaceholderText('密碼'), 'password')
  await user.click(screen.getByRole('button', { name: '登入' }))
}

describe('Login', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useAuth.mockReturnValue({ refreshAuth })
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null })
  })

  it.each([
    ['no factors', 'aal1', [], '/mfa/setup?returnTo=%2Fadmin'],
    ['one factor at aal1', 'aal1', [one], '/mfa/verify?returnTo=%2Fadmin'],
    ['two factors at aal2', 'aal2', [one, two], '/admin'],
  ])('routes password success with %s through refreshed auth state', async (_name, currentLevel, verifiedFactors, expected) => {
    refreshAuth.mockResolvedValue({ session, currentLevel, verifiedFactors })
    const user = renderLogin()

    await submitLogin(user)

    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe(expected))
    expect(refreshAuth).toHaveBeenCalledTimes(1)
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'admin@example.com', password: 'password' })
  })

  it('preserves a safe admin return path and query', async () => {
    refreshAuth.mockResolvedValue({ session, currentLevel: 'aal1', verifiedFactors: [one] })
    const user = renderLogin('/login?returnTo=%2Fadmin%2Fsettings%3Ftab%3Dsecurity')

    await submitLogin(user)

    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/mfa/verify?returnTo=%2Fadmin%2Fsettings%3Ftab%3Dsecurity'))
  })

  it('sanitizes an external return path to the default admin flow', async () => {
    refreshAuth.mockResolvedValue({ session, currentLevel: 'aal1', verifiedFactors: [] })
    const user = renderLogin('/login?returnTo=https%3A%2F%2Fevil.example%2Fadmin')

    await submitLogin(user)

    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/mfa/setup?returnTo=%2Fadmin'))
  })

  it('shows the generic password error without refreshing auth or navigating', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ error: new Error('Private auth detail') })
    const user = renderLogin()

    await submitLogin(user)

    expect(await screen.findByText('帳號或密碼錯誤')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '登入' })).toBeEnabled()
    expect(refreshAuth).not.toHaveBeenCalled()
    expect(screen.getByTestId('location').textContent).toBe('/login')
  })

  it('shows a security state error and stops loading if refresh fails', async () => {
    refreshAuth.mockRejectedValue(new Error('Private MFA detail'))
    const user = renderLogin('/login?returnTo=%2Fadmin%2Fsettings')

    await submitLogin(user)

    expect(await screen.findByText('無法確認登入安全狀態，請稍後再試')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '登入' })).toBeEnabled()
    expect(screen.getByTestId('location').textContent).toBe('/login?returnTo=%2Fadmin%2Fsettings')
    expect(screen.queryByText('Destination')).not.toBeInTheDocument()
  })

  it('allows retry without navigating when refreshed auth has no session', async () => {
    refreshAuth.mockResolvedValue({ session: null, currentLevel: null, verifiedFactors: [] })
    const user = renderLogin('/login?returnTo=%2Fadmin%2Fsettings')

    await submitLogin(user)

    expect(await screen.findByText('無法確認登入安全狀態，請稍後再試')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '登入' })).toBeEnabled()
    expect(screen.getByTestId('location').textContent).toBe('/login?returnTo=%2Fadmin%2Fsettings')
  })

  it('keeps login disabled and waits for auth refresh before navigating', async () => {
    let resolveRefresh
    refreshAuth.mockReturnValue(new Promise(resolve => { resolveRefresh = resolve }))
    const user = renderLogin('/login?returnTo=%2Fadmin%2Fsettings')

    await submitLogin(user)

    const button = screen.getByRole('button', { name: '登入中…' })
    expect(button).toBeDisabled()
    expect(refreshAuth).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('location').textContent).toBe('/login?returnTo=%2Fadmin%2Fsettings')
    await user.click(button)
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveRefresh({ session, currentLevel: 'aal1', verifiedFactors: [one] })
    })

    expect(screen.getByTestId('location').textContent).toBe('/mfa/verify?returnTo=%2Fadmin%2Fsettings')
  })
})
