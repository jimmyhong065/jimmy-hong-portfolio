# Admin TOTP MFA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require two enrolled TOTP factors and an `aal2` Supabase session before anyone can use the QA Lens admin UI, admin database policies, or Cloudflare admin APIs.

**Architecture:** Add a single React auth context backed by Supabase MFA state, route password-only sessions through dedicated setup and verification pages, and keep factor management in a focused settings component. Enforce the same boundary again in Cloudflare Pages Functions and `public.is_admin()` so bypassing the browser cannot bypass MFA.

**Tech Stack:** React 18, React Router 6, Supabase Auth MFA, Supabase Postgres RLS, Cloudflare Pages Functions, Vitest, Testing Library

---

## File map

New focused units:

- `src/lib/mfa.js`: pure MFA state loading, safe return-path handling, and destination rules.
- `src/contexts/AuthContext.jsx`: one Supabase auth subscription and one MFA state source for the app.
- `src/pages/MfaVerify.jsx`: challenge an existing TOTP factor.
- `src/pages/MfaSetup.jsx`: enroll and verify a new TOTP factor until two exist.
- `src/components/MfaFactorManager.jsx`: list, add, replace, and remove factors from admin settings.
- `src/components/MfaRequiredRedirect.jsx`: convert an admin API `MFA_REQUIRED` event into SPA navigation.
- `functions/api/__tests__/_auth.test.js`: server authorization contract tests.
- `supabase/migrations/20261017_require_admin_aal2.sql`: production RLS tightening.
- `supabase/rollback/20261017_require_admin_aal2.sql`: emergency, manual-only rollback.
- `docs/admin-mfa-runbook.md`: enrollment, recovery, staged rollout, and smoke-test procedure.

Existing files changed:

- `src/App.jsx`: install `AuthProvider`, register MFA routes, and listen for API step-up events.
- `src/hooks/useAuth.js`: become the small context consumer API.
- `src/components/ProtectedRoute.jsx`: require `aal2` and two verified TOTP factors.
- `src/pages/Login.jsx`: route a successful password login according to MFA state.
- `src/pages/admin/AdminSettings.jsx`: render the security manager outside the site-settings form.
- `src/lib/adminAuth.js`: centralize authenticated admin fetches and `MFA_REQUIRED` signaling.
- `src/hooks/useUpload.js`, `src/pages/admin/AdminPhotos.jsx`, `src/pages/admin/AdminPostEdit.jsx`, `src/pages/admin/AdminSubscribers.jsx`: use the centralized admin fetch.
- `functions/api/_auth.js`: enforce JWT `aal2` after Supabase validates the token.
- `supabase/schema.sql`: keep the bootstrap schema aligned with the migration.
- `README.md`: link the MFA operations runbook and document the `aal2` requirement.

## Task 1: Define the MFA state and routing rules

**Files:**
- Create: `src/lib/mfa.js`
- Create: `src/lib/__tests__/mfa.test.js`

- [ ] **Step 1: Write the failing pure-function tests**

```js
// src/lib/__tests__/mfa.test.js
import { describe, expect, it, vi } from 'vitest'
import {
  REQUIRED_TOTP_FACTORS,
  loadMfaState,
  mfaDestination,
  safeAdminReturnTo,
} from '../mfa'

describe('safeAdminReturnTo', () => {
  it.each(['/admin', '/admin/posts', '/admin/settings?tab=security'])(
    'accepts an internal admin path: %s',
    path => expect(safeAdminReturnTo(path)).toBe(path),
  )

  it.each(['https://evil.example', '//evil.example', '/', '/login', null])(
    'rejects an unsafe return path: %s',
    path => expect(safeAdminReturnTo(path)).toBe('/admin'),
  )
})

describe('mfaDestination', () => {
  const session = { user: { id: 'admin' } }

  it('requires login without a session', () => {
    expect(mfaDestination({ session: null })).toBe('/login')
  })

  it('starts setup when no verified factor exists', () => {
    expect(mfaDestination({ session, currentLevel: 'aal1', verifiedFactors: [] }))
      .toBe('/mfa/setup?returnTo=%2Fadmin')
  })

  it('verifies an existing factor before enrolling a second one', () => {
    expect(mfaDestination({
      session,
      currentLevel: 'aal1',
      verifiedFactors: [{ id: 'one' }],
      returnTo: '/admin/posts',
    })).toBe('/mfa/verify?returnTo=%2Fadmin%2Fposts')
  })

  it('requires a second factor after reaching aal2', () => {
    expect(mfaDestination({
      session,
      currentLevel: 'aal2',
      verifiedFactors: [{ id: 'one' }],
    })).toBe('/mfa/setup?returnTo=%2Fadmin')
  })

  it('returns to admin only at aal2 with two factors', () => {
    expect(REQUIRED_TOTP_FACTORS).toBe(2)
    expect(mfaDestination({
      session,
      currentLevel: 'aal2',
      verifiedFactors: [{ id: 'one' }, { id: 'two' }],
      returnTo: '/admin/settings',
    })).toBe('/admin/settings')
  })
})

describe('loadMfaState', () => {
  it('loads session, AAL, and verified TOTP factors', async () => {
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'admin' } } }, error: null }),
        mfa: {
          listFactors: vi.fn().mockResolvedValue({ data: { totp: [{ id: 'one' }], all: [] }, error: null }),
          getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
            data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null,
          }),
        },
      },
    }

    await expect(loadMfaState(client)).resolves.toMatchObject({
      currentLevel: 'aal1', nextLevel: 'aal2', verifiedFactors: [{ id: 'one' }],
    })
  })
})
```

- [ ] **Step 2: Run the test and confirm the missing module failure**

Run: `npm run test:run -- src/lib/__tests__/mfa.test.js`

Expected: FAIL because `src/lib/mfa.js` does not exist.

- [ ] **Step 3: Implement the complete MFA state helper**

```js
// src/lib/mfa.js
import { supabase } from './supabase'

export const REQUIRED_TOTP_FACTORS = 2

export function safeAdminReturnTo(value) {
  return typeof value === 'string' && value.startsWith('/admin') && !value.startsWith('//')
    ? value
    : '/admin'
}

function mfaUrl(path, returnTo) {
  return `${path}?returnTo=${encodeURIComponent(safeAdminReturnTo(returnTo))}`
}

export function mfaDestination({
  session,
  currentLevel = null,
  verifiedFactors = [],
  returnTo = '/admin',
}) {
  if (!session) return '/login'
  if (verifiedFactors.length === 0) return mfaUrl('/mfa/setup', returnTo)
  if (currentLevel !== 'aal2') return mfaUrl('/mfa/verify', returnTo)
  if (verifiedFactors.length < REQUIRED_TOTP_FACTORS) return mfaUrl('/mfa/setup', returnTo)
  return safeAdminReturnTo(returnTo)
}

export async function loadMfaState(client = supabase) {
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throw sessionError
  const session = sessionData.session
  if (!session) {
    return { session: null, currentLevel: null, nextLevel: null, verifiedFactors: [] }
  }

  const [factorsResult, aalResult] = await Promise.all([
    client.auth.mfa.listFactors(),
    client.auth.mfa.getAuthenticatorAssuranceLevel(),
  ])
  if (factorsResult.error) throw factorsResult.error
  if (aalResult.error) throw aalResult.error

  return {
    session,
    currentLevel: aalResult.data.currentLevel,
    nextLevel: aalResult.data.nextLevel,
    verifiedFactors: factorsResult.data.totp,
  }
}
```

