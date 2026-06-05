import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { NotificationBadge } from '../NotificationBadge'

describe('NotificationBadge', () => {
  it('renders count when count > 0', () => {
    render(<NotificationBadge count={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders 9+ when count > 9', () => {
    render(<NotificationBadge count={12} />)
    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('renders nothing when count is 0', () => {
    const { container } = render(<NotificationBadge count={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when count is undefined', () => {
    const { container } = render(<NotificationBadge />)
    expect(container.firstChild).toBeNull()
  })
})
