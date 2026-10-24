import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelmetProvider } from 'react-helmet-async'
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
    <HelmetProvider><MemoryRouter initialEntries={[path]}>
      <Location /><Routes><Route path="/mfa/setup" element={<MfaSetup />} /><Route path="*" element={<div>Destination</div>} /></Routes>
    </MemoryRouter></HelmetProvider>,
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
  vi.resetAllMocks()
  useAuth.mockReturnValue(defaultAuth)
  listFactors.mockResolvedValue({ data: { all: [], totp: [] }, error: null })
  unenroll.mockResolvedValue({ data: {}, error: null })
  enroll.mockResolvedValue({
    data: { id: 'new', totp: { qr_code: 'data:image/svg+xml;utf-8,<svg/>', secret: 'SECRET' } },
    error: null,
  })
  challengeAndVerify.mockResolvedValue({ data: {}, error: null })
  refreshAuth.mockResolvedValue({ session, currentLevel: 'aal2', verifiedFactors: [one] })
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

it('hides an active enrollment immediately when the session disappears during verification', async () => {
  let resolveVerify
  challengeAndVerify.mockReturnValueOnce(new Promise(resolve => { resolveVerify = resolve }))
  const page = renderPage()
  await startEnrollment('手機')
  await submitCode('123456')
  expect(screen.getByDisplayValue('SECRET')).toBeInTheDocument()

  useAuth.mockReturnValue({ ...defaultAuth, session: null })
  page.rerender(<HelmetProvider><MemoryRouter initialEntries={['/mfa/setup']}>
    <Location /><Routes><Route path="/mfa/setup" element={<MfaSetup />} /><Route path="*" element={<div>Destination</div>} /></Routes>
  </MemoryRouter></HelmetProvider>)
  expect(screen.queryByDisplayValue('SECRET')).not.toBeInTheDocument()
  await act(async () => resolveVerify({ error: { code: 'mfa_factor_not_found' } }))
})

it('does not show a previous account enrollment after the active user changes', async () => {
  const page = renderPage()
  await startEnrollment('手機')
  expect(screen.getByDisplayValue('SECRET')).toBeInTheDocument()

  useAuth.mockReturnValue({ ...defaultAuth, session: { user: { id: 'another-admin' } } })
  page.rerender(<HelmetProvider><MemoryRouter initialEntries={['/mfa/setup']}>
    <Location /><Routes><Route path="/mfa/setup" element={<MfaSetup />} /><Route path="*" element={<div>Destination</div>} /></Routes>
  </MemoryRouter></HelmetProvider>)
  expect(screen.queryByDisplayValue('SECRET')).not.toBeInTheDocument()
  expect(screen.getByLabelText('驗證器名稱')).toBeInTheDocument()
})

it('verifies the existing factor before adding a second factor', async () => {
  useAuth.mockReturnValue({
    ...defaultAuth, currentLevel: 'aal1', verifiedFactors: [one],
  })
  renderPage('/mfa/setup?returnTo=%2Fadmin%2Fsettings')
  expect(await screen.findByTestId('location')).toHaveTextContent('/mfa/verify?returnTo=%2Fadmin%2Fsettings')
})
it('allows a third verified replacement factor', async () => {
  useAuth.mockReturnValue({ ...defaultAuth, verifiedFactors: [one, two] })
  renderPage('/mfa/setup?returnTo=%2Fadmin%2Fsettings')
  await startEnrollment('新手機')
  expect(enroll).toHaveBeenCalledOnce()
  refreshAuth.mockResolvedValue({ session, currentLevel: 'aal2', verifiedFactors: [one, two, { id: 'new' }] })
  await submitCode('123456')
  expect(screen.getByTestId('location')).toHaveTextContent('/admin/settings')
})

it('hides secret and recovers a failed security refresh without enrolling again', async () => {
  refreshAuth.mockRejectedValueOnce(new Error('private')).mockResolvedValueOnce({ session, currentLevel: 'aal2', verifiedFactors: [one, two] })
  renderPage()
  await startEnrollment('手機')
  await submitCode('123456')
  expect(await screen.findByText('無法確認登入安全狀態，請稍後再試')).toBeInTheDocument()
  expect(screen.queryByAltText('TOTP QR Code')).not.toBeInTheDocument()
  expect(screen.queryByDisplayValue('SECRET')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: '重新載入安全狀態' }))
  expect(screen.getByTestId('location')).toHaveTextContent('/admin')
  expect(enroll).toHaveBeenCalledOnce()
  expect(challengeAndVerify).toHaveBeenCalledOnce()
})

