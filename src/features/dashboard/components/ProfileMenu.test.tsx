import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockLogout  = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ logout: mockLogout }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

// ─── Import after mocks ──────────────────────────────────────────────────────

import { ProfileMenu } from './ProfileMenu'
import type { User } from '@/types'

const mockUser: User = {
  id:        'u-1',
  name:      'Harsh Patel',
  email:     'harsh@planigo.com',
  avatarUrl: null,
  jobTitle:  'Engineer',
  timezone:  'Asia/Kolkata',
  createdAt: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  mockLogout.mockReset()
  mockNavigate.mockReset()
})

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('ProfileMenu (full-width user row)', () => {
  it('renders the user full name in the row', () => {
    renderWithRouter(<ProfileMenu user={mockUser} />)
    expect(screen.getByText('Harsh Patel')).toBeInTheDocument()
  })

  it('renders the user email in the row', () => {
    renderWithRouter(<ProfileMenu user={mockUser} />)
    expect(screen.getByText('harsh@planigo.com')).toBeInTheDocument()
  })

  it('renders the avatar with initials when no avatarUrl', () => {
    renderWithRouter(<ProfileMenu user={mockUser} />)
    // "Harsh Patel" → "HP"
    expect(screen.getByText('HP')).toBeInTheDocument()
  })

  it('renders the avatar with initials derived from the user name', () => {
    renderWithRouter(
      <ProfileMenu user={{ ...mockUser, name: 'Ada Lovelace' }} />
    )
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('renders a chevron icon to indicate the row opens a menu', () => {
    const { container } = renderWithRouter(<ProfileMenu user={mockUser} />)
    // Lucide ChevronsUpDown renders an svg with that name in the class list.
    const chevron = container.querySelector('svg.lucide-chevrons-up-down')
    expect(chevron).not.toBeNull()
  })

  it('clicking the row opens a menu with a Logout item', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProfileMenu user={mockUser} />)

    // The trigger button has the user name as accessible name.
    await user.click(screen.getByRole('button', { name: /harsh patel/i }))

    const menu = await screen.findByRole('menu')
    expect(within(menu).getByRole('menuitem', { name: /log ?out/i })).toBeInTheDocument()
  })

  it('clicking Logout calls useAuth().logout() and navigates to /login', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProfileMenu user={mockUser} />)

    await user.click(screen.getByRole('button', { name: /harsh patel/i }))
    const logoutItem = await screen.findByRole('menuitem', { name: /log ?out/i })
    await user.click(logoutItem)

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('does not navigate when logout throws', async () => {
    mockLogout.mockRejectedValueOnce(new Error('network'))
    const user = userEvent.setup()
    renderWithRouter(<ProfileMenu user={mockUser} />)

    await user.click(screen.getByRole('button', { name: /harsh patel/i }))
    const logoutItem = await screen.findByRole('menuitem', { name: /log ?out/i })
    await user.click(logoutItem)

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('renders nothing user-visible when user is null (no crash)', () => {
    renderWithRouter(<ProfileMenu user={null} />)
    expect(screen.queryByText('Harsh Patel')).not.toBeInTheDocument()
    expect(screen.queryByText('harsh@planigo.com')).not.toBeInTheDocument()
  })
})
