import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MarkdownContent from '../MarkdownContent'

vi.mock('../MermaidChart', () => ({
  default: ({ definition }) => <div data-testid="mermaid-chart" data-definition={definition} />
}))

describe('MarkdownContent', () => {
  it('renders markdown content via react-markdown', () => {
    render(<MarkdownContent content="**bold text**" />)
    expect(screen.getByRole('strong')).toBeInTheDocument()
  })

  it('renders HTML content via dangerouslySetInnerHTML', () => {
    render(<MarkdownContent content="<p>hello <strong>world</strong></p>" />)
    expect(screen.getByText('world')).toBeInTheDocument()
  })

  it('strips XSS from HTML content', () => {
    const { container } = render(
      <MarkdownContent content='<p>safe</p><script>alert("xss")</script>' />
    )
    expect(container.querySelector('script')).toBeNull()
    expect(screen.getByText('safe')).toBeInTheDocument()
  })

  it('strips inline event handlers from HTML content', () => {
    const { container } = render(
      <MarkdownContent content='<img src="x" onerror="alert(1)" />' />
    )
    const img = container.querySelector('img')
    expect(img?.getAttribute('onerror')).toBeNull()
  })

  it('handles null/undefined content without crashing', () => {
    const { container } = render(<MarkdownContent content={null} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders mermaid code block as MermaidChart in markdown mode', () => {
    const md = '```mermaid\ngraph TD\n  A-->B\n```'
    render(<MarkdownContent content={md} />)
    const chart = screen.getByTestId('mermaid-chart')
    expect(chart).toBeInTheDocument()
    expect(chart.getAttribute('data-definition')).toContain('graph TD')
  })

  it('renders non-mermaid code blocks as regular code in markdown mode', () => {
    render(<MarkdownContent content={'```js\nconsole.log(1)\n```'} />)
    expect(screen.queryByTestId('mermaid-chart')).toBeNull()
    expect(screen.getByText(/console\.log/)).toBeInTheDocument()
  })
})
