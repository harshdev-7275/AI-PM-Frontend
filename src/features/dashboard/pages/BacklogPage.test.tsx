import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Category, Sprint } from '@/types'
import BacklogPage from './BacklogPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams:   () => ({ slug: 'acme', projectId: 'p1' }),
    useNavigate: () => vi.fn(),
  }
})

vi.mock('@/store/useProjectStore', () => ({
  useProjectStore: (sel: (s: unknown) => unknown) =>
    sel({
      currentProject: { id: 'p1', name: 'Acme App', key: 'ACM', weeklyAutoCreate: false },
      projects: [],
    }),
}))

vi.mock('@/hooks/useProject', () => ({
  useProject: () => ({ updateProject: vi.fn() }),
}))

const sprints: Sprint[] = [
  {
    id: 'sp1', projectId: 'p1', orgId: 'o1', name: 'Sprint 1', goal: null,
    status: 'planned', startDate: null, endDate: null,
    createdBy: 'u1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
] as Sprint[]

const categories: Category[] = [
  { id: 'c-auth', projectId: 'p1', orgId: 'o1', name: 'Auth',     color: '#ef4444', description: null, sprintId: 'sp1', createdBy: 'u1', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'c-pay',  projectId: 'p1', orgId: 'o1', name: 'Payments', color: '#22c55e', description: null, sprintId: null,  createdBy: 'u1', createdAt: '2026-01-02T00:00:00Z' },
] as Category[]

function makeBacklogData() {
  return {
    sprints,
    backlogIssues: [],
    statuses:      [],
    categories,
    isLoading:        false,
    isCreatingSprint: false,
    allIssues:        [],
    loadBacklog:          vi.fn(),
    handleCreateSprint:   vi.fn(),
    handleCreateCategory: vi.fn(),
    handleUpdateCategory: vi.fn(),
    handleDeleteCategory: vi.fn(),
    handleCreateIssue:    vi.fn(),
    handleStartSprint:    vi.fn(),
    handleCompleteSprint: vi.fn(),
    handleAssignCategoryToSprint:     vi.fn(),
    handleUnassignCategoryFromSprint: vi.fn(),
  }
}

let backlogData = makeBacklogData()

vi.mock('@/hooks/useBacklog', () => ({
  useBacklog: () => backlogData,
}))

beforeEach(() => {
  vi.clearAllMocks()
  backlogData = makeBacklogData()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BacklogPage — categories grouped by sprint assignment', () => {
  it('shows a sprint-assigned category under its sprint name', () => {
    render(<BacklogPage />)

    const group = screen.getByTestId('sprint-group-sp1')
    // "Sprint 1" appears in the group header and in the assign dropdown trigger
    expect(within(group).getAllByText('Sprint 1').length).toBeGreaterThanOrEqual(1)
    expect(within(group).getByText('Auth')).toBeInTheDocument()
    expect(within(group).queryByText('Payments')).not.toBeInTheDocument()
  })

  it('shows a category without a sprint under "Unassigned"', () => {
    render(<BacklogPage />)

    const group = screen.getByTestId('sprint-group-unassigned')
    expect(within(group).getByText('Unassigned')).toBeInTheDocument()
    expect(within(group).getByText('Payments')).toBeInTheDocument()
    expect(within(group).queryByText('Auth')).not.toBeInTheDocument()
  })

  it('does not offer category creation — that moved to the Board', () => {
    render(<BacklogPage />)

    expect(screen.queryByRole('button', { name: /new category/i })).not.toBeInTheDocument()
  })
})