it.each(['error', 'throw'])('stops before enrollment if stale cleanup has %s', async mode => {
  listFactors.mockResolvedValue({ data: { all: [{ id: 'old', factor_type: 'totp', status: 'unverified' }] }, error: null })
  if (mode === 'error') unenroll.mockResolvedValue({ error: new Error('private') })
  else unenroll.mockRejectedValue(new Error('private'))
  renderPage()
  await startEnrollment('手機')
  expect(await screen.findByText('無法清理未完成的設定，請稍後再試')).toBeInTheDocument()
  expect(enroll).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: '產生 QR Code' })).toBeEnabled()
})

it('prevents duplicate enrollment and verification while requests are pending', async () => {
  let resolveEnroll
  enroll.mockReturnValueOnce(new Promise(resolve => { resolveEnroll = resolve }))
  renderPage()
  await startEnrollment('手機')
  fireEvent.submit(screen.getByRole('button', { name: '產生 QR Code' }).closest('form'))
  expect(enroll).toHaveBeenCalledOnce()
  await act(async () => resolveEnroll({ data: { id: 'new', totp: { qr_code: 'data:image/svg+xml,<svg/>', secret: 'SECRET' } }, error: null }))
  let resolveVerify
  challengeAndVerify.mockReturnValueOnce(new Promise(resolve => { resolveVerify = resolve }))
  await submitCode('123456')
  fireEvent.submit(screen.getByRole('button', { name: '驗證並啟用' }).closest('form'))
  expect(challengeAndVerify).toHaveBeenCalledOnce()
  await act(async () => resolveVerify({ error: null }))
  await waitFor(() => expect(screen.queryByAltText('TOTP QR Code')).not.toBeInTheDocument())
})

it('fails closed on an auth loading error and offers recovery', () => {
  useAuth.mockReturnValue({ ...defaultAuth, authError: new Error('private') })
  renderPage()
  expect(screen.queryByLabelText('驗證器名稱')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: '重新載入安全狀態' })).toBeEnabled()
})

it('clears a failed code without logging or persisting enrollment material', async () => {
  const consoleSpy = vi.spyOn(console, 'log')
  const storageSpy = vi.spyOn(Storage.prototype, 'setItem')
  challengeAndVerify.mockRejectedValue(new Error('private'))
  renderPage()
  await startEnrollment('手機')
  await submitCode('123456')
  expect(screen.getByLabelText('六位數驗證碼')).toHaveValue('')
  expect(consoleSpy).not.toHaveBeenCalled()
  expect(storageSpy).not.toHaveBeenCalled()
  consoleSpy.mockRestore()
  storageSpy.mockRestore()
})

it.each(['returned', 'thrown'])('clears an unavailable enrollment after a %s error and permits fresh setup', async mode => {
  const unavailable = Object.assign(new Error('private'), { code: 'mfa_factor_not_found' })
  if (mode === 'returned') challengeAndVerify.mockResolvedValueOnce({ error: unavailable })
  else challengeAndVerify.mockRejectedValueOnce(unavailable)
  renderPage()
  await startEnrollment('手機')
  await submitCode('123456')
  expect(await screen.findByText('此設定已失效，請重新產生 QR Code')).toBeInTheDocument()
  expect(screen.queryByAltText('TOTP QR Code')).not.toBeInTheDocument()
  expect(screen.queryByDisplayValue('SECRET')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('六位數驗證碼')).not.toBeInTheDocument()
  enroll.mockResolvedValueOnce({ data: { id: 'replacement', totp: { qr_code: 'data:image/svg+xml,<svg/>', secret: 'NEWSECRET' } }, error: null })
  await startEnrollment('手機')
  expect(enroll).toHaveBeenCalledTimes(2)
  expect(screen.getByDisplayValue('NEWSECRET')).toBeInTheDocument()
  await submitCode('654321')
  expect(challengeAndVerify).toHaveBeenLastCalledWith({ factorId: 'replacement', code: '654321' })
})

it('retains active enrollment for retry after an incorrect code', async () => {
  challengeAndVerify.mockResolvedValueOnce({ error: { code: 'mfa_verification_failed' } })
  renderPage()
  await startEnrollment('手機')
  await submitCode('123456')
  expect(screen.getByAltText('TOTP QR Code')).toBeInTheDocument()
  expect(screen.getByDisplayValue('SECRET')).toBeInTheDocument()
  await submitCode('654321')
  expect(challengeAndVerify).toHaveBeenCalledTimes(2)
  expect(enroll).toHaveBeenCalledOnce()
})