- [ ] **Step 4: Run the focused test**

Run: `npm run test:run -- src/lib/__tests__/mfa.test.js`

Expected: PASS, 14 tests.

- [ ] **Step 5: Commit the state model**

```bash
git add src/lib/mfa.js src/lib/__tests__/mfa.test.js
git commit -m "feat(auth): define admin MFA state rules"
```

## Task 2: Centralize session and MFA state in an auth context

**Files:**
- Create: `src/contexts/AuthContext.jsx`
- Create: `src/contexts/__tests__/AuthContext.test.jsx`
- Modify: `src/hooks/useAuth.js`
- Modify: `src/App.jsx:148-158`

- [ ] **Step 1: Write a failing provider test**

```jsx
// src/contexts/__tests__/AuthContext.test.jsx
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../AuthContext'
import { useAuth } from '../../hooks/useAuth'

const authState = {
  session: { user: { id: 'admin' } },
  currentLevel: 'aal2',
  nextLevel: 'aal2',
  verifiedFactors: [{ id: 'one' }, { id: 'two' }],
}

vi.mock('../../lib/mfa', () => ({ loadMfaState: vi.fn(() => Promise.resolve(authState)) }))
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

describe('AuthProvider', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exposes one loaded MFA state to consumers', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.authReady).toBe(true))
    expect(result.current.currentLevel).toBe('aal2')
    expect(result.current.verifiedFactors).toHaveLength(2)
    expect(result.current.refreshAuth).toEqual(expect.any(Function))
  })
})
```

- [ ] **Step 2: Run the test and confirm the provider is missing**

Run: `npm run test:run -- src/contexts/__tests__/AuthContext.test.jsx`

Expected: FAIL because `AuthContext.jsx` does not exist.

- [ ] **Step 3: Implement the provider and context hook**

```jsx
// src/contexts/AuthContext.jsx
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { loadMfaState } from '../lib/mfa'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext(null)

const EMPTY_AUTH = {
  session: null,
  currentLevel: null,
  nextLevel: null,
  verifiedFactors: [],
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(EMPTY_AUTH)
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState(null)

  const refreshAuth = useCallback(async () => {
    try {
      const next = await loadMfaState()
      setAuth(next)
      setAuthError(null)
      setAuthReady(true)
      return next
    } catch (error) {
      setAuthError(error)
      setAuthReady(true)
      throw error
    }
  }, [])

  useEffect(() => {
    let timer
    refreshAuth().catch(() => {})
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(current => ({ ...current, session }))
      setAuthReady(false)
      timer = window.setTimeout(() => refreshAuth().catch(() => {}), 0)
    })
    return () => {
      window.clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [refreshAuth])

  const signOut = useCallback(async () => {
    const result = await supabase.auth.signOut()
    if (!result.error) {
      setAuth(EMPTY_AUTH)
      setAuthReady(true)
    }
    return result
  }, [])

  const value = useMemo(() => ({
    ...auth,
    authReady,
    loading: !authReady,
    authError,
    refreshAuth,
    signOut,
  }), [auth, authReady, authError, refreshAuth, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

```js
// src/hooks/useAuth.js
import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
```

Wrap the existing app providers in `src/App.jsx`:

```jsx
<BrowserRouter>
  <AuthProvider>
    <SiteSettingsProvider>
      <PushNavigationHandler />
      <GAPageView />
      <BotDetection />
      <AppRoutes />
    </SiteSettingsProvider>
  </AuthProvider>
</BrowserRouter>
```

- [ ] **Step 4: Run the provider test and the existing protected-route test**

Run: `npm run test:run -- src/contexts/__tests__/AuthContext.test.jsx src/components/__tests__/ProtectedRoute.test.jsx`

Expected: provider test PASS; existing route tests may still PASS because they mock `useAuth`.

- [ ] **Step 5: Commit the auth context**

```bash
git add src/contexts/AuthContext.jsx src/contexts/__tests__/AuthContext.test.jsx src/hooks/useAuth.js src/App.jsx
git commit -m "refactor(auth): centralize session and MFA state"
```

## Task 3: Enforce MFA in the admin route guard

**Files:**
- Modify: `src/components/ProtectedRoute.jsx`
- Modify: `src/components/__tests__/ProtectedRoute.test.jsx`

- [ ] **Step 1: Replace the route tests with the complete MFA matrix**

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

import { useAuth } from '../../hooks/useAuth'
import ProtectedRoute from '../ProtectedRoute'

const session = { user: { id: 'admin' } }
const one = { id: 'one' }
const two = { id: 'two' }

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/admin/posts']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/mfa/setup" element={<div>Setup Page</div>} />
        <Route path="/mfa/verify" element={<div>Verify Page</div>} />
        <Route path="/admin/*" element={<ProtectedRoute><div>Admin Content</div></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>,
  )
}

it.each([
  ['no session', { session: null, authReady: true, verifiedFactors: [] }, 'Login Page'],
  ['no factor', { session, authReady: true, currentLevel: 'aal1', verifiedFactors: [] }, 'Setup Page'],
  ['one factor at aal1', { session, authReady: true, currentLevel: 'aal1', verifiedFactors: [one] }, 'Verify Page'],
  ['one factor at aal2', { session, authReady: true, currentLevel: 'aal2', verifiedFactors: [one] }, 'Setup Page'],
  ['two factors at aal2', { session, authReady: true, currentLevel: 'aal2', verifiedFactors: [one, two] }, 'Admin Content'],
])('%s routes to the expected boundary', (_name, auth, expected) => {
  useAuth.mockReturnValue(auth)
  renderGuard()
  expect(screen.getByText(expected)).toBeInTheDocument()
})

it('renders no protected content or redirect while auth state loads', () => {
  useAuth.mockReturnValue({ session: null, authReady: false, verifiedFactors: [] })
  const { container } = renderGuard()
  expect(container).toBeEmptyDOMElement()
})
```

This replaces the previous three session-only cases with the full MFA matrix.

- [ ] **Step 2: Run the route tests and verify the old guard fails MFA cases**

