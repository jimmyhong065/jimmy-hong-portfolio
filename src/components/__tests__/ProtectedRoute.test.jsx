import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { vi, describe, it, expect } from 'vitest'

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))
vi.mock('../../lib/supabase', () => ({ supabase: {} }))

import { useAuth } from '../../hooks/useAuth'
import ProtectedRoute from '../ProtectedRoute'

const session = { user: { id: 'admin' } }
const one = { id: 'one' }
const two = { id: 'two' }

function Destination({ children }) {
  const location = useLocation()
  return <><div>{children}</div><output data-testid="destination">{location.pathname}{location.search}</output></>
}

function renderGuard(initialEntry = '/admin/posts') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<Destination>Login Page</Destination>} />
        <Route path="/mfa/setup" element={<Destination>Setup Page</Destination>} />
        <Route path="/mfa/verify" element={<Destination>Verify Page</Destination>} />
        <Route path="/admin/*" element={<ProtectedRoute><div>Admin Content</div></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it.each([
    ['no session', { session: null, authReady: true, verifiedFactors: [] }, 'Login Page'],
    ['no factor', { session, authReady: true, currentLevel: 'aal1', verifiedFactors: [] }, 'Setup Page'],
    ['one factor at aal1', { session, authReady: true, currentLevel: 'aal1', verifiedFactors: [one] }, 'Verify Page'],
    ['one factor at aal2', { session, authReady: true, currentLevel: 'aal2', verifiedFactors: [one] }, 'Setup Page'],
    ['two factors at aal2', { session, authReady: true, currentLevel: 'aal2', verifiedFactors: [one, two] }, 'Admin Content'],
  ])('%s routes to expected boundary', (_name, auth, expected) => {
    useAuth.mockReturnValue(auth)
    renderGuard()
    expect(screen.getByText(expected)).toBeInTheDocument()
    if (expected !== 'Admin Content') expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it.each([null, session])('renders no protected content or redirect while auth state loads (%j)', (loadingSession) => {
    useAuth.mockReturnValue({ session: loadingSession, authReady: false, verifiedFactors: [] })
    const { container } = renderGuard()
    expect(container).toBeEmptyDOMElement()
  })

  it.each([
    [[], 'aal1', '/mfa/setup'],
    [[one], 'aal1', '/mfa/verify'],
    [[one], 'aal2', '/mfa/setup'],
  ])('preserves the current admin path and query for MFA (%j, %s)', (verifiedFactors, currentLevel, path) => {
    useAuth.mockReturnValue({ session, authReady: true, currentLevel, verifiedFactors })
    renderGuard('/admin/settings?tab=security')
    expect(screen.getByTestId('destination')).toHaveTextContent(`${path}?returnTo=%2Fadmin%2Fsettings%3Ftab%3Dsecurity`)
  })

  it('fails closed when an auth error clears MFA state', () => {
    useAuth.mockReturnValue({ session, authReady: true, currentLevel: null, verifiedFactors: [], authError: new Error('MFA state unavailable') })
    renderGuard()
    expect(screen.getByText('Setup Page')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })
})
