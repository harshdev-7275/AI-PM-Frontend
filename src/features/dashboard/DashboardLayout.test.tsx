import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useSidebarStore } from '@/store/useSidebarStore'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockLoadProjects = vi.fn()
const mockNavigate = vi.fn()
const mockUseParams = vi.fn(() => ({ slug: 'acme' }))

vi.mock('@/hooks/useProject', () => ({
  useProject: () => ({
    projects:    [],
    loadProjects: mockLoadProjects,
    isLoading:   false,
  }),
}))

// loadProjects is awaited and then .finally() is called — return a resolved Promise
mockLoadProjects.mockResolvedValue(undefined)

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams:   () => mockUseParams(),
  }
})

vi.mock('@/store/useOrgStore', () => ({
  useOrgStore: (selector: (s: { currentOrg: { name: string; plan: string; slug: string } | null }) => unknown) =>
    selector({ currentOrg: { name: 'Acme', plan: 'starter', slug: 'acme' } }),
}))

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: { getState: () => ({ isLoading: false }) },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ logout: vi.fn() }),
}))

vi.mock('@/components/blocks/DashboardLoadingSkeleton', () => ({
  DashboardLoadingSkeleton: () => <div data-testid="loading-skeleton" />,
}))

vi.mock('./NewProjectModal', () => ({
  default: () => null,
}))

// ─── Import after mocks ──────────────────────────────────────────────────────

import DashboardLayout from './DashboardLayout'

beforeEach(() => {
  mockLoadProjects.mockReset()
  mockLoadProjects.mockResolvedValue(undefined)
  mockNavigate.mockReset()
  mockUseParams.mockReturnValue({ slug: 'acme' })
  // Reset sidebar to expanded — Zustand store is module-level.
  useSidebarStore.setState({ isCollapsed: false })
})

function renderLayout(initialPath = '/acme/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/:slug" element={<DashboardLayout />}>
          <Route path="dashboard" element={<div data-testid="child">child</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('DashboardLayout', () => {
  it('renders the children route content', async () => {
    renderLayout()
    // The layout shows a skeleton until the initial projects load resolves;
    // use findByTestId to wait for the child to mount.
    expect(await screen.findByTestId('child')).toBeInTheDocument()
  })

  it('renders exactly one sidebar (the icon rail was removed)', () => {
    const { container } = renderLayout()
    // Aside elements are sidebars
    const sidebars = container.querySelectorAll('aside')
    expect(sidebars.length).toBe(1)
  })

  it('renders the ProfileMenu inside the sidebar (not in a separate icon rail)', () => {
    const { container } = renderLayout()
    const sidebar = container.querySelector('aside')
    expect(sidebar).not.toBeNull()
    // The profile button has initials (defaulting to org initials "AC")
    const profileButton = within(sidebar as HTMLElement).getByRole('button', { name: /ac/i })
    expect(profileButton).toBeInTheDocument()
  })

  it('still renders the primary nav items inside the single sidebar', () => {
    const { container } = renderLayout()
    const sidebar = container.querySelector('aside')
    expect(sidebar).not.toBeNull()
    const nav = within(sidebar as HTMLElement).getByRole('navigation')
    // The first nav inside the sidebar lists the primary routes
    expect(within(nav).getByText('Boards')).toBeInTheDocument()
    expect(within(nav).getByText('Issues')).toBeInTheDocument()
    expect(within(nav).getByText('Sprints')).toBeInTheDocument()
    expect(within(nav).getByText('AI Assistant')).toBeInTheDocument()
    expect(within(nav).getByText('Analytics')).toBeInTheDocument()
  })

  it('renders a collapse/expand toggle button inside the sidebar', () => {
    renderLayout()
    // The button has an accessible name based on its current state.
    const toggle = screen.getByRole('button', { name: /collapse sidebar/i })
    expect(toggle).toBeInTheDocument()
  })

  it('clicking the toggle hides the nav labels (sidebar collapses)', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    renderLayout()
    // Initially expanded — labels are present.
    expect(screen.getByText('Boards')).toBeVisible()

    await user.click(screen.getByRole('button', { name: /collapse sidebar/i }))

    // After collapse, the primary nav labels are removed from the DOM
    // (we render the icon-only variant of the row).
    expect(screen.queryByText('Boards')).not.toBeInTheDocument()
    // And the toggle's accessible name flips to "expand".
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument()
  })

  it('clicking the toggle twice restores the labels', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    renderLayout()

    const collapseBtn = screen.getByRole('button', { name: /collapse sidebar/i })
    await user.click(collapseBtn)
    expect(screen.queryByText('Boards')).not.toBeInTheDocument()

    const expandBtn = screen.getByRole('button', { name: /expand sidebar/i })
    await user.click(expandBtn)
    expect(screen.getByText('Boards')).toBeInTheDocument()
  })
})
