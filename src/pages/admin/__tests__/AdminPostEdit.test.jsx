import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'abc',
          title: '測試文章',
          slug: 'test-article',
          content: '<p>內容</p>',
          excerpt: '摘要',
          tags: ['測試策略'],
          published: false,
          published_at: null,
        }
      }),
      update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({}) })),
      insert: vi.fn().mockResolvedValue({}),
    })),
  }
}))

vi.mock('../../../components/RichTextEditor', () => ({
  default: ({ value, onChange }) => (
    <textarea data-testid="rich-editor" value={value} onChange={e => onChange(e.target.value)} />
  )
}))

import AdminPostEdit from '../AdminPostEdit'
import { supabase } from '../../../lib/supabase'

function renderEdit(id = 'abc') {
  return render(
    <MemoryRouter initialEntries={[`/admin/posts/${id}`]}>
      <Routes>
        <Route path="/admin/posts/:id" element={<AdminPostEdit />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AdminPostEdit — auto-save and preview', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows preview button for existing post', async () => {
    renderEdit('abc')
    await waitFor(() => screen.getByDisplayValue('測試文章'))
    expect(screen.getByText('預覽')).toBeInTheDocument()
  })

  it('does not show preview button for new post', () => {
    renderEdit('new')
    expect(screen.queryByText('預覽')).toBeNull()
  })

  it('preview button opens /blog/:slug in new tab', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderEdit('abc')
    await waitFor(() => screen.getByText('預覽'))
    fireEvent.click(screen.getByText('預覽'))
    expect(open).toHaveBeenCalledWith('/blog/test-article', '_blank')
    open.mockRestore()
  })

  it('auto-saves after 30 seconds of inactivity', async () => {
    renderEdit('abc')
    // Wait for data load with real timers
    await waitFor(() => screen.getByDisplayValue('測試文章'))

    // Switch to fake timers after data is loaded
    vi.useFakeTimers()

    // Simulate user changing the title
    await act(async () => {
      fireEvent.change(screen.getByRole('textbox', { name: /標題/i }), {
        target: { value: '修改後的標題' }
      })
    })

    // Shows pending state
    expect(screen.getByText('• 未儲存變更')).toBeInTheDocument()

    // Advance 30 seconds
    await act(async () => { vi.advanceTimersByTime(30000) })
    await act(async () => { await Promise.resolve() })

    expect(supabase.from).toHaveBeenCalledWith('posts')
    vi.useRealTimers()
  })

  it('shows auto-saved timestamp after save completes', async () => {
    renderEdit('abc')
    // Wait for data load with real timers
    await waitFor(() => screen.getByDisplayValue('測試文章'))

    // Switch to fake timers after data is loaded
    vi.useFakeTimers()

    await act(async () => {
      fireEvent.change(screen.getByRole('textbox', { name: /標題/i }), {
        target: { value: '新標題' }
      })
    })

    await act(async () => { vi.advanceTimersByTime(30000) })
    await act(async () => { await Promise.resolve() })

    // Switch back to real timers for waitFor
    vi.useRealTimers()

    await waitFor(() => {
      expect(screen.getByText(/已自動儲存/)).toBeInTheDocument()
    })
  })
})
