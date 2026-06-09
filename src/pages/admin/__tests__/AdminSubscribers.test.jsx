// src/pages/admin/__tests__/AdminSubscribers.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdminSubscribers from '../AdminSubscribers'

const SUBSCRIBERS = [
  { email: 'alice@example.com', confirmed: true, created_at: '2026-05-01T00:00:00Z' },
  { email: 'bob@example.com', confirmed: false, created_at: '2026-06-01T00:00:00Z' },
]
const POSTS = [
  { slug: 'leader-collab', title: 'Leader 說要改善流程', excerpt: 'QA 與 Leader 協作' },
]

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: POSTS }),
      }
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' } } }),
    },
  },
}))

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === '/api/admin/subscribers') {
      return new Response(JSON.stringify(SUBSCRIBERS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({}), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function renderPage() {
  return render(<MemoryRouter><AdminSubscribers /></MemoryRouter>)
}

describe('AdminSubscribers', () => {
  it('shows confirmed subscriber count', async () => {
    renderPage()
    await screen.findByText('alice@example.com')
    expect(screen.getByText(/1.*已確認訂閱者/)).toBeInTheDocument()
  })

  it('shows confirmed and pending status badges', async () => {
    renderPage()
    await screen.findByText('alice@example.com')
    expect(screen.getByText('✅ 已確認')).toBeInTheDocument()
    expect(screen.getByText('⏳ 待確認')).toBeInTheDocument()
  })

  it('send button disabled when no article selected', async () => {
    renderPage()
    await screen.findByText('alice@example.com')
    expect(screen.getByRole('button', { name: '發送通知' })).toBeDisabled()
  })

  it('shows email preview when article selected', async () => {
    renderPage()
    await screen.findByText('alice@example.com')
    const searchInput = screen.getByPlaceholderText('搜尋文章標題…')
    fireEvent.focus(searchInput)
    fireEvent.click(screen.getByRole('button', { name: 'Leader 說要改善流程' }))
    expect(screen.getAllByText('Leader 說要改善流程').length).toBeGreaterThan(0)
  })
})
