import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockLogout = vi.fn()
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

// Mock sonner toast so logout failures don't pollute test output.
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

// ─── Import after mocks ──────────────────────────────────────────────────────

import { ProfileMenu } from './ProfileMenu'

beforeEach(() => {
  mockLogout.mockReset()
  mockNavigate.mockReset()
})

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('ProfileMenu', () => {
  it('renders the trigger with the given initials', () => {
    renderWithRouter(<ProfileMenu initials="PL" />)
    expect(screen.getByRole('button', { name: /PL/i })).toBeInTheDocument()
  })

  it('does not show the menu by default', () => {
    renderWithRouter(<ProfileMenu initials="PL" />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens the menu with a Logout item when the trigger is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProfileMenu initials="PL" />)

    await user.click(screen.getByRole('button', { name: /PL/i }))

    const menu = await screen.findByRole('menu')
    const logoutItem = within(menu).getByRole('menuitem', { name: /log ?out/i })
    expect(logoutItem).toBeInTheDocument()
  })

  it('calls useAuth().logout() and navigates to /login when Logout is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProfileMenu initials="PL" />)

    await user.click(screen.getByRole('button', { name: /PL/i }))
    const logoutItem = await screen.findByRole('menuitem', { name: /log ?out/i })
    await user.click(logoutItem)

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('does not navigate to /login if logout throws', async () => {
    mockLogout.mockRejectedValueOnce(new Error('network down'))
    const user = userEvent.setup()
    renderWithRouter(<ProfileMenu initials="PL" />)

    await user.click(screen.getByRole('button', { name: /PL/i }))
    const logoutItem = await screen.findByRole('menuitem', { name: /log ?out/i })
    await user.click(logoutItem)

    // Logout was attempted…
    expect(mockLogout).toHaveBeenCalledTimes(1)
    // …but we should NOT navigate away when the backend logout fails.
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('closes the menu when Escape is pressed', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProfileMenu initials="PL" />)

    await user.click(screen.getByRole('button', { name: /PL/i }))
    expect(await screen.findByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