Run: `npm run test:run -- src/components/__tests__/ProtectedRoute.test.jsx`

Expected: FAIL because the existing guard renders any valid session.

- [ ] **Step 3: Implement the route decision**

```jsx
// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { mfaDestination } from '../lib/mfa'

export default function ProtectedRoute({ children }) {
  const auth = useAuth()
  const location = useLocation()
  if (!auth.authReady) return null

  const returnTo = `${location.pathname}${location.search}`
  const destination = mfaDestination({ ...auth, returnTo })
  if (destination !== returnTo) return <Navigate to={destination} replace />
  return children
}
```

- [ ] **Step 4: Run the route tests**

Run: `npm run test:run -- src/components/__tests__/ProtectedRoute.test.jsx`

Expected: PASS for all six route states.

- [ ] **Step 5: Commit the route boundary**

```bash
git add src/components/ProtectedRoute.jsx src/components/__tests__/ProtectedRoute.test.jsx
git commit -m "feat(auth): require MFA for admin routes"
```

## Task 4: Route password login into the MFA flow

**Files:**
- Modify: `src/pages/Login.jsx`
- Create: `src/pages/__tests__/Login.test.jsx`

- [ ] **Step 1: Write failing login destination tests**

Create `Login.test.jsx` with mocked `supabase.auth.signInWithPassword` and mocked `useAuth().refreshAuth`. Cover these exact outcomes:

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { signInWithPassword, refreshAuth } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  refreshAuth: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({ supabase: { auth: { signInWithPassword } } }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ refreshAuth }) }))

import Login from '../Login'

function Location() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}{location.search}</span>
}

function renderLogin() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="*" element={<><Login /><Location /></>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  signInWithPassword.mockResolvedValue({ error: null })
})

it.each([
  [{ currentLevel: 'aal1', verifiedFactors: [] }, '/mfa/setup?returnTo=%2Fadmin'],
  [{ currentLevel: 'aal1', verifiedFactors: [{ id: 'one' }] }, '/mfa/verify?returnTo=%2Fadmin'],
  [{ currentLevel: 'aal2', verifiedFactors: [{ id: 'one' }, { id: 'two' }] }, '/admin'],
])('navigates after password login', async (mfaState, expectedPath) => {
  const user = userEvent.setup()
  refreshAuth.mockResolvedValue({ session: { user: { id: 'admin' } }, ...mfaState })
  renderLogin()
  await user.type(screen.getByPlaceholderText('your@email.com'), 'admin@example.com')
  await user.type(screen.getByPlaceholderText('密碼'), 'password')
  await user.click(screen.getByRole('button', { name: '登入' }))
  expect(await screen.findByTestId('location')).toHaveTextContent(expectedPath)
})

it('keeps the user on login when the password is rejected', async () => {
  const user = userEvent.setup()
  signInWithPassword.mockResolvedValue({ error: new Error('invalid') })
  renderLogin()
  await user.type(screen.getByPlaceholderText('your@email.com'), 'admin@example.com')
  await user.type(screen.getByPlaceholderText('密碼'), 'bad-password')
  await user.click(screen.getByRole('button', { name: '登入' }))
  expect(await screen.findByText('帳號或密碼錯誤')).toBeInTheDocument()
  expect(refreshAuth).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run the login tests and confirm direct `/admin` navigation fails**

Run: `npm run test:run -- src/pages/__tests__/Login.test.jsx`

Expected: FAIL for setup and verification destinations.

- [ ] **Step 3: Update the submit handler**

```jsx
const { refreshAuth } = useAuth()
const location = useLocation()

async function handleSubmit(e) {
  e.preventDefault()
  setLoading(true)
  setError(null)
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    setError('帳號或密碼錯誤')
    setLoading(false)
    return
  }

  try {
    const next = await refreshAuth()
    const returnTo = new URLSearchParams(location.search).get('returnTo')
    navigate(mfaDestination({ ...next, returnTo }))
  } catch {
    setError('無法確認登入安全狀態，請稍後再試')
    setLoading(false)
  }
}
```

Add imports for `useLocation`, `useAuth`, and `mfaDestination`. Do not log the Supabase error or session.

- [ ] **Step 4: Run login and helper tests**

Run: `npm run test:run -- src/pages/__tests__/Login.test.jsx src/lib/__tests__/mfa.test.js`

Expected: PASS.

- [ ] **Step 5: Commit password-to-MFA routing**

```bash
git add src/pages/Login.jsx src/pages/__tests__/Login.test.jsx
git commit -m "feat(auth): route password login through MFA"
```

## Task 5: Build the existing-factor verification page

**Files:**
- Create: `src/pages/MfaVerify.jsx`
- Create: `src/pages/__tests__/MfaVerify.test.jsx`
- Modify: `src/App.jsx:18-45,111-115`

- [ ] **Step 1: Write failing verification tests**

Mock `useAuth` with one verified factor and `supabase.auth.mfa.challengeAndVerify`. Test the following complete behavior:

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'

const { challengeAndVerify, refreshAuth, signOut, useAuth } = vi.hoisted(() => ({
  challengeAndVerify: vi.fn(), refreshAuth: vi.fn(), signOut: vi.fn(), useAuth: vi.fn(),
}))
const session = { user: { id: 'admin' } }
const factor = { id: 'one', friendly_name: '手機' }

vi.mock('../../lib/supabase', () => ({ supabase: { auth: { mfa: { challengeAndVerify } } } }))
vi.mock('../../hooks/useAuth', () => ({ useAuth }))

const defaultAuth = {
    session, currentLevel: 'aal1', verifiedFactors: [factor], authReady: true,
    refreshAuth, signOut,
}

import MfaVerify from '../MfaVerify'

function Location() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}{location.search}</span>
}

function renderPage(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path="*" element={<><MfaVerify /><Location /></>} /></Routes>
    </MemoryRouter>,
  )
}

async function submitCode(value) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('六位數驗證碼'), value)
  await user.click(screen.getByRole('button', { name: '驗證' }))
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuth.mockReturnValue(defaultAuth)
})

it('verifies the selected factor and continues to second-factor setup', async () => {
  challengeAndVerify.mockResolvedValue({ data: {}, error: null })
  refreshAuth.mockResolvedValue({
    session,
    currentLevel: 'aal2',
    verifiedFactors: [{ id: 'one', friendly_name: '手機' }],
  })
  renderPage('/mfa/verify?returnTo=%2Fadmin%2Fposts')
  await submitCode('123456')
  expect(challengeAndVerify).toHaveBeenCalledWith({ factorId: 'one', code: '123456' })
  expect(await screen.findByTestId('location')).toHaveTextContent('/mfa/setup?returnTo=%2Fadmin%2Fposts')
})

