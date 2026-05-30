import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RichTextEditor from '../RichTextEditor'

describe('RichTextEditor', () => {
  it('renders the editor container without crashing', () => {
    const onChange = vi.fn()
    const { container } = render(<RichTextEditor value="" onChange={onChange} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders with initial HTML content', () => {
    const onChange = vi.fn()
    render(<RichTextEditor value="<p>hello</p>" onChange={onChange} />)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })
})
