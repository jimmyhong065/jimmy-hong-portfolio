import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'

const { useAuth, unenroll, refreshAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(), unenroll: vi.fn(), refreshAuth: vi.fn(),
}))
const one = { id: 'one', friendly_name: '手機' }
const two = { id: 'two', friendly_name: '備援' }
const three = { id: 'three', friendly_name: '新裝置' }

vi.mock('../../hooks/useAuth', () => ({ useAuth }))
vi.mock('../../lib/supabase', () => ({ supabase: { auth: { mfa: { unenroll } } } }))

import MfaFactorManager from '../MfaFactorManager'

function renderManager(factors = [one, two, three]) {
  useAuth.mockReturnValue({ verifiedFactors: factors, refreshAuth })
  return render(<MemoryRouter><MfaFactorManager /></MemoryRouter>)
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  refreshAuth.mockResolvedValue({ verifiedFactors: [one, two] })
  unenroll.mockResolvedValue({ data: {}, error: null })
})

it('requires a replacement before either of two verified factors can be removed', () => {
  renderManager([one, two])
  expect(screen.getAllByRole('button', { name: /移除/ })).toHaveLength(2)
  expect(screen.getAllByRole('button', { name: /移除/ }).every(button => button.disabled)).toBe(true)
  expect(screen.getByText('請先新增並驗證替代裝置，再移除舊裝置。')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '新增驗證器' })).toHaveAttribute('href', '/mfa/setup?returnTo=%2Fadmin%2Fsettings')
  expect(screen.getByText(/不支援直接重新命名/)).toBeInTheDocument()
})

it('removes a factor only after confirmation then reloads factors', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  renderManager()
  await userEvent.click(screen.getByRole('button', { name: '移除 新裝置' }))
  expect(unenroll).toHaveBeenCalledWith({ factorId: 'three' })
  await waitFor(() => expect(refreshAuth).toHaveBeenCalledOnce())
})

it('keeps factors intact when removal fails', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  unenroll.mockRejectedValue(new Error('private'))
  renderManager()
  await userEvent.click(screen.getByRole('button', { name: '移除 新裝置' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('移除失敗，請確認登入驗證仍有效後再試')
  expect(refreshAuth).not.toHaveBeenCalled()
  expect(screen.getAllByRole('button', { name: /移除/ })).toHaveLength(3)
})

it('does not count a just-removed factor while context is catching up', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  renderManager()
  await userEvent.click(screen.getByRole('button', { name: '移除 新裝置' }))
  await waitFor(() => expect(refreshAuth).toHaveBeenCalledOnce())
  expect(screen.getAllByRole('button', { name: /移除/ })).toHaveLength(2)
  expect(screen.getAllByRole('button', { name: /移除/ }).every(button => button.disabled)).toBe(true)
})

it('blocks another removal while one request is running', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  let complete
  unenroll.mockImplementation(() => new Promise(resolve => { complete = resolve }))
  renderManager()
  await userEvent.click(screen.getByRole('button', { name: '移除 新裝置' }))
  expect(screen.getAllByRole('button', { name: /移除/ }).every(button => button.disabled)).toBe(true)
  complete({ data: {}, error: null })
  await waitFor(() => expect(refreshAuth).toHaveBeenCalledOnce())
  expect(unenroll).toHaveBeenCalledOnce()
})

it('shows a recoverable error when factor refresh fails after removal', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  refreshAuth.mockRejectedValue(new Error('private'))
  renderManager()
  await userEvent.click(screen.getByRole('button', { name: '移除 新裝置' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('無法重新確認驗證器狀態，請重新載入安全狀態')
  expect(screen.getByRole('button', { name: '重新載入安全狀態' })).toBeInTheDocument()
})