it('shows an actionable message for an invalid code', async () => {
  challengeAndVerify.mockResolvedValue({ data: null, error: new Error('invalid') })
  renderPage('/mfa/verify')
  await submitCode('000000')
  expect(await screen.findByText('驗證碼錯誤或已過期，請輸入目前顯示的代碼')).toBeInTheDocument()
})

it('redirects an unauthenticated visitor to login', async () => {
  useAuth.mockReturnValue({ ...defaultAuth, session: null, verifiedFactors: [] })
  renderPage('/mfa/verify')
  expect(await screen.findByTestId('location')).toHaveTextContent('/login')
})

it('redirects a user without factors to setup', async () => {
  useAuth.mockReturnValue({ ...defaultAuth, verifiedFactors: [] })
  renderPage('/mfa/verify?returnTo=%2Fadmin%2Fposts')
  expect(await screen.findByTestId('location')).toHaveTextContent('/mfa/setup?returnTo=%2Fadmin%2Fposts')
})
```

- [ ] **Step 2: Run the test and confirm the page is missing**

Run: `npm run test:run -- src/pages/__tests__/MfaVerify.test.jsx`

Expected: FAIL because `MfaVerify.jsx` does not exist.

- [ ] **Step 3: Implement verification without persisting codes**

The page implementation must contain this handler and render a labeled six-digit input, factor selector when more than one factor exists, error text, submit button, and sign-out button:

```jsx
async function handleVerify(event) {
  event.preventDefault()
  if (!/^\d{6}$/.test(code)) {
    setError('請輸入六位數驗證碼')
    return
  }
  setLoading(true)
  setError(null)
  const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
    factorId: selectedFactorId,
    code,
  })
  setCode('')
  if (verifyError) {
    setError('驗證碼錯誤或已過期，請輸入目前顯示的代碼')
    setLoading(false)
    return
  }
  try {
    const next = await refreshAuth()
    navigate(mfaDestination({ ...next, returnTo }))
  } catch {
    setError('無法確認登入安全狀態，請稍後再試')
    setLoading(false)
  }
}
```

Use `safeAdminReturnTo(new URLSearchParams(location.search).get('returnTo'))`. On render, redirect unauthenticated users to `/login`; redirect a user with zero verified factors to setup. Add the lazy import and route:

```jsx
const MfaVerify = lazy(() => import('./pages/MfaVerify'))
// ...
<Route path="/mfa/verify" element={<MfaVerify />} />
```

- [ ] **Step 4: Run verification and route tests**

Run: `npm run test:run -- src/pages/__tests__/MfaVerify.test.jsx src/components/__tests__/ProtectedRoute.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit the verification page**

```bash
git add src/pages/MfaVerify.jsx src/pages/__tests__/MfaVerify.test.jsx src/App.jsx
git commit -m "feat(auth): verify TOTP during admin login"
```

## Task 6: Build two-factor enrollment

**Files:**
- Create: `src/pages/MfaSetup.jsx`
- Create: `src/pages/__tests__/MfaSetup.test.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Write failing enrollment tests**

Mock `listFactors`, `unenroll`, `enroll`, `challengeAndVerify`, and `refreshAuth`. Cover:

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'

const { listFactors, unenroll, enroll, challengeAndVerify, refreshAuth, signOut, useAuth } = vi.hoisted(() => ({
  listFactors: vi.fn(), unenroll: vi.fn(), enroll: vi.fn(),
  challengeAndVerify: vi.fn(), refreshAuth: vi.fn(), signOut: vi.fn(), useAuth: vi.fn(),
}))
const session = { user: { id: 'admin' } }
const one = { id: 'one', friendly_name: '手機' }
const two = { id: 'two', friendly_name: '備援' }

vi.mock('../../lib/supabase', () => ({
  supabase: { auth: { mfa: { listFactors, unenroll, enroll, challengeAndVerify } } },
}))
vi.mock('../../hooks/useAuth', () => ({ useAuth }))

const defaultAuth = {
    session, currentLevel: 'aal2', verifiedFactors: [], authReady: true,
    refreshAuth, signOut,
}

import MfaSetup from '../MfaSetup'

function Location() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}{location.search}</span>
}

function renderPage(path = '/mfa/setup') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path="*" element={<><MfaSetup /><Location /></>} /></Routes>
    </MemoryRouter>,
  )
}

async function startEnrollment(name) {
  const user = userEvent.setup()
  const input = screen.getByLabelText('驗證器名稱')
  await user.clear(input)
  await user.type(input, name)
  await user.click(screen.getByRole('button', { name: '產生 QR Code' }))
}

async function submitCode(value) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('六位數驗證碼'), value)
  await user.click(screen.getByRole('button', { name: '驗證並啟用' }))
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuth.mockReturnValue(defaultAuth)
  listFactors.mockResolvedValue({ data: { all: [], totp: [] }, error: null })
  unenroll.mockResolvedValue({ data: {}, error: null })
  enroll.mockResolvedValue({
    data: { id: 'new', totp: { qr_code: 'data:image/svg+xml;utf-8,<svg/>', secret: 'SECRET' } },
    error: null,
  })
  challengeAndVerify.mockResolvedValue({ data: {}, error: null })
})

it('removes stale unverified TOTP factors before enrollment', async () => {
  listFactors.mockResolvedValue({
    data: { all: [{ id: 'stale', factor_type: 'totp', status: 'unverified' }], totp: [] },
    error: null,
  })
  enroll.mockResolvedValue({
    data: { id: 'new', totp: { qr_code: 'data:image/svg+xml;utf-8,<svg/>', secret: 'SECRET' } },
    error: null,
  })
  renderPage('/mfa/setup')
  await startEnrollment('手機')
  expect(unenroll).toHaveBeenCalledWith({ factorId: 'stale' })
  expect(enroll).toHaveBeenCalledWith({ factorType: 'totp', friendlyName: '手機', issuer: 'QA Lens' })
  expect(await screen.findByAltText('TOTP QR Code')).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'))
})

it('keeps setup open after the first factor and exits after the second', async () => {
  challengeAndVerify.mockResolvedValue({ data: {}, error: null })
  refreshAuth.mockResolvedValue({ session, currentLevel: 'aal2', verifiedFactors: [one] })
  renderPage()
  await startEnrollment('手機')
  await submitCode('123456')
  expect(await screen.findByText('還需要再新增 1 個備援驗證器')).toBeInTheDocument()

  refreshAuth.mockResolvedValue({ session, currentLevel: 'aal2', verifiedFactors: [one, two] })
  await startEnrollment('備援')
  await submitCode('654321')
  expect(await screen.findByTestId('location')).toHaveTextContent('/admin')
})

it('rejects a duplicate friendly name before enrollment', async () => {
  useAuth.mockReturnValue({ ...defaultAuth, verifiedFactors: [one] })
  renderPage()
  await startEnrollment('手機')
  expect(await screen.findByText('驗證器名稱不可重複')).toBeInTheDocument()
  expect(enroll).not.toHaveBeenCalled()
})

it('rejects a non-six-digit verification code', async () => {
  renderPage()
  await startEnrollment('手機')
  await submitCode('123')
  expect(await screen.findByText('請輸入六位數驗證碼')).toBeInTheDocument()
  expect(challengeAndVerify).not.toHaveBeenCalled()
})

it('shows enrollment and verification failures without logging secrets', async () => {
  enroll.mockResolvedValueOnce({ data: null, error: new Error('network') })
  renderPage()
  await startEnrollment('手機')
  expect(await screen.findByText('無法產生驗證器設定，請稍後再試')).toBeInTheDocument()

  enroll.mockResolvedValueOnce({
    data: { id: 'new', totp: { qr_code: 'data:image/svg+xml;utf-8,<svg/>', secret: 'SECRET' } },
    error: null,
  })
  challengeAndVerify.mockResolvedValueOnce({ data: null, error: new Error('invalid') })
  await startEnrollment('手機')
  await submitCode('000000')
  expect(await screen.findByText('驗證碼錯誤或已過期，請輸入目前顯示的代碼')).toBeInTheDocument()
})

it('redirects an unauthenticated visitor to login', async () => {
  useAuth.mockReturnValue({ ...defaultAuth, session: null })
  renderPage()
  expect(await screen.findByTestId('location')).toHaveTextContent('/login')
})

it('verifies the existing factor before adding a second factor', async () => {
  useAuth.mockReturnValue({
    ...defaultAuth, currentLevel: 'aal1', verifiedFactors: [one],
  })
  renderPage('/mfa/setup?returnTo=%2Fadmin%2Fsettings')
  expect(await screen.findByTestId('location')).toHaveTextContent('/mfa/verify?returnTo=%2Fadmin%2Fsettings')
})
```

