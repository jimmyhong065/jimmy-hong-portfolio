import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
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

  it('renders markdown callout with type class and title', () => {
    const { container } = render(<MarkdownContent content={'> [!TIP]\n> 把等待收進 BasePage'} />)
    const bq = container.querySelector('blockquote')
    expect(bq).toHaveClass('callout', 'callout-tip')
    expect(bq.querySelector('.callout-title')).toHaveTextContent('小技巧')
    expect(bq).not.toHaveTextContent('[!TIP]')
    expect(bq).toHaveTextContent('把等待收進 BasePage')
  })

  it('renders markdown callout when content follows marker on same line', () => {
    const { container } = render(<MarkdownContent content={'> [!WARNING] 別直接加 **retry**'} />)
    const bq = container.querySelector('blockquote')
    expect(bq).toHaveClass('callout-warning')
    expect(bq.querySelector('strong')).toHaveTextContent('retry')
    expect(bq).not.toHaveTextContent('[!WARNING]')
  })

  it('keeps plain markdown blockquote unchanged', () => {
    const { container } = render(<MarkdownContent content={'> 一般引用'} />)
    expect(container.querySelector('blockquote')).not.toHaveClass('callout')
  })

  it('renders HTML callout from admin-edited content', () => {
    const { container } = render(
      <MarkdownContent content="<blockquote><p>[!CASE] 回歸套件 180 條</p></blockquote>" />
    )
    const bq = container.querySelector('blockquote')
    expect(bq).toHaveClass('callout', 'callout-case')
    expect(bq.querySelector('.callout-title')).toHaveTextContent('實際案例')
  })

  it('renders markdown BAD + GOOD as a side-by-side compare pair', () => {
    const md = '> [!BAD]\n> ```python\n> time.sleep(3)\n> ```\n\n> [!GOOD]\n> 等到可點才點'
    const { container } = render(<MarkdownContent content={md} />)
    const pair = container.querySelector('.compare-pair')
    expect(pair).not.toBeNull()
    const cols = pair.querySelectorAll(':scope > blockquote')
    expect(cols[0]).toHaveClass('callout-bad')
    expect(cols[1]).toHaveClass('callout-good')
    expect(cols[1]).toHaveTextContent('等到可點才點')
  })

  it('leaves a lone markdown BAD callout unwrapped', () => {
    const { container } = render(<MarkdownContent content={'> [!BAD] 別這樣寫'} />)
    expect(container.querySelector('.compare-pair')).toBeNull()
    expect(container.querySelector('blockquote')).toHaveClass('callout-bad')
  })

  it('renders markdown bug card with title and field rows', () => {
    const md = '> [!BUG] 冷啟動後點「開始」沒反應 🔴\n>\n> - **環境：** Android 14\n> - **預期：** 進入計時頁\n> - **實際：** 停在首頁'
    const { container } = render(<MarkdownContent content={md} />)
    const bq = container.querySelector('blockquote')
    expect(bq).toHaveClass('callout', 'callout-bug')
    expect(bq.querySelector('.callout-title')).toHaveTextContent('Bug')
    expect(bq.querySelector('.bug-title')).toHaveTextContent('冷啟動後點「開始」沒反應')
    expect(bq).not.toHaveTextContent('[!BUG]')
    const lis = bq.querySelectorAll('li')
    expect(lis[1]).toHaveClass('bug-expected')
    expect(lis[2]).toHaveClass('bug-actual')
  })

  it('renders markdown related card with internal links', () => {
    const md = '> [!RELATED]\n>\n> - [等待策略](/blog/wait-strategy)\n> - [BasePage](/blog/basepage)'
    const { container } = render(<MemoryRouter><MarkdownContent content={md} /></MemoryRouter>)
    const bq = container.querySelector('blockquote')
    expect(bq).toHaveClass('callout', 'callout-related')
    expect(bq.querySelector('.callout-title')).toHaveTextContent('延伸閱讀')
    expect(bq.querySelectorAll('li a')).toHaveLength(2)
    expect(bq).not.toHaveTextContent('[!RELATED]')
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
    const { container } = render(<MarkdownContent content={'```js\nconsole.log(1)\n```'} />)
    expect(screen.queryByTestId('mermaid-chart')).toBeNull()
    expect(container.querySelector('code.language-js')).toHaveTextContent('console.log(1)')
  })
})
