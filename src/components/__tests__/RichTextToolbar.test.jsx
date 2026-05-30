import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RichTextToolbar from '../RichTextToolbar'

function makeRun() {
  return vi.fn()
}

function makeEditor(runMock) {
  const chain = () => ({
    focus: () => ({
      toggleBold: () => ({ run: runMock }),
      toggleItalic: () => ({ run: runMock }),
      toggleStrike: () => ({ run: runMock }),
      toggleCode: () => ({ run: runMock }),
      toggleHeading: () => ({ run: runMock }),
      toggleBlockquote: () => ({ run: runMock }),
      toggleCodeBlock: () => ({ run: runMock }),
      toggleBulletList: () => ({ run: runMock }),
      toggleOrderedList: () => ({ run: runMock }),
      setLink: () => ({ run: runMock }),
      setImage: () => ({ run: runMock }),
      insertTable: () => ({ run: runMock }),
      setHorizontalRule: () => ({ run: runMock }),
      undo: () => ({ run: runMock }),
      redo: () => ({ run: runMock }),
    }),
  })
  return {
    chain,
    can: () => ({ chain }),
    isActive: vi.fn().mockReturnValue(false),
  }
}

describe('RichTextToolbar', () => {
  it('renders null when editor is null', () => {
    const { container } = render(<RichTextToolbar editor={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders H1, H2, H3 buttons', () => {
    const run = makeRun()
    render(<RichTextToolbar editor={makeEditor(run)} />)
    expect(screen.getByText('H1')).toBeInTheDocument()
    expect(screen.getByText('H2')).toBeInTheDocument()
    expect(screen.getByText('H3')).toBeInTheDocument()
  })

  it('renders Bold button', () => {
    const run = makeRun()
    render(<RichTextToolbar editor={makeEditor(run)} />)
    expect(screen.getByTitle('粗體')).toBeInTheDocument()
  })

  it('clicking Bold calls editor chain run', () => {
    const run = makeRun()
    render(<RichTextToolbar editor={makeEditor(run)} />)
    fireEvent.click(screen.getByTitle('粗體'))
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('clicking H1 calls editor chain run', () => {
    const run = makeRun()
    render(<RichTextToolbar editor={makeEditor(run)} />)
    fireEvent.click(screen.getByText('H1'))
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('Image button opens insert dialog', () => {
    const run = makeRun()
    render(<RichTextToolbar editor={makeEditor(run)} />)
    fireEvent.click(screen.getByTitle('圖片'))
    expect(screen.getByText('插入圖片')).toBeInTheDocument()
  })

  it('dialog Cancel button closes dialog', () => {
    const run = makeRun()
    render(<RichTextToolbar editor={makeEditor(run)} />)
    fireEvent.click(screen.getByTitle('圖片'))
    fireEvent.click(screen.getByText('取消'))
    expect(screen.queryByText('插入圖片')).toBeNull()
  })
})
