import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockUseParams = vi.fn(() => ({ slug: 'acme' }))

const mockOrg = { name: 'Acme', plan: 'starter', slug: 'acme' }
const mockProjects = [
  { id: 'p-1', name: 'new test',  key: 'NT', color: '#ec4899', description: null, isArchived: false, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'p-2', name: 'Planiqo P', key: 'PP', color: '#a78bfa', description: null, isArchived: false, createdAt: '2026-06-01T00:00:00Z' },
]

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => mockUseParams(),
  }
})

vi.mock('@/store/useOrgStore', () => ({
  useOrgStore: (selector: (s: { currentOrg: typeof mockOrg | null }) => unknown) =>
    selector({ currentOrg: mockOrg }),
}))

vi.mock('@/store/useProjectStore', () => ({
  useProjectStore: (selector: (s: { projects: typeof mockProjects }) => unknown) =>
    selector({ projects: mockProjects }),
}))

vi.mock('@/store/useIssueStore', () => ({
  useIssueStore: (selector: (s: { issues: never[]; statuses: never[] }) => unknown) =>
    selector({ issues: [], statuses: [] }),
}))

vi.mock('@/hooks/useKeyboardShortcut', () => ({
  useKeyboardShortcut: vi.fn(),
}))

vi.mock('./QuickSearchModal', () => ({
  QuickSearchModal: () => null,
}))

// ─── Import after mocks ──────────────────────────────────────────────────────

import DashboardPage from './DashboardPage'

// DashboardPage reads onNewProject from useOutletContext. The parent
// route component publishes the context via <Outlet context={...}>.
function ContextPublisher() {
  return <Outlet context={{ onNewProject: () => {} }} />
}

function RouterWithContext() {
  return (
    <Routes>
      <Route path="/:slug" element={<ContextPublisher />}>
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}

beforeEach(() => {
  mockUseParams.mockReturnValue({ slug: 'acme' })
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/acme/dashboard']}>
      <RouterWithContext />
    </MemoryRouter>
  )
}

describe('DashboardPage layout', () => {
  it('renders the project cards', () => {
    renderPage()
    expect(screen.getByText('new test')).toBeInTheDocument()
    expect(screen.getByText('Planiqo P')).toBeInTheDocument()
  })

  it('does NOT constrain the content to a fixed max-width (extra space fix)', () => {
    const { container } = renderPage()
    // The content wrapper must not have max-w-* (e.g. max-w-6xl) and
    // must not be centred with mx-auto — those create the wide empty
    // gutters on wide viewports.
    const constrained = container.querySelector('[class*="max-w-6xl"], [class*="max-w-5xl"], [class*="max-w-4xl"]')
    expect(constrained).toBeNull()
  })

  it('uses a fluid grid that fills the available width (auto-fit / minmax)', () => {
    const { container } = renderPage()
    const grid = container.querySelector('[data-testid="project-grid"]')
    expect(grid).not.toBeNull()
    // The grid must be fluid — auto-fit minmax, either via a class
    // (grid-cols-[repeat(auto-fit,minmax(280px,1fr))]) or via an inline
    // style.gridTemplateColumns. A plain lg:grid-cols-3 would fail this
    // because it leaves empty slots when there are fewer items.
    const styleAttr = grid!.getAttribute('style') ?? ''
    const cls = grid!.className
    const hasFluidStyle = /repeat\(\s*auto-fit\s*,\s*minmax\(/.test(styleAttr)
    const hasFluidClass = /grid-cols-\[repeat\(auto-fit/.test(cls) || /\bminmax\(/.test(cls)
    expect(hasFluidStyle || hasFluidClass).toBe(true)
    // And it must NOT use a plain fixed column count that would leave
    // empty slots when there are fewer items than columns.
    expect(cls).not.toMatch(/\blg:grid-cols-\d\b/)
  })

  it('renders one card per project', () => {
    const { container } = renderPage()
    const cards = Array.from(container.querySelectorAll('h3'))
      .filter((h) => h.textContent === 'new test' || h.textContent === 'Planiqo P')
    expect(cards.length).toBe(2)
  })
})
