import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Nav from '../Nav'

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({ settings: { email: 'test@example.com' } }),
}))

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({ unreadCount: 0, notifications: [], loading: false, markAllRead: vi.fn() }),
}))

function renderNav(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Nav />
    </MemoryRouter>
  )
}

describe('Nav', () => {
  it('renders brand link', () => {
    renderNav()
    expect(screen.getByText('Jimmy Hong')).toBeInTheDocument()
  })

  it('renders all 5 tabs in bottom bar (via aria-label)', () => {
    renderNav()
    // Mobile tab bar: icons-only, each link has aria-label
    // Desktop nav: text links with same names → 2 links per label total
    expect(screen.getAllByRole('link', { name: '作品集' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: '部落格' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: '收藏' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'FAQ' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: '關於我' })).toHaveLength(2)
  })

  it('marks /projects tab active when on projects route', () => {
    renderNav('/projects')
    // [0] = desktop nav link, [1] = mobile tab link
    const tabBarLink = screen.getAllByRole('link', { name: '作品集' })[1]
    expect(tabBarLink).toHaveAttribute('aria-current', 'page')
  })

  it('marks /projects tab active for nested routes like /projects/1', () => {
    renderNav('/projects/1')
    const tabBarLink = screen.getAllByRole('link', { name: '作品集' })[1]
    expect(tabBarLink).toHaveAttribute('aria-current', 'page')
  })

  it('inactive tab does not have aria-current', () => {
    renderNav('/projects')
    const tabBarLink = screen.getAllByRole('link', { name: '部落格' })[1]
    expect(tabBarLink).not.toHaveAttribute('aria-current')
  })
})
