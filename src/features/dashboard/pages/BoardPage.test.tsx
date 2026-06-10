import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Category, Issue, IssueStatus, Sprint } from '@/types'
import BoardPage from './BoardPage'

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
    sel({ currentProject: { id: 'p1', name: 'Acme App', key: 'ACM' }, projects: [] }),
}))

const statuses: IssueStatus[] = [
  { id: 's-todo', name: 'Todo',        color: '#888888', position: 1, category: 'todo' },
  { id: 's-prog', name: 'In Progress', color: '#3b82f6', position: 2, category: 'in_progress' },
] as IssueStatus[]

const categories: Category[] = [
  { id: 'c-auth', projectId: 'p1', orgId: 'o1', name: 'Auth',     color: '#ef4444', description: null, sprintId: null, createdBy: 'u1', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'c-pay',  projectId: 'p1', orgId: 'o1', name: 'Payments', color: '#22c55e', description: null, sprintId: null, createdBy: 'u1', createdAt: '2026-01-02T00:00:00Z' },
] as Category[]

const issues: Issue[] = [
  { id: 'i1', number: 1, title: 'Login bug',      type: 'bug',     priority: 'high',   statusId: 's-todo', categoryId: 'c-auth', sprintId: null, assigneeId: null },
  { id: 'i2', number: 2, title: 'OAuth feature',  type: 'feature', priority: 'medium', statusId: 's-prog', categoryId: 'c-auth', sprintId: null, assigneeId: null },
  { id: 'i3', number: 3, title: 'Stripe webhook', type: 'task',    priority: 'medium', statusId: 's-todo', categoryId: 'c-pay',  sprintId: null, assigneeId: null },
] as Issue[]

const sprints: Sprint[] = []

function makeBoardData() {
  return {
    statuses,
    issues,
    sprints,
    categories,
    isLoading: false,
    handleDragEnd:        vi.fn(),
    handleCreateIssue:    vi.fn(),
    handleCreateCategory: vi.fn(),
  }
}

let boardData = makeBoardData()

vi.mock('@/hooks/useBoardData', () => ({
  useBoardData: () => boardData,
}))

beforeEach(() => {
  vi.clearAllMocks()
  boardData = makeBoardData()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BoardPage — category swimlanes', () => {
  it('renders one swimlane per category with name and issue count', () => {
    render(<BoardPage />)

    const authLane = screen.getByTestId('lane-c-auth')
    const payLane  = screen.getByTestId('lane-c-pay')

    expect(within(authLane).getByText('Auth')).toBeInTheDocument()
    expect(within(authLane).getByText('2')).toBeInTheDocument()   // issue count
    expect(within(payLane).getByText('Payments')).toBeInTheDocument()
    expect(within(payLane).getByText('1')).toBeInTheDocument()
  })

  it('places issues in the correct category lane', () => {
    render(<BoardPage />)

    const authLane = screen.getByTestId('lane-c-auth')
    const payLane  = screen.getByTestId('lane-c-pay')

    expect(within(authLane).getByText('Login bug')).toBeInTheDocument()
    expect(within(authLane).getByText('OAuth feature')).toBeInTheDocument()
    expect(within(authLane).queryByText('Stripe webhook')).not.toBeInTheDocument()
    expect(within(payLane).getByText('Stripe webhook')).toBeInTheDocument()
  })

  it('renders the status headers once across the top', () => {
    render(<BoardPage />)

    expect(screen.getAllByText('Todo')).toHaveLength(1)
    expect(screen.getAllByText('In Progress')).toHaveLength(1)
  })

  it('opens the create-category modal from the "New category" button', async () => {
    const user = userEvent.setup()
    render(<BoardPage />)

    await user.click(screen.getByRole('button', { name: /new category/i }))

    expect(screen.getByText(/create category/i)).toBeInTheDocument()
  })

  it('opens a context menu with "Add issue" on right-click in a lane cell', async () => {
    const user = userEvent.setup()
    render(<BoardPage />)

    await user.pointer({ keys: '[MouseRight]', target: screen.getByTestId('cell-c-auth-s-todo') })

    expect(await screen.findByRole('menuitem', { name: /add issue/i })).toBeInTheDocument()
  })

  it('shows a create-category empty state when there are no categories', () => {
    boardData = { ...makeBoardData(), categories: [], issues: [] }
    render(<BoardPage />)

    expect(screen.getByText(/no categories yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new category/i })).toBeInTheDocument()
  })
})
