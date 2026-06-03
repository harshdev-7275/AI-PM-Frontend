import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useOrgStore } from '@/store/useOrgStore'
import { PublicRoute } from './PublicRoute'

const mockOrg = {
  id:        '456e7890-e89b-12d3-a456-426614174000',
  name:      'Test Org',
  slug:      'test-org',
  logoUrl:   null,
  plan:      'starter',
  isActive:  true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false })
  useOrgStore.setState({ currentOrg: null, orgs: [], isLoading: false })
})

describe('PublicRoute', () => {
  it('renders nothing while auth is initializing', () => {
    useAuthStore.setState({ isLoading: true, isAuthenticated: false, user: null, accessToken: null })

    render(
      <MemoryRouter>
        <PublicRoute><div>login form</div></PublicRoute>
      </MemoryRouter>
    )

    expect(screen.queryByText('login form')).not.toBeInTheDocument()
  })

  it('redirects to the org dashboard when user is authenticated and has a current org', () => {
    useAuthStore.setState({
      isLoading:       false,
      isAuthenticated: true,
      user:            { id: '1', name: 'Test', email: 'test@example.com', avatarUrl: null, jobTitle: null, timezone: 'UTC', createdAt: '2026-01-01T00:00:00.000Z' },
      accessToken:     'mock-token',
    })
    useOrgStore.setState({ currentOrg: mockOrg, orgs: [mockOrg], isLoading: false })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login"              element={<PublicRoute><div>login form</div></PublicRoute>} />
          <Route path="/test-org/dashboard" element={<div>dashboard page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('dashboard page')).toBeInTheDocument()
    expect(screen.queryByText('login form')).not.toBeInTheDocument()
  })

  it('loads the user orgs and redirects to the dashboard when authenticated but no org is loaded yet', async () => {
    useAuthStore.setState({
      isLoading:       false,
      isAuthenticated: true,
      user:            { id: '1', name: 'Test', email: 'test@example.com', avatarUrl: null, jobTitle: null, timezone: 'UTC', createdAt: '2026-01-01T00:00:00.000Z' },
      accessToken:     'mock-access-token',
    })
    // currentOrg remains null — simulates a fresh reload that lands on /login
    // before any org has been loaded into the in-memory store.

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login"              element={<PublicRoute><div>login form</div></PublicRoute>} />
          <Route path="/test-org/dashboard" element={<div>dashboard page</div>} />
        </Routes>
      </MemoryRouter>
    )

    // It must resolve the org and route the user in — never trap them on /login.
    expect(await screen.findByText('dashboard page')).toBeInTheDocument()
    expect(screen.queryByText('login form')).not.toBeInTheDocument()
  })

  it('renders children when user is not authenticated', () => {
    render(
      <MemoryRouter>
        <PublicRoute><div>login form</div></PublicRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('login form')).toBeInTheDocument()
  })
})
