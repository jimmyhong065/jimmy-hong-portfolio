import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'

const { useAuth, refreshAuth, signOut } = vi.hoisted(() => ({
  useAuth: vi.fn(), refreshAuth: vi.fn(), signOut: vi.fn(),
}))
vi.mock('../../hooks/useAuth', () => ({ useAuth }))
vi.mock('../../lib/adminAuth', () => ({ MFA_REQUIRED_EVENT: 'admin:mfa-required' }))
vi.mock('../../lib/supabase', () => ({ supabase: {} }))

import { MFA_REQUIRED_EVENT } from '../../lib/adminAuth'
import MfaRequiredRedirect from '../MfaRequiredRedirect'

function Location() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}{location.search}</span>
}

function renderListener(path = '/admin/posts?page=2') {
  return render(<MemoryRouter initialEntries={[path]}>
    <MfaRequiredRedirect />
    <Routes><Route path="*" element={<Location />} /></Routes>
  </MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuth.mockReturnValue({ refreshAuth, signOut })
  signOut.mockResolvedValue({ error: null })
})

it('refreshes security state before sending an aal1 admin to verification', async () => {
  refreshAuth.mockResolvedValue({
    session: { user: {} }, currentLevel: 'aal1', verifiedFactors: [{ id: 'first' }],
  })
  renderListener()
  act(() => window.dispatchEvent(new CustomEvent(MFA_REQUIRED_EVENT)))
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(
    '/mfa/verify?returnTo=%2Fadmin%2Fposts%3Fpage%3D2',
  ))
  expect(refreshAuth).toHaveBeenCalledOnce()
})

it('routes to setup if there is no verified factor after refresh', async () => {
  refreshAuth.mockResolvedValue({ session: { user: {} }, currentLevel: 'aal1', verifiedFactors: [] })
  renderListener()
  act(() => window.dispatchEvent(new CustomEvent(MFA_REQUIRED_EVENT)))
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/mfa/setup?returnTo='))
})

it('ends a contradictory aal2 session instead of looping into admin', async () => {
  refreshAuth.mockResolvedValue({
    session: { user: {} }, currentLevel: 'aal2', verifiedFactors: [{ id: 'one' }, { id: 'two' }],
  })
  renderListener()
  act(() => window.dispatchEvent(new CustomEvent(MFA_REQUIRED_EVENT)))
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login'))
  expect(signOut).toHaveBeenCalledOnce()
})