- [ ] **Step 2: Run the test and confirm the page is missing**

Run: `npm run test:run -- src/pages/__tests__/MfaSetup.test.jsx`

Expected: FAIL because `MfaSetup.jsx` does not exist.

- [ ] **Step 3: Implement enrollment and safe retry**

Use these handlers as the page's complete state transition core:

```jsx
function fail(message) {
  setError(message)
  setLoading(false)
  return null
}

async function startEnrollment(event) {
  event.preventDefault()
  const name = friendlyName.trim()
  if (!name) return setError('請輸入驗證器名稱')
  if (verifiedFactors.some(f => f.friendly_name === name)) return setError('驗證器名稱不可重複')

  setLoading(true)
  setError(null)
  const listed = await supabase.auth.mfa.listFactors()
  if (listed.error) return fail('無法讀取驗證器，請稍後再試')
  const stale = listed.data.all.filter(f => f.factor_type === 'totp' && f.status === 'unverified')
  for (const factor of stale) {
    const removed = await supabase.auth.mfa.unenroll({ factorId: factor.id })
    if (removed.error) return fail('無法清理未完成的設定，請稍後再試')
  }

  const result = await supabase.auth.mfa.enroll({
    factorType: 'totp', friendlyName: name, issuer: 'QA Lens',
  })
  if (result.error) return fail('無法產生驗證器設定，請稍後再試')
  setEnrollment(result.data)
  setLoading(false)
}

async function verifyEnrollment(event) {
  event.preventDefault()
  if (!/^\d{6}$/.test(code)) return setError('請輸入六位數驗證碼')
  setLoading(true)
  setError(null)
  const result = await supabase.auth.mfa.challengeAndVerify({
    factorId: enrollment.id, code,
  })
  setCode('')
  if (result.error) return fail('驗證碼錯誤或已過期，請輸入目前顯示的代碼')

  setEnrollment(null)
  setFriendlyName('')
  const next = await refreshAuth()
  if (next.verifiedFactors.length >= REQUIRED_TOTP_FACTORS) {
    navigate(safeAdminReturnTo(returnTo))
  } else {
    setNotice(`還需要再新增 ${REQUIRED_TOTP_FACTORS - next.verifiedFactors.length} 個備援驗證器`)
    setLoading(false)
  }
}
```

Render the secret only in the active enrollment state, in a read-only field with copy button. Never place `enrollment`, `secret`, `code`, session, or errors in `console.*`. Add:

```jsx
const MfaSetup = lazy(() => import('./pages/MfaSetup'))
// ...
<Route path="/mfa/setup" element={<MfaSetup />} />
```

- [ ] **Step 4: Run setup, verification, and guard tests**

Run: `npm run test:run -- src/pages/__tests__/MfaSetup.test.jsx src/pages/__tests__/MfaVerify.test.jsx src/components/__tests__/ProtectedRoute.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit enrollment**

```bash
git add src/pages/MfaSetup.jsx src/pages/__tests__/MfaSetup.test.jsx src/App.jsx
git commit -m "feat(auth): require two TOTP factors"
```

## Task 7: Add factor management to admin settings

**Files:**
- Create: `src/components/MfaFactorManager.jsx`
- Create: `src/components/__tests__/MfaFactorManager.test.jsx`
- Create: `src/pages/admin/__tests__/AdminSettings.test.jsx`
- Modify: `src/pages/admin/AdminSettings.jsx:626-635`

- [ ] **Step 1: Write failing factor-management tests**

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'

const { useAuth, unenroll, refreshAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(), unenroll: vi.fn(), refreshAuth: vi.fn(),
}))
const one = { id: 'one', friendly_name: 'one' }
const two = { id: 'two', friendly_name: 'two' }
const three = { id: 'three', friendly_name: 'three' }

vi.mock('../../hooks/useAuth', () => ({ useAuth }))
vi.mock('../../lib/supabase', () => ({ supabase: { auth: { mfa: { unenroll } } } }))

import MfaFactorManager from '../MfaFactorManager'

function renderManager() {
  return render(<MemoryRouter><MfaFactorManager /></MemoryRouter>)
}

beforeEach(() => vi.clearAllMocks())

it('requires adding a replacement before removing from two factors', () => {
  useAuth.mockReturnValue({ verifiedFactors: [one, two], refreshAuth })
  renderManager()
  expect(screen.getAllByRole('button', { name: /移除/ })).toHaveLength(2)
  expect(screen.getAllByRole('button', { name: /移除/ }).every(button => button.disabled)).toBe(true)
  expect(screen.getByText('請先新增並驗證替代裝置，再移除舊裝置。')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '新增驗證器' }))
    .toHaveAttribute('href', '/mfa/setup?returnTo=%2Fadmin%2Fsettings')
  expect(screen.getByText(/不支援直接重新命名/)).toBeInTheDocument()
})

it('removes one factor when three remain', async () => {
  useAuth.mockReturnValue({ verifiedFactors: [one, two, three], refreshAuth })
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  unenroll.mockResolvedValue({ data: { id: 'three' }, error: null })
  renderManager()
  await userEvent.click(screen.getByRole('button', { name: '移除 three' }))
  expect(unenroll).toHaveBeenCalledWith({ factorId: 'three' })
  expect(refreshAuth).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run the test and confirm the component is missing**

Run: `npm run test:run -- src/components/__tests__/MfaFactorManager.test.jsx`

Expected: FAIL because `MfaFactorManager.jsx` does not exist.

- [ ] **Step 3: Implement factor management**

```jsx
// src/components/MfaFactorManager.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { REQUIRED_TOTP_FACTORS } from '../lib/mfa'
import { supabase } from '../lib/supabase'

