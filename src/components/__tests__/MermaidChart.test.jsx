import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  }
}))

import mermaid from 'mermaid'
import MermaidChart from '../MermaidChart'

describe('MermaidChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mermaid.render.mockResolvedValue({ svg: '<svg data-testid="mermaid-svg"></svg>' })
  })

  it('renders a container div', () => {
    const { container } = render(<MermaidChart definition="graph TD\n  A-->B" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('calls mermaid.render with the definition', async () => {
    const definition = "graph TD\n  A-->B"
    render(<MermaidChart definition={definition} />)
    await waitFor(() => {
      expect(mermaid.render).toHaveBeenCalledWith(
        expect.stringMatching(/^mermaid-/),
        definition
      )
    })
  })

  it('shows error message when mermaid.render rejects', async () => {
    mermaid.render.mockRejectedValue(new Error('syntax error'))
    render(<MermaidChart definition="invalid mermaid" />)
    await waitFor(() => {
      expect(screen.getByText(/mermaid/i)).toBeInTheDocument()
    })
  })
})
