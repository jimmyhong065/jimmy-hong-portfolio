import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ArticleToolbar from '../ArticleToolbar'

describe('ArticleToolbar', () => {
  let defaults

  beforeEach(() => {
    defaults = {
      fontSize: 'md',
      dark: false,
      onInc: vi.fn(),
      onDec: vi.fn(),
      onToggleDark: vi.fn(),
    }
  })
  it('shows 16px label for md', () => {
    render(<ArticleToolbar {...defaults} />)
    expect(screen.getByText('16px')).toBeInTheDocument()
  })

  it('shows 14px label for sm', () => {
    render(<ArticleToolbar {...defaults} fontSize="sm" />)
    expect(screen.getByText('14px')).toBeInTheDocument()
  })

  it('shows 18px label for lg', () => {
    render(<ArticleToolbar {...defaults} fontSize="lg" />)
    expect(screen.getByText('18px')).toBeInTheDocument()
  })

  it('A− is disabled when fontSize is sm', () => {
    render(<ArticleToolbar {...defaults} fontSize="sm" />)
    expect(screen.getByLabelText('縮小字體')).toBeDisabled()
  })

  it('A+ is disabled when fontSize is lg', () => {
    render(<ArticleToolbar {...defaults} fontSize="lg" />)
    expect(screen.getByLabelText('放大字體')).toBeDisabled()
  })

  it('A− and A+ both enabled at md', () => {
    render(<ArticleToolbar {...defaults} fontSize="md" />)
    expect(screen.getByLabelText('縮小字體')).not.toBeDisabled()
    expect(screen.getByLabelText('放大字體')).not.toBeDisabled()
  })

  it('calls onInc when A+ clicked', () => {
    const onInc = vi.fn()
    render(<ArticleToolbar {...defaults} onInc={onInc} />)
    fireEvent.click(screen.getByLabelText('放大字體'))
    expect(onInc).toHaveBeenCalledOnce()
  })

  it('calls onDec when A− clicked', () => {
    const onDec = vi.fn()
    render(<ArticleToolbar {...defaults} onDec={onDec} />)
    fireEvent.click(screen.getByLabelText('縮小字體'))
    expect(onDec).toHaveBeenCalledOnce()
  })

  it('shows 切換暗色模式 aria-label in light mode', () => {
    render(<ArticleToolbar {...defaults} dark={false} />)
    expect(screen.getByLabelText('切換暗色模式')).toBeInTheDocument()
  })

  it('shows 切換亮色模式 aria-label in dark mode', () => {
    render(<ArticleToolbar {...defaults} dark={true} />)
    expect(screen.getByLabelText('切換亮色模式')).toBeInTheDocument()
  })

  it('calls onToggleDark when toggle button clicked', () => {
    const onToggleDark = vi.fn()
    render(<ArticleToolbar {...defaults} onToggleDark={onToggleDark} />)
    fireEvent.click(screen.getByLabelText('切換暗色模式'))
    expect(onToggleDark).toHaveBeenCalledOnce()
  })
})
