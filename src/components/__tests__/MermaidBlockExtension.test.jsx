import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg></svg>' }),
  }
}))

vi.mock('../MermaidChart', () => ({
  default: ({ definition }) => <div data-testid="mermaid-preview">{definition}</div>
}))

vi.mock('@tiptap/react', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    NodeViewWrapper: ({ children }) => <div>{children}</div>,
    ReactNodeViewRenderer: actual.ReactNodeViewRenderer,
  }
})

import { MermaidNodeView } from '../MermaidBlockExtension'

const makeNodeViewProps = (definition = 'graph TD\n  A-->B') => ({
  node: { attrs: { definition } },
  updateAttributes: vi.fn(),
  deleteNode: vi.fn(),
  editor: { isEditable: true },
})

describe('MermaidNodeView', () => {
  it('renders textarea with definition', () => {
    render(<MermaidNodeView {...makeNodeViewProps()} />)
    expect(screen.getByRole('textbox').value).toBe('graph TD\n  A-->B')
  })

  it('renders mermaid preview', () => {
    render(<MermaidNodeView {...makeNodeViewProps()} />)
    expect(screen.getByTestId('mermaid-preview')).toBeInTheDocument()
  })

  it('delete button calls deleteNode', () => {
    const props = makeNodeViewProps()
    render(<MermaidNodeView {...props} />)
    fireEvent.click(screen.getByTitle('刪除圖表'))
    expect(props.deleteNode).toHaveBeenCalledTimes(1)
  })

  it('textarea change calls updateAttributes after debounce', async () => {
    vi.useFakeTimers()
    const props = makeNodeViewProps()
    render(<MermaidNodeView {...props} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'graph LR\n  X-->Y' } })
    vi.advanceTimersByTime(350)
    expect(props.updateAttributes).toHaveBeenCalledWith({ definition: 'graph LR\n  X-->Y' })
    vi.useRealTimers()
  })
})