export default function MfaFactorManager() {
  const { verifiedFactors, refreshAuth } = useAuth()
  const [error, setError] = useState(null)
  const [removing, setRemoving] = useState(null)
  const canRemove = verifiedFactors.length > REQUIRED_TOTP_FACTORS

  async function removeFactor(factor) {
    if (!canRemove || !window.confirm(`確定移除「${factor.friendly_name || factor.id}」？`)) return
    setRemoving(factor.id)
    setError(null)
    const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
    if (removeError) setError('移除失敗，請確認登入驗證仍有效後再試')
    else await refreshAuth()
    setRemoving(null)
  }

  return (
    <section className="mt-10 border-t border-gray-200 pt-8" aria-labelledby="mfa-heading">
      <h2 id="mfa-heading" className="text-base font-bold">登入安全性</h2>
      <p className="text-xs text-gray-500 mt-1">後台要求兩個 TOTP 驗證器與 aal2 登入。</p>
      <ul className="mt-4 space-y-2">
        {verifiedFactors.map(factor => (
          <li key={factor.id} className="flex items-center justify-between border rounded-lg p-3">
            <span className="text-sm">{factor.friendly_name || '未命名驗證器'}</span>
            <button
              type="button"
              aria-label={`移除 ${factor.friendly_name || factor.id}`}
              disabled={!canRemove || removing === factor.id}
              onClick={() => removeFactor(factor)}
            >移除</button>
          </li>
        ))}
      </ul>
      {!canRemove && <p className="text-xs text-amber-600 mt-3">請先新增並驗證替代裝置，再移除舊裝置。</p>}
      <p className="text-xs text-gray-400 mt-2">Supabase 不支援直接重新命名；請新增新 factor 後移除舊 factor。</p>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      <Link className="inline-block text-sm mt-4 underline" to="/mfa/setup?returnTo=%2Fadmin%2Fsettings">
        新增驗證器
      </Link>
    </section>
  )
}
```

Import and render `<MfaFactorManager />` immediately after the existing settings `<form>` in `AdminSettings.jsx`, so factor actions never submit the site-settings form.

- [ ] **Step 4: Run manager and settings tests**

Run: `npm run test:run -- src/components/__tests__/MfaFactorManager.test.jsx src/pages/admin/__tests__/AdminSettings.test.jsx`

Expected: manager tests PASS. `AdminSettings.test.jsx` mocks `useSiteSettings`, `useUpload`, `supabase.from`, and `MfaFactorManager`, renders `AdminSettings`, and asserts the mocked `登入安全性` marker appears after the settings form.

Use this smoke test:

```jsx
import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

vi.mock('../../../contexts/SiteSettingsContext', () => ({
  useSiteSettings: () => ({ refresh: vi.fn() }),
}))
vi.mock('../../../hooks/useUpload', () => ({
  useUpload: () => ({ uploading: false, uploadError: null, uploadOne: vi.fn() }),
}))
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null }) })),
      })),
    })),
  },
}))
vi.mock('../../../components/MfaFactorManager', () => ({
  default: () => <section>登入安全性</section>,
}))

import AdminSettings from '../AdminSettings'

it('renders login security outside the site settings form', () => {
  const { container } = render(<AdminSettings />)
  const security = screen.getByText('登入安全性')
  expect(security).toBeInTheDocument()
  expect(container.querySelector('form')?.contains(security)).toBe(false)
})
```

- [ ] **Step 5: Commit settings management**

```bash
git add src/components/MfaFactorManager.jsx src/components/__tests__/MfaFactorManager.test.jsx src/pages/admin/AdminSettings.jsx src/pages/admin/__tests__/AdminSettings.test.jsx
git commit -m "feat(auth): manage backup TOTP factors"
```

## Task 8: Centralize admin API step-up handling

**Files:**
- Modify: `src/lib/adminAuth.js`
- Create: `src/lib/__tests__/adminAuth.test.js`
- Create: `src/components/MfaRequiredRedirect.jsx`
- Create: `src/components/__tests__/MfaRequiredRedirect.test.jsx`
- Modify: `src/App.jsx`
- Modify: `src/hooks/useUpload.js`
- Modify: `src/pages/admin/AdminPhotos.jsx`
- Modify: `src/pages/admin/AdminPostEdit.jsx:272-308`
- Modify: `src/pages/admin/AdminSubscribers.jsx:115-153`

- [ ] **Step 1: Write failing centralized-fetch tests**

```js
// src/lib/__tests__/adminAuth.test.js
import { afterEach, describe, expect, it, vi } from 'vitest'
import { adminFetch, MFA_REQUIRED_EVENT } from '../adminAuth'

