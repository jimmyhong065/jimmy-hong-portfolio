import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/supabase', () => ({ supabase: { auth: { mfa: { challengeAndVerify: vi.fn() } } } }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import MfaVerify from '../MfaVerify'

const refreshAuth = vi.fn()
const signOut = vi.fn()
const session = { user: { id: 'admin' } }
const one = { id: 'one', friendly_name: '手機' }
const two = { id: 'two' }
let state
const entry = '/mfa/verify?returnTo=%2Fadmin%2Fposts'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}{location.search}</output>
}

function renderVerify(initialEntry = entry) {
  const user = userEvent.setup()
  render(<HelmetProvider><MemoryRouter initialEntries={[initialEntry]}>
    <LocationProbe />
    <Routes><Route path="/mfa/verify" element={<MfaVerify />} /><Route path="*" element={<div>Destination</div>} /></Routes>
  </MemoryRouter></HelmetProvider>)
  return user
}

async function submit(user, code = '123456') {
  await user.type(screen.getByLabelText('六位數驗證碼'), code)
  await user.click(screen.getByRole('button', { name: '驗證', exact: true }))
}

describe('MfaVerify', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state = { session, currentLevel: 'aal1', verifiedFactors: [one], authReady: true, refreshAuth, signOut }
    useAuth.mockImplementation(() => state)
    supabase.auth.mfa.challengeAndVerify.mockResolvedValue({ error: null })
    refreshAuth.mockResolvedValue({ session, currentLevel: 'aal2', verifiedFactors: [one] })
    signOut.mockResolvedValue(undefined)
  })

  it('verifies the existing factor and routes one refreshed factor to setup', async () => {
    const user = renderVerify()
    const code = screen.getByLabelText('六位數驗證碼')
    expect(code).toHaveAttribute('inputmode', 'numeric')
    expect(code).toHaveAttribute('autocomplete', 'one-time-code')
    expect(code).toHaveAttribute('maxlength', '6')
    await submit(user)
    expect(supabase.auth.mfa.challengeAndVerify).toHaveBeenCalledWith({ factorId: 'one', code: '123456' })
    expect(refreshAuth).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/mfa/setup?returnTo=%2Fadmin%2Fposts'))
  })

  it('returns two refreshed factors at aal2 to the original admin target', async () => {
    refreshAuth.mockResolvedValue({ session, currentLevel: 'aal2', verifiedFactors: [one, two] })
    const user = renderVerify()
    await submit(user)
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/admin/posts'))
  })

  it.each(['12345', '１２３４５６', '12345a'])('rejects invalid code %s before the API', async code => {
    const user = renderVerify()
    await submit(user, code)
    expect(await screen.findByText('請輸入六位數驗證碼')).toBeInTheDocument()
    expect(supabase.auth.mfa.challengeAndVerify).not.toHaveBeenCalled()
  })

  it('clears a rejected code and permits retry with a safe error', async () => {
    supabase.auth.mfa.challengeAndVerify.mockResolvedValue({ error: new Error('private detail') })
    const user = renderVerify()
    await submit(user)
    expect(await screen.findByText('驗證碼錯誤或已過期，請輸入目前顯示的代碼')).toBeInTheDocument()
    expect(screen.getByLabelText('六位數驗證碼')).toHaveValue('')
    expect(screen.getByRole('button', { name: '驗證', exact: true })).toBeEnabled()
    expect(refreshAuth).not.toHaveBeenCalled()
  })

  it.each(['error', 'no session'])('stays on verification if refresh has %s', async mode => {
    if (mode === 'error') refreshAuth.mockRejectedValue(new Error('private detail'))
    else refreshAuth.mockResolvedValue({ session: null })
    const user = renderVerify()
    await submit(user)
    expect(await screen.findByText('無法確認登入安全狀態，請稍後再試')).toBeInTheDocument()
    expect(screen.getByTestId('location').textContent).toBe(entry)
    expect(screen.getByLabelText('六位數驗證碼')).toHaveValue('')
    expect(screen.getByRole('button', { name: '驗證', exact: true })).toBeEnabled()
  })

  it('redirects a missing session to login', () => {
    state.session = null
    renderVerify()
    expect(screen.getByTestId('location').textContent).toBe('/login')
  })

  it('redirects zero factors to setup preserving the safe target', () => {
    state.verifiedFactors = []
    renderVerify()
    expect(screen.getByTestId('location').textContent).toBe('/mfa/setup?returnTo=%2Fadmin%2Fposts')
  })

  it.each([
    [[one], '/mfa/setup?returnTo=%2Fadmin%2Fposts'],
    [[one, two], '/admin/posts'],
  ])('skips verification at aal2 with factors %j', (factors, expected) => {
    state.currentLevel = 'aal2'
    state.verifiedFactors = factors
    renderVerify()
    expect(screen.queryByLabelText('六位數驗證碼')).not.toBeInTheDocument()
    expect(screen.getByTestId('location').textContent).toBe(expected)
  })

  it('uses the selected factor and displays friendly and fallback names', async () => {
    state.verifiedFactors = [one, two]
    const user = renderVerify()
    expect(screen.getByRole('option', { name: '手機' })).toBeInTheDocument()
    const fallback = screen.getAllByRole('option')[1]
    expect(fallback.textContent).toBeTruthy()
    await user.selectOptions(screen.getByLabelText('驗證器'), 'two')
    await submit(user)
    expect(supabase.auth.mfa.challengeAndVerify).toHaveBeenCalledWith({ factorId: 'two', code: '123456' })
  })

  it('sanitizes an unsafe return target', () => {
    state.currentLevel = 'aal2'
    state.verifiedFactors = [one, two]
    renderVerify('/mfa/verify?returnTo=https%3A%2F%2Fevil.example')
    expect(screen.getByTestId('location').textContent).toBe('/admin')
  })

  it('blocks duplicate submits until verification and refresh finish', async () => {
    let resolveVerify
    let resolveRefresh
    supabase.auth.mfa.challengeAndVerify.mockReturnValue(new Promise(resolve => { resolveVerify = resolve }))
    refreshAuth.mockReturnValue(new Promise(resolve => { resolveRefresh = resolve }))
    const user = renderVerify()
    await submit(user)
    const button = screen.getByRole('button', { name: '驗證', exact: true })
    expect(button).toBeDisabled()
    fireEvent.submit(button.closest('form'))
    expect(supabase.auth.mfa.challengeAndVerify).toHaveBeenCalledTimes(1)
    await act(async () => resolveVerify({ error: null }))
    expect(screen.getByLabelText('六位數驗證碼')).toHaveValue('')
    expect(button).toBeDisabled()
    expect(screen.getByTestId('location').textContent).toBe(entry)
    await act(async () => resolveRefresh({ session, currentLevel: 'aal2', verifiedFactors: [one, two] }))
    expect(screen.getByTestId('location').textContent).toBe('/admin/posts')
  })

  it('renders no form or navigation before auth is ready', () => {
    state.authReady = false
    state.session = null
    renderVerify()
    expect(screen.queryByLabelText('六位數驗證碼')).not.toBeInTheDocument()
    expect(screen.getByTestId('location').textContent).toBe(entry)
  })

  it('awaits sign out before returning to login', async () => {
    let resolveSignOut
    signOut.mockReturnValue(new Promise(resolve => { resolveSignOut = resolve }))
    const user = renderVerify()
    await user.click(screen.getByRole('button', { name: '登出' }))
    expect(signOut).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('location').textContent).toBe(entry)
    await act(async () => resolveSignOut())
    expect(screen.getByTestId('location').textContent).toBe('/login')
  })

  it('does not navigate when sign out returns an error', async () => {
    signOut.mockResolvedValue({ error: new Error('private detail') })
    const user = renderVerify()
    await user.click(screen.getByRole('button', { name: '登出' }))
    expect(await screen.findByText('無法確認登入安全狀態，請稍後再試')).toBeInTheDocument()
    expect(screen.getByTestId('location').textContent).toBe(entry)
  })

  it('stays on verification when failed refresh clears context factors', async () => {
    refreshAuth.mockImplementation(async () => {
      state = { ...state, verifiedFactors: [] }
      throw new Error('private detail')
    })
    const user = renderVerify()
    await submit(user)
    expect(await screen.findByText('無法確認登入安全狀態，請稍後再試')).toBeInTheDocument()
    expect(screen.getByTestId('location').textContent).toBe(entry)
  })

  it.each([
    [[one], '/mfa/setup?returnTo=%2Fadmin%2Fposts'],
    [[one, two], '/admin/posts'],
  ])('recovers cleared security state with factors %j without another code', async (factors, destination) => {
    refreshAuth.mockImplementationOnce(async () => {
      state = { ...state, verifiedFactors: [] }
      throw new Error('private detail')
    }).mockResolvedValueOnce({ session, currentLevel: 'aal2', verifiedFactors: factors })
    const user = renderVerify()
    await submit(user)
    await user.click(await screen.findByRole('button', { name: '重新載入安全狀態' }))
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe(destination))
    expect(refreshAuth).toHaveBeenCalledTimes(2)
    expect(supabase.auth.mfa.challengeAndVerify).toHaveBeenCalledTimes(1)
  })

  it.each(['error', 'no session'])('keeps recovery retryable after %s', async mode => {
    refreshAuth.mockImplementationOnce(async () => {
      state = { ...state, verifiedFactors: [] }
      throw new Error('private detail')
    })
    if (mode === 'error') refreshAuth.mockRejectedValueOnce(new Error('private detail'))
    else refreshAuth.mockResolvedValueOnce({ session: null })
    const user = renderVerify()
    await submit(user)
    await user.click(await screen.findByRole('button', { name: '重新載入安全狀態' }))
    expect(await screen.findByText('無法確認登入安全狀態，請稍後再試')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新載入安全狀態' })).toBeEnabled()
    expect(screen.getByTestId('location').textContent).toBe(entry)
    expect(refreshAuth).toHaveBeenCalledTimes(2)
  })

  it('prevents duplicate recovery and verification while recovery is pending', async () => {
    let resolveRefresh
    refreshAuth.mockRejectedValueOnce(new Error('private detail'))
      .mockReturnValueOnce(new Promise(resolve => { resolveRefresh = resolve }))
    const user = renderVerify()
    await submit(user)
    const retry = await screen.findByRole('button', { name: '重新載入安全狀態' })
    await user.click(retry)
    expect(retry).toBeDisabled()
    await user.click(retry)
    fireEvent.submit(screen.getByRole('button', { name: '驗證', exact: true }).closest('form'))
    expect(refreshAuth).toHaveBeenCalledTimes(2)
    expect(supabase.auth.mfa.challengeAndVerify).toHaveBeenCalledTimes(1)
    await act(async () => resolveRefresh({ session, currentLevel: 'aal2', verifiedFactors: [one, two] }))
    expect(screen.getByTestId('location').textContent).toBe('/admin/posts')
  })
})
