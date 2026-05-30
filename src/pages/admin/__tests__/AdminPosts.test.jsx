import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdminPosts from '../AdminPosts'

const POSTS = [
  { id: '1', title: 'Appium 文章', tags: ['自動化測試', '工具'], published: true, published_at: '2024-01-01T00:00:00Z' },
  { id: '2', title: 'k6 效能測試', tags: ['效能測試'], published: true, published_at: '2024-01-02T00:00:00Z' },
  { id: '3', title: 'API 測試策略', tags: ['API 測試'], published: false, published_at: null },
]

function makeSupabaseMock(data = POSTS) {
  const inMock = vi.fn().mockResolvedValue({})
  const eqDeleteMock = vi.fn().mockResolvedValue({})
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data }),
      delete: vi.fn(() => ({ eq: eqDeleteMock, in: inMock })),
      update: vi.fn(() => ({ in: inMock })),
    })),
  }
}

vi.mock('../../../lib/supabase', () => {
  const MOCK_POSTS = [
    { id: '1', title: 'Appium 文章', tags: ['自動化測試', '工具'], published: true, published_at: '2024-01-01T00:00:00Z' },
    { id: '2', title: 'k6 效能測試', tags: ['效能測試'], published: true, published_at: '2024-01-02T00:00:00Z' },
    { id: '3', title: 'API 測試策略', tags: ['API 測試'], published: false, published_at: null },
  ]
  const inMock = vi.fn().mockResolvedValue({})
  const eqDeleteMock = vi.fn().mockResolvedValue({})
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: MOCK_POSTS }),
        delete: vi.fn(() => ({ eq: eqDeleteMock, in: inMock })),
        update: vi.fn(() => ({ in: inMock })),
      })),
    }
  }
})

import { supabase } from '../../../lib/supabase'

function renderPosts() {
  return render(<MemoryRouter><AdminPosts /></MemoryRouter>)
}

describe('AdminPosts — search and filter', () => {
  it('renders all posts on load', async () => {
    renderPosts()
    await waitFor(() => {
      expect(screen.getByText('Appium 文章')).toBeInTheDocument()
      expect(screen.getByText('k6 效能測試')).toBeInTheDocument()
      expect(screen.getByText('API 測試策略')).toBeInTheDocument()
    })
  })

  it('filters posts by search query', async () => {
    renderPosts()
    await waitFor(() => screen.getByText('Appium 文章'))
    fireEvent.change(screen.getByPlaceholderText('🔍 搜尋標題…'), { target: { value: 'k6' } })
    expect(screen.queryByText('Appium 文章')).toBeNull()
    expect(screen.getByText('k6 效能測試')).toBeInTheDocument()
  })

  it('filters posts by draft status', async () => {
    renderPosts()
    await waitFor(() => screen.getByText('Appium 文章'))
    fireEvent.click(screen.getByRole('button', { name: '草稿' }))
    expect(screen.queryByText('Appium 文章')).toBeNull()
    expect(screen.getByText('API 測試策略')).toBeInTheDocument()
  })

  it('filters posts by published status', async () => {
    renderPosts()
    await waitFor(() => screen.getByText('API 測試策略'))
    fireEvent.click(screen.getByRole('button', { name: '已發布' }))
    expect(screen.queryByText('API 測試策略')).toBeNull()
    expect(screen.getByText('Appium 文章')).toBeInTheDocument()
  })

  it('populates tag filter with unique tags', async () => {
    renderPosts()
    await waitFor(() => screen.getByText('Appium 文章'))
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'API 測試' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '效能測試' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '自動化測試' })).toBeInTheDocument()
  })

  it('filters posts by tag', async () => {
    renderPosts()
    await waitFor(() => screen.getByText('Appium 文章'))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '效能測試' } })
    expect(screen.queryByText('Appium 文章')).toBeNull()
    expect(screen.getByText('k6 效能測試')).toBeInTheDocument()
  })
})