vi.mock('../supabase', () => ({
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({
    data: { session: { access_token: 'test-token' } },
  }) } },
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('adds the current bearer token without losing caller headers', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
  await adminFetch('/api/email-send', { headers: { 'Content-Type': 'application/json' } })
  const headers = fetch.mock.calls[0][1].headers
  expect(headers.get('Authorization')).toBe('Bearer test-token')
  expect(headers.get('Content-Type')).toBe('application/json')
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
```

- [ ] **Step 2: Run the test and verify `adminFetch` is missing**

Run: `npm run test:run -- src/lib/__tests__/adminAuth.test.js`

Expected: FAIL because `adminFetch` and `MFA_REQUIRED_EVENT` are not exported.

- [ ] **Step 3: Implement authenticated fetch and the SPA listener**

```js
// src/lib/adminAuth.js
import { supabase } from './supabase'

export const MFA_REQUIRED_EVENT = 'admin:mfa-required'

export async function adminAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token ?? ''}` }
}

export async function adminFetch(input, init = {}) {
  const headers = new Headers(init.headers)
  const auth = await adminAuthHeader()
  headers.set('Authorization', auth.Authorization)
  const response = await fetch(input, { ...init, headers })
  if (response.status === 403) {
    const payload = await response.clone().json().catch(() => null)
    if (payload?.code === 'MFA_REQUIRED') {
      window.dispatchEvent(new CustomEvent(MFA_REQUIRED_EVENT))
    }
  }
  return response
}
```

```jsx
// src/components/MfaRequiredRedirect.jsx
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MFA_REQUIRED_EVENT } from '../lib/adminAuth'
import { safeAdminReturnTo } from '../lib/mfa'

export default function MfaRequiredRedirect() {
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const redirect = () => {
      const returnTo = safeAdminReturnTo(`${location.pathname}${location.search}`)
      navigate(`/mfa/verify?returnTo=${encodeURIComponent(returnTo)}`, { replace: true })
    }
    window.addEventListener(MFA_REQUIRED_EVENT, redirect)
    return () => window.removeEventListener(MFA_REQUIRED_EVENT, redirect)
  }, [location.pathname, location.search, navigate])
  return null
}
```

Mount `<MfaRequiredRedirect />` next to `PushNavigationHandler` in `App.jsx`. Its test dispatches `new CustomEvent(MFA_REQUIRED_EVENT)` from an `/admin/posts` route and asserts navigation to `/mfa/verify?returnTo=%2Fadmin%2Fposts`.

- [ ] **Step 4: Replace every admin `fetch` call**

Use `adminFetch` in all six management call sites and remove manual authorization headers:

```js
const res = await adminFetch('/api/email-send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
```

Apply that pattern to `/api/push-send`, `/upload`, both `/r2-manage` methods, `/api/admin/subscribers`, and `/api/admin/email-broadcast`. Keep public `/api/push-subscribe` calls unchanged.

- [ ] **Step 5: Run focused admin API client tests**

Run: `npm run test:run -- src/lib/__tests__/adminAuth.test.js src/components/__tests__/MfaRequiredRedirect.test.jsx src/pages/admin/__tests__/AdminSubscribers.test.jsx src/hooks/__tests__/useUpload.test.js src/pages/admin/__tests__/AdminPostEdit.test.jsx`

Expected: PASS. Existing fetch assertions should now see a `Headers` instance; update tests to use `headers.get('Authorization')` where necessary.

- [ ] **Step 6: Commit centralized client enforcement**

```bash
git add src/lib/adminAuth.js src/lib/__tests__/adminAuth.test.js src/components/MfaRequiredRedirect.jsx src/components/__tests__/MfaRequiredRedirect.test.jsx src/App.jsx src/hooks/useUpload.js src/pages/admin/AdminPhotos.jsx src/pages/admin/AdminPostEdit.jsx src/pages/admin/AdminSubscribers.jsx src/pages/admin/__tests__/AdminSubscribers.test.jsx src/hooks/__tests__/useUpload.test.js src/pages/admin/__tests__/AdminPostEdit.test.jsx
git commit -m "feat(auth): handle MFA-required admin APIs"
```

## Task 9: Enforce `aal2` in Cloudflare Pages Functions

**Files:**
- Modify: `functions/api/_auth.js`
- Create: `functions/api/__tests__/_auth.test.js`

- [ ] **Step 1: Write the server authorization contract tests**

```js
// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { requireAdmin } from '../_auth'

const env = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
  ADMIN_EMAIL: 'admin@example.com',
}

function token(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `eyJhbGciOiJIUzI1NiJ9.${encoded}.signature`
}

function request(accessToken) {
  return new Request('https://qa-lens.com/api/admin/subscribers', {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  })
}

afterEach(() => vi.restoreAllMocks())

it('returns 401 without a token', async () => {
  expect((await requireAdmin(request(), env)).status).toBe(401)
})

it('returns 401 when Supabase rejects the token', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
  expect((await requireAdmin(request(token({ aal: 'aal2' })), env)).status).toBe(401)
})

it('returns 403 for a non-admin aal2 user', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ email: 'other@example.com' })))
  expect((await requireAdmin(request(token({ aal: 'aal2' })), env)).status).toBe(403)
})

it('returns MFA_REQUIRED for an admin aal1 token', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ email: 'admin@example.com' })))
  const response = await requireAdmin(request(token({ aal: 'aal1' })), env)
  expect(response.status).toBe(403)
  await expect(response.json()).resolves.toEqual({ error: 'MFA required', code: 'MFA_REQUIRED' })
})

it('allows an admin aal2 token', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ email: 'admin@example.com' })))
  await expect(requireAdmin(request(token({ aal: 'aal2' })), env)).resolves.toBeNull()
})

it('rejects a malformed token even if the mocked user endpoint succeeds', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ email: 'admin@example.com' })))
  expect((await requireAdmin(request('not-a-jwt'), env)).status).toBe(401)
})
```

- [ ] **Step 2: Run the server test and verify the `aal1` case fails**

Run: `npm run test:run -- functions/api/__tests__/_auth.test.js`

Expected: FAIL because the existing implementation accepts the admin's `aal1` token.

- [ ] **Step 3: Parse only the already-validated token and require `aal2`**

```js
function deny(error, status, code) {
  return new Response(JSON.stringify({ error, ...(code ? { code } : {}) }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function jwtPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const value = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = value.padEnd(Math.ceil(value.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(padded), char => char.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

export async function requireAdmin(request, env) {
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return deny('Unauthorized', 401)

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${token}` },
  })
  if (!userRes.ok) return deny('Unauthorized', 401)

  const claims = jwtPayload(token)
  if (!claims) return deny('Unauthorized', 401)
  const user = await userRes.json()
  const admin = (env.ADMIN_EMAIL ?? '').toLowerCase()
  if (!admin || (user?.email ?? '').toLowerCase() !== admin) return deny('Forbidden', 403)
  if (claims.aal !== 'aal2') return deny('MFA required', 403, 'MFA_REQUIRED')
  return null
}
```

The `/auth/v1/user` call remains the signature, expiry, and revocation validation. Local decoding reads `aal` only after that succeeds.

- [ ] **Step 4: Run server and affected admin-page tests**

Run: `npm run test:run -- functions/api/__tests__/_auth.test.js src/lib/__tests__/adminAuth.test.js src/pages/admin/__tests__/AdminSubscribers.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit server enforcement**

```bash
git add functions/api/_auth.js functions/api/__tests__/_auth.test.js
git commit -m "feat(auth): require aal2 in admin functions"
```

## Task 10: Require `aal2` in Supabase RLS

**Files:**
- Create: `supabase/migrations/20261017_require_admin_aal2.sql`
- Create: `supabase/rollback/20261017_require_admin_aal2.sql`
- Modify: `supabase/schema.sql:250-258`

- [ ] **Step 1: Add the forward migration**

```sql
-- supabase/migrations/20261017_require_admin_aal2.sql
-- Apply only after two TOTP factors have been verified in production.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'rbingwork1030@gmail.com'
    AND coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
$$;

SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND roles = '{authenticated}'::name[]
ORDER BY tablename, policyname;
```

- [ ] **Step 2: Add a manual-only rollback outside the migrations directory**

