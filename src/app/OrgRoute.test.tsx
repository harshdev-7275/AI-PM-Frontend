import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useOrgStore } from '@/store/useOrgStore'
import { OrgRoute } from './OrgRoute'

// The MSW handler for GET /orgs/me returns a single org with slug "test-org".

beforeEach(() => {
  useAuthStore.setState({
    user:            { id: '1', name: 'Test', email: 'test@example.com', avatarUrl: null, jobTitle: null, timezone: 'UTC', createdAt: '2026-01-01T00:00:00.000Z' },
    accessToken:     'mock-access-token',
    isLoading:       false,
    isAuthenticated: true,
  })
  useOrgStore.setState({ currentOrg: null, orgs: [], isLoading: false })
})

function renderAtSlug(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/${slug}/dashboard`]}>
      <Routes>
        <Route path="/:slug/dashboard" element={<OrgRoute><div>org content</div></OrgRoute>} />
        <Route path="/login"           element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('OrgRoute', () => {
  it('loads the user orgs and renders children when the URL slug matches an org', async () => {
    renderAtSlug('test-org')

    expect(await screen.findByText('org content')).toBeInTheDocument()
    expect(useOrgStore.getState().currentOrg?.slug).toBe('test-org')
  })

  it('redirects to /login when the URL slug matches none of the user orgs', async () => {
    renderAtSlug('unknown-org')

    expect(await screen.findByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('org content')).not.toBeInTheDocument()
  })

  it('renders children immediately when the matching org is already current', async () => {
    const org = { id: '456e7890-e89b-12d3-a456-426614174000', name: 'Test Org', slug: 'test-org', logoUrl: null, plan: 'starter', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' }
    useOrgStore.setState({ currentOrg: org, orgs: [org], isLoading: false })

    renderAtSlug('test-org')

    expect(await screen.findByText('org content')).toBeInTheDocument()
  })
})
