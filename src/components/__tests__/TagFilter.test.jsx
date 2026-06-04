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

  it('renders 未讀 and 收藏 pills', () => {
    render(<TagFilter tags={tags} selected={null} onSelect={() => {}} specialFilter={null} onSpecialFilter={() => {}} />)
    expect(screen.getByText('未讀')).toBeInTheDocument()
    expect(screen.getByText('收藏')).toBeInTheDocument()
  })

  it('calls onSpecialFilter with "unread" when 未讀 clicked', () => {
    const onSpecialFilter = vi.fn()
    render(<TagFilter tags={tags} selected={null} onSelect={() => {}} specialFilter={null} onSpecialFilter={onSpecialFilter} />)
    fireEvent.click(screen.getByText('未讀'))
    expect(onSpecialFilter).toHaveBeenCalledWith('unread')
  })

  it('calls onSpecialFilter with "saved" when 收藏 clicked', () => {
    const onSpecialFilter = vi.fn()
    render(<TagFilter tags={tags} selected={null} onSelect={() => {}} specialFilter={null} onSpecialFilter={onSpecialFilter} />)
    fireEvent.click(screen.getByText('收藏'))
    expect(onSpecialFilter).toHaveBeenCalledWith('saved')
  })

  it('clears tag selection when special filter selected', () => {
    const onSelect = vi.fn()
    render(<TagFilter tags={tags} selected="CI/CD" onSelect={onSelect} specialFilter={null} onSpecialFilter={() => {}} />)
    fireEvent.click(screen.getByText('未讀'))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('全部 button clears both tag and special filter', () => {
    const onSelect = vi.fn()
    const onSpecialFilter = vi.fn()
    render(<TagFilter tags={tags} selected="CI/CD" onSelect={onSelect} specialFilter="unread" onSpecialFilter={onSpecialFilter} />)
    fireEvent.click(screen.getByText('全部'))
    expect(onSelect).toHaveBeenCalledWith(null)
    expect(onSpecialFilter).toHaveBeenCalledWith(null)
  })

  it('全部 button is active only when both filters are null', () => {
    render(<TagFilter tags={tags} selected={null} onSelect={() => {}} specialFilter="unread" onSpecialFilter={() => {}} />)
    const allBtn = screen.getByText('全部')
    expect(allBtn.className).not.toMatch(/bg-gray-900/)
  })
})
