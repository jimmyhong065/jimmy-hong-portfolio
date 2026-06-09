import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const {
  postFixture,
  singleMock,
  updateEqMock,
  updateMock,
  insertSingleMock,
  insertSelectMock,
  insertMock,
  selectMock,
  eqMock,
} = vi.hoisted(() => ({
  postFixture: {
    id: 'abc',
    title: '測試文章',
    slug: 'test-article',
    content: '<p>內容</p>',
    excerpt: '摘要',
    tags: ['測試策略'],
    published: false,
    published_at: null,
  },
  singleMock: vi.fn(),
  updateEqMock: vi.fn(),
  updateMock: vi.fn(),
  insertSingleMock: vi.fn(),
  insertSelectMock: vi.fn(),
  insertMock: vi.fn(),
  selectMock: vi.fn(),
  eqMock: vi.fn(),
}))

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: selectMock,
      eq: eqMock,
      single: singleMock,
      update: updateMock,
      insert: insertMock,
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

function renderNewPost() {
  return renderEdit('new')
}

function getPublishChecklist() {
  const heading = screen.getByText('發布檢查')
  const checklist = heading.closest('[data-testid="publish-checklist"], section, aside, fieldset') ?? heading.parentElement
  expect(checklist).not.toBeNull()
  return checklist
}

function fillCompletePublishForm(container, overrides = {}) {
  const values = {
    title: '完整文章',
    excerpt: '這是一段摘要',
    tags: '測試策略',
    content: '<p>完整內容</p>',
    ...overrides,
  }

  fireEvent.change(screen.getByRole('textbox', { name: /標題/i }), {
    target: { value: values.title }
  })

  if (values.excerpt !== undefined) {
    fireEvent.change(container.querySelector('input[name="excerpt"]'), {
      target: { value: values.excerpt }
    })
  }

  if (values.tags !== undefined) {
    fireEvent.change(container.querySelector('input[name="tags"]'), {
      target: { value: values.tags }
    })
  }

  if (values.content !== undefined) {
    fireEvent.change(screen.getByTestId('rich-editor'), {
      target: { value: values.content }
    })
  }
}

describe('AdminPostEdit — auto-save and preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    singleMock.mockResolvedValue({ data: postFixture })
    eqMock.mockReturnThis()
    selectMock.mockReturnThis()
    updateEqMock.mockResolvedValue({})
    updateMock.mockReturnValue({ eq: updateEqMock })
    insertSingleMock.mockResolvedValue({ data: { id: 'new-id' } })
    insertSelectMock.mockReturnValue({ single: insertSingleMock })
    insertMock.mockReturnValue({ select: insertSelectMock })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('shows preview button for existing post', async () => {
    renderEdit('abc')
    await waitFor(() => screen.getByDisplayValue('測試文章'))
    expect(screen.getByRole('button', { name: /預覽/ })).toBeInTheDocument()
  })

  it('does not show preview button for new post', () => {
    renderEdit('new')
    expect(screen.queryByRole('button', { name: /預覽/ })).toBeNull()
  })

  it('preview button opens /blog/:slug in new tab', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderEdit('abc')
    const previewButton = await screen.findByRole('button', { name: /預覽/ })
    fireEvent.click(previewButton)
    expect(open).toHaveBeenCalledWith('/blog/test-article?preview=1', '_blank')
  })

  it('auto-saves after 5 seconds of inactivity', async () => {
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
    expect(screen.getByText('• 未儲存')).toBeInTheDocument()

    // Advance 5 seconds
    await act(async () => { vi.advanceTimersByTime(5000) })
    await act(async () => { await Promise.resolve() })

    expect(supabase.from).toHaveBeenCalledWith('posts')
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

    await act(async () => { vi.advanceTimersByTime(5000) })
    await act(async () => { await Promise.resolve() })

    // Switch back to real timers for waitFor
    vi.useRealTimers()

    await waitFor(() => {
      expect(screen.getAllByText(/已儲存 \d{2}:\d{2}/).length).toBeGreaterThan(0)
    })
  })

  it('keeps publish checklist hidden for an ordinary draft', () => {
    renderNewPost()

    expect(screen.queryByText('發布檢查')).not.toBeInTheDocument()
  })

  it('shows publish checklist when publish is checked', () => {
    renderNewPost()

    fireEvent.click(screen.getByLabelText('發布'))

    const checklist = within(getPublishChecklist())
    expect(checklist.getByText('標題')).toBeInTheDocument()
    expect(checklist.getByText('Slug')).toBeInTheDocument()
    expect(checklist.getByText('摘要')).toBeInTheDocument()
    expect(checklist.getByText('內容')).toBeInTheDocument()
    expect(checklist.getByText('至少一個標籤')).toBeInTheDocument()
  })

  it('blocks saving as published when required publish fields are missing', async () => {
    renderNewPost()

    fireEvent.change(screen.getByRole('textbox', { name: /標題/i }), {
      target: { value: '未完成文章' }
    })
    fireEvent.click(screen.getByLabelText('發布'))
    fireEvent.click(screen.getByRole('button', { name: '建立文章' }))

    expect(await screen.findByText('請先完成發布檢查')).toBeInTheDocument()
    expect(insertMock).not.toHaveBeenCalled()
  })

  it.each([
    ['excerpt', { excerpt: '' }],
    ['content', { content: '' }],
    ['tags', { tags: '' }],
  ])('blocks saving as published when %s is missing', async (_field, overrides) => {
    const { container } = renderNewPost()

    fillCompletePublishForm(container, overrides)
    fireEvent.click(screen.getByLabelText('發布'))
    fireEvent.click(screen.getByRole('button', { name: '建立文章' }))

    expect(await screen.findByText('請先完成發布檢查')).toBeInTheDocument()
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('allows saving an incomplete draft', async () => {
    renderNewPost()

    fireEvent.change(screen.getByRole('textbox', { name: /標題/i }), {
      target: { value: '未完成草稿' }
    })
    fireEvent.click(screen.getByRole('button', { name: '建立文章' }))

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        title: '未完成草稿',
        published: false,
      }))
    })
  })

  it('allows saving as published when publish checks pass', async () => {
    const { container } = renderNewPost()

    fillCompletePublishForm(container)
    fireEvent.click(screen.getByLabelText('發布'))
    fireEvent.click(screen.getByRole('button', { name: '建立文章' }))

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        title: '完整文章',
        published: true,
        excerpt: '這是一段摘要',
        tags: ['測試策略'],
      }))
    })
  })
})
