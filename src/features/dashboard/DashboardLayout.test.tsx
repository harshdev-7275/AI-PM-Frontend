import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockLoadProjects = vi.fn()
const mockUseParams     = vi.fn(() => ({ slug: 'acme' }))

// Pin useIsMobile to false so shadcn Sidebar renders the desktop variant
// (a plain <aside>) — the mobile variant renders into a <Sheet> portal.
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}))

vi.mock('@/hooks/useProject', () => ({
  useProject: () => ({
    projects:     [],
    loadProjects: mockLoadProjects,
    isLoading:    false,
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => mockUseParams(),
  }
})

vi.mock('@/store/useOrgStore', () => ({
  useOrgStore: (selector: (s: { currentOrg: { name: string; plan: string; slug: string } | null }) => unknown) =>
    selector({ currentOrg: { name: 'Acme', plan: 'starter', slug: 'acme' } }),
}))

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({ isLoading: false }),
  },
  // Default selector: a logged-in test user.
  useAuthStoreSelector: { user: { name: 'Harsh Patel', email: 'harsh@planigo.com', avatarUrl: null } },
}))

// The store's default selector must return a user. We achieve that with
// the mock below — vi.mock is hoisted, so we wire the implementation
// directly into the store factory.
vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: (selector?: (s: { user: { name: string; email: string; avatarUrl: string | null } | null }) => unknown) => {
    const state = { user: { name: 'Harsh Patel', email: 'harsh@planigo.com', avatarUrl: null } }
    return selector ? selector(state) : state
  },
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
  mockUseParams.mockReturnValue({ slug: 'acme' })
  // Default cookie state — sidebar expanded.
  document.cookie = 'sidebar_state=true; path=/'
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

describe('DashboardLayout (shadcn Sidebar)', () => {
  it('renders the children route content', async () => {
    renderLayout()
    expect(await screen.findByTestId('child')).toBeInTheDocument()
  })

  it('renders exactly one shadcn Sidebar (data-slot="sidebar")', () => {
    const { container } = renderLayout()
    const sidebars = container.querySelectorAll('[data-slot="sidebar"]')
    expect(sidebars.length).toBe(1)
  })

  it('places the ProfileMenu inside the sidebar (full-width user row)', () => {
    const { container } = renderLayout()
    const sidebar = container.querySelector('[data-slot="sidebar"]')
    expect(sidebar).not.toBeNull()
    // The trigger shows the user name (mocked to "Harsh Patel")
    const profileButton = within(sidebar as HTMLElement).getByRole('button', { name: /harsh patel/i })
    expect(profileButton).toBeInTheDocument()
    // The full row also shows the email
    expect(within(sidebar as HTMLElement).getByText('harsh@planigo.com')).toBeInTheDocument()
  })

  it('renders the primary nav inside the sidebar', () => {
    const { container } = renderLayout()
    const sidebar = container.querySelector('[data-slot="sidebar"]')
    expect(sidebar).not.toBeNull()
    expect(within(sidebar as HTMLElement).getByText('Boards')).toBeInTheDocument()
    expect(within(sidebar as HTMLElement).getByText('Issues')).toBeInTheDocument()
    expect(within(sidebar as HTMLElement).getByText('Sprints')).toBeInTheDocument()
    expect(within(sidebar as HTMLElement).getByText('Analytics')).toBeInTheDocument()
  })

  it('groups the primary nav under a "Workspace" section label', () => {
    const { container } = renderLayout()
    const sidebar = container.querySelector('[data-slot="sidebar"]')
    expect(sidebar).not.toBeNull()
    expect(within(sidebar as HTMLElement).getByText('Workspace')).toBeInTheDocument()
  })

  it('marks the nav item matching the current route as active', () => {
    const { container } = renderLayout('/acme/dashboard')
    const sidebar = container.querySelector('[data-slot="sidebar"]')
    const boards = within(sidebar as HTMLElement).getByRole('link', { name: 'Boards' })
    const issues = within(sidebar as HTMLElement).getByRole('link', { name: 'Issues' })
    expect(boards).toHaveAttribute('data-active', 'true')
    expect(issues).toHaveAttribute('data-active', 'false')
  })

  it('renders the shadcn SidebarTrigger in the topbar', () => {
    renderLayout()
    expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument()
  })

  it('shows a breadcrumb for the current section in the topbar', () => {
    renderLayout('/acme/dashboard')
    const nav = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(within(nav).getByText('Acme')).toBeInTheDocument()
    expect(within(nav).getByText('Boards')).toBeInTheDocument()
  })

  it('clicking the trigger flips the sidebar to collapsed state', async () => {
    const user = userEvent.setup()
    const { container } = renderLayout()

    // Expanded: the Boards nav label is visible in the sidebar.
    const sidebar = container.querySelector('[data-slot="sidebar"]') as HTMLElement
    expect(within(sidebar).getByText('Boards')).toBeVisible()

    await user.click(screen.getByRole('button', { name: /toggle sidebar/i }))

    // After collapse, the data-state flips on the sidebar wrapper.
    const wrapper = container.querySelector('[data-slot="sidebar-wrapper"]')
    expect(wrapper).not.toBeNull()
    // Either the sidebar element itself or the wrapper has data-state=collapsed.
    const collapsedEl = container.querySelector('[data-state="collapsed"]')
    expect(collapsedEl).not.toBeNull()
  })

  it('clicking the trigger again restores the expanded state', async () => {
    const user = userEvent.setup()
    const { container } = renderLayout()

    await user.click(screen.getByRole('button', { name: /toggle sidebar/i }))
    expect(container.querySelector('[data-state="collapsed"]')).not.toBeNull()

    await user.click(screen.getByRole('button', { name: /toggle sidebar/i }))
    // After restore, no collapsed element should be present.
    expect(container.querySelector('[data-state="collapsed"]')).toBeNull()
    // Boards nav label visible again in the sidebar.
    const sidebar = container.querySelector('[data-slot="sidebar"]') as HTMLElement
    expect(within(sidebar).getByText('Boards')).toBeVisible()
  })
})
