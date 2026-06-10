import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import type { Project } from '@/types'
import { ProjectNavTree } from './ProjectNavTree'

// Pin desktop so the Sidebar renders inline (not into a Sheet portal).
import { vi } from 'vitest'
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))

function makeProject(overrides: Partial<Project>): Project {
  return {
    id: 'p1',
    orgId: 'o1',
    name: 'Core',
    key: 'COR',
    description: null,
    icon: null,
    color: '#ff0000',
    isArchived: false,
    createdBy: 'u1',
    createdAt: '2026-01-01T00:00:00.000Z',
    weeklyAutoCreate: false,
    ...overrides,
  } as Project
}

const projects: Project[] = [
  makeProject({ id: 'p1', name: 'Core', key: 'COR' }),
  makeProject({ id: 'p2', name: 'Website', key: 'WEB' }),
]

function renderTree(initialPath = '/acme/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <SidebarProvider>
        <ProjectNavTree projects={projects} slug="acme" />
      </SidebarProvider>
    </MemoryRouter>
  )
}

describe('ProjectNavTree', () => {
  it('renders an empty state when there are no projects', () => {
    render(
      <MemoryRouter>
        <SidebarProvider>
          <ProjectNavTree projects={[]} slug="acme" />
        </SidebarProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/no projects yet/i)).toBeInTheDocument()
  })

  it('renders each project name and key', () => {
    renderTree()
    expect(screen.getByText('Core')).toBeInTheDocument()
    expect(screen.getByText('WEB')).toBeInTheDocument()
  })

  it('keeps a non-active project collapsed until its row is clicked', async () => {
    const user = userEvent.setup()
    renderTree('/acme/dashboard')

    // Collapsed: the Board/Backlog sub-links are not in the DOM yet.
    expect(screen.queryByRole('link', { name: 'Board' })).toBeNull()

    await user.click(screen.getByRole('button', { name: /Core/ }))

    const board = screen.getByRole('link', { name: 'Board' })
    expect(board).toHaveAttribute('href', '/acme/projects/p1/board')
    expect(screen.getByRole('link', { name: 'Backlog' })).toHaveAttribute(
      'href',
      '/acme/projects/p1/backlog'
    )
  })

  it('expands the active project by default and marks the active sub-link', () => {
    renderTree('/acme/projects/p1/board')

    const board = screen.getByRole('link', { name: 'Board' })
    expect(board).toBeInTheDocument()
    expect(board).toHaveAttribute('data-active', 'true')
  })
})