```sql
-- supabase/rollback/20261017_require_admin_aal2.sql
-- Emergency use only. This weakens admin authentication until the forward migration is reapplied.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'rbingwork1030@gmail.com'
$$;
```

- [ ] **Step 3: Update the bootstrap schema to match production intent**

Replace `supabase/schema.sql`'s `public.is_admin()` body with the two-condition body from the forward migration. Do not alter anon policies.

- [ ] **Step 4: Verify SQL text and run a transaction-scoped claim check in a non-production database**

Run locally:

```bash
rg -n "is_admin|aal2|authenticated" supabase/schema.sql supabase/migrations/20261017_require_admin_aal2.sql supabase/rollback/20261017_require_admin_aal2.sql
git diff --check -- supabase
```

Then run in a non-production Supabase SQL editor:

```sql
BEGIN;
SELECT set_config('request.jwt.claims', '{"email":"rbingwork1030@gmail.com","aal":"aal1"}', true);
SELECT public.is_admin(); -- expected false
SELECT set_config('request.jwt.claims', '{"email":"rbingwork1030@gmail.com","aal":"aal2"}', true);
SELECT public.is_admin(); -- expected true
SELECT set_config('request.jwt.claims', '{"email":"other@example.com","aal":"aal2"}', true);
SELECT public.is_admin(); -- expected false
ROLLBACK;
```

Expected: local checks exit 0; SQL results are `false`, `true`, `false`.

- [ ] **Step 5: Commit the RLS boundary**

```bash
git add supabase/schema.sql supabase/migrations/20261017_require_admin_aal2.sql supabase/rollback/20261017_require_admin_aal2.sql
git commit -m "feat(auth): require aal2 in admin RLS"
```

## Task 11: Document recovery and verify the complete implementation

**Files:**
- Create: `docs/admin-mfa-runbook.md`
- Modify: `README.md`

- [ ] **Step 1: Write the operations runbook**

Create `docs/admin-mfa-runbook.md` with these exact sections and checklists:

```markdown
# Admin TOTP MFA Runbook

## Before rollout
- [ ] Supabase TOTP enrollment, challenge, and verification are enabled.
- [ ] The admin can sign in with the existing Email and password.
- [ ] Two independent authenticator locations are available.
- [ ] The Supabase account has its own MFA and a recovery method outside the same phone.

## Enrollment
1. Deploy the frontend and Pages Functions without applying the RLS migration yet.
2. Sign in at `/login` and name the first factor by device or app.
3. Scan and verify the first factor.
4. Add and verify the second factor on an independent device or password manager.
5. Sign out, then prove that each factor can complete a fresh login.

## Activate database enforcement
1. Apply `supabase/migrations/20261017_require_admin_aal2.sql`.
2. Confirm an `aal1` token cannot read or write protected admin rows.
3. Confirm an admin `aal2` token can perform the representative smoke tests below.

## Smoke tests
- [ ] Create and edit a draft post.
- [ ] Save one reversible site-setting change, then restore it.
- [ ] Upload a disposable image and remove it.
- [ ] Load the subscriber list.
- [ ] Send email and push only to an approved test target; do not broadcast during smoke testing.
- [ ] Call one admin Pages Function with `aal1` and confirm `403 MFA_REQUIRED`.

## Replace one lost factor
1. Sign in with the remaining factor.
2. Add and verify a replacement, producing three verified factors.
3. Remove the lost factor and confirm two verified factors remain.

## Recover after losing both factors
1. Sign in to the protected Supabase project dashboard.
2. Remove the unavailable factors from the intended Auth user only.
3. Sign in to QA Lens and complete the forced two-factor enrollment again.
4. Repeat both fresh-login checks and the smoke tests.

## Emergency RLS rollback
Apply `supabase/rollback/20261017_require_admin_aal2.sql` only when the MFA flow or provider is unavailable and admin operations are blocked. Record the reason and time, restore the forward migration as soon as the incident is resolved, and repeat the `aal1` denial check.

Never paste QR codes, TOTP secrets, one-time codes, refresh tokens, access tokens, or private account data into this document or logs.
```

- [ ] **Step 2: Link the runbook and state the security boundary in README**

Add under `Content Workflows`:

```markdown
- Admin access requires a Supabase `aal2` session and two verified TOTP factors; see [Admin TOTP MFA Runbook](docs/admin-mfa-runbook.md).
```

- [ ] **Step 3: Run focused tests**

Run:

```bash
npm run test:run -- \
  src/lib/__tests__/mfa.test.js \
  src/contexts/__tests__/AuthContext.test.jsx \
  src/components/__tests__/ProtectedRoute.test.jsx \
  src/pages/__tests__/Login.test.jsx \
  src/pages/__tests__/MfaVerify.test.jsx \
  src/pages/__tests__/MfaSetup.test.jsx \
  src/components/__tests__/MfaFactorManager.test.jsx \
  src/lib/__tests__/adminAuth.test.js \
  functions/api/__tests__/_auth.test.js
```

Expected: all targeted tests PASS.

- [ ] **Step 4: Run the full local verification suite**

Run:

```bash
npm run test:run
npm run lint
npm run build
git diff --check
git status --short
```

Expected: tests, lint, build, and diff check exit 0. `git status` shows only pre-existing unrelated user changes, if any.

- [ ] **Step 5: Inspect the real local UI**

Run `npm run dev`, then use a browser at the printed local URL to check `/login`, `/mfa/setup`, `/mfa/verify`, `/admin/settings`, narrow-screen wrapping, disabled states, loading feedback, and error visibility. Use only a local/test Supabase account during this check unless production enrollment has been explicitly authorized.

Expected: no layout overflow; QR code and manual secret are readable; secret and code disappear after successful verification; navigation matches the route matrix.

- [ ] **Step 6: Commit documentation and final local verification evidence**

```bash
git add docs/admin-mfa-runbook.md README.md
git commit -m "docs(auth): add admin MFA runbook"
```

- [ ] **Step 7: Stop for production authorization**

Report local test, lint, build, and browser results separately. Do not deploy Cloudflare Pages, enroll production factors, send email/push, or apply the production RLS migration until the user explicitly authorizes the staged production rollout.

## Production rollout checklist after explicit authorization

- [ ] Deploy the tested frontend and Pages Functions.
- [ ] Verify the deployed commit and open `/login` from the live domain.
- [ ] Enroll two independent production TOTP factors without recording their secrets.
- [ ] Sign out and prove each factor works in a separate fresh login.
- [ ] Apply `supabase/migrations/20261017_require_admin_aal2.sql`.
- [ ] Verify `aal1` denial at both a Pages Function and a Supabase protected table.
- [ ] Run the approved, non-broadcast production smoke tests from the runbook.
- [ ] Record only timestamps, pass/fail results, deployed commit, and any non-sensitive errors.
