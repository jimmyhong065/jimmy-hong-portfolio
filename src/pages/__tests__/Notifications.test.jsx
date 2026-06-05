import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Notifications from '../Notifications'

vi.mock('../../components/Nav', () => ({ default: () => null }))

const mockMarkAllRead = vi.fn()
let mockNotifications = [
  { id: 'aaa', title: '新文章：測試', body: '這是摘要', url: '/blog/test', sent_at: '2026-06-01T00:00:00Z' },
  { id: 'bbb', title: '另一篇文章', body: '另一個摘要', url: '/blog/other', sent_at: '2026-05-01T00:00:00Z' },
]
let mockLoading = false

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: 0,
    loading: mockLoading,
    markAllRead: mockMarkAllRead,
  }),
}))

describe('Notifications', () => {
  beforeEach(() => {
    mockNotifications = [
      { id: 'aaa', title: '新文章：測試', body: '這是摘要', url: '/blog/test', sent_at: '2026-06-01T00:00:00Z' },
      { id: 'bbb', title: '另一篇文章', body: '另一個摘要', url: '/blog/other', sent_at: '2026-05-01T00:00:00Z' },
    ]
    mockLoading = false
    mockMarkAllRead.mockClear()
  })

  it('renders page title', () => {
    render(<Notifications />)
    expect(screen.getByText('通知')).toBeInTheDocument()
  })

  it('renders all notifications', () => {
    render(<Notifications />)
    expect(screen.getByText('新文章：測試')).toBeInTheDocument()
    expect(screen.getByText('另一篇文章')).toBeInTheDocument()
  })

  it('renders notification body text', () => {
    render(<Notifications />)
    expect(screen.getByText('這是摘要')).toBeInTheDocument()
  })

  it('calls markAllRead on mount', () => {
    render(<Notifications />)
    expect(mockMarkAllRead).toHaveBeenCalledOnce()
  })

  it('shows loading state', () => {
    mockLoading = true
    mockNotifications = []
    render(<Notifications />)
    expect(screen.getByText('載入中…')).toBeInTheDocument()
  })

  it('shows empty state when no notifications', () => {
    mockNotifications = []
    render(<Notifications />)
    expect(screen.getByText('還沒有通知')).toBeInTheDocument()
  })
})
