import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TagFilter from '../TagFilter'

describe('TagFilter', () => {
  const tags = ['測試策略', 'CI/CD', '自動化']

  it('renders all tags plus "全部" option', () => {
    render(<TagFilter tags={tags} selected={null} onSelect={() => {}} />)
    expect(screen.getByText('全部')).toBeInTheDocument()
    expect(screen.getByText('測試策略')).toBeInTheDocument()
    expect(screen.getByText('CI/CD')).toBeInTheDocument()
  })

  it('calls onSelect with null when "全部" clicked', () => {
    const onSelect = vi.fn()
    render(<TagFilter tags={tags} selected="CI/CD" onSelect={onSelect} />)
    fireEvent.click(screen.getByText('全部'))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('calls onSelect with tag name when tag clicked', () => {
    const onSelect = vi.fn()
    render(<TagFilter tags={tags} selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('CI/CD'))
    expect(onSelect).toHaveBeenCalledWith('CI/CD')
  })
})
