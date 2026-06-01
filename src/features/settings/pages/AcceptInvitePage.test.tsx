import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../../../test/mocks/server'
import { mockUser } from '../../../../test/mocks/handlers'
import { useAuthStore } from '@/store/useAuthStore'
import AcceptInvitePage from './AcceptInvitePage'

const TOKEN    = 'test-token-abc'
const ORG_SLUG = 'test-org'

function renderPage(token = TOKEN) {
  return render(
    <MemoryRouter initialEntries={[`/invite/${token}`]}>
      <Routes>
        <Route path="/invite/:token"        element={<AcceptInvitePage />} />
        <Route path="/:slug/dashboard"      element={<div>dashboard page</div>} />
        <Route path="/login"                element={<div>login page</div>} />
        <Route path="/signup"               element={<div>signup page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false })
})

afterEach(() => {
  vi.restoreAllMocks()
})

// =============================================================================
// UNAUTHENTICATED — invite card
// =============================================================================

describe('unauthenticated state', () => {
  it('shows the "You\'ve been invited" heading', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /you.ve been invited/i })).toBeInTheDocument()
  })

  it('"Sign in to accept" links to /login?invite={token}', () => {
    renderPage()
    const link = screen.getByRole('link', { name: /sign in to accept/i })
    expect(link).toHaveAttribute('href', `/login?invite=${TOKEN}`)
  })

  it('"Create account" links to /signup?invite={token}', () => {
    renderPage()
    const link = screen.getByRole('link', { name: /create account/i })
    expect(link).toHaveAttribute('href', `/signup?invite=${TOKEN}`)
  })

  it('does not make an API call when the user is not authenticated', () => {
    let apiCalled = false
    server.use(
      http.post('http://localhost:4000/orgs/invite/accept', () => {
        apiCalled = true
        return HttpResponse.json({ message: 'Invitation accepted', orgSlug: ORG_SLUG })
      })
    )
    renderPage()
    expect(apiCalled).toBe(false)
  })
})

// =============================================================================
// AUTHENTICATED — auto-accept on mount
// =============================================================================

describe('authenticated state', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user:            mockUser,
      accessToken:     'mock-access-token',
      isLoading:       false,
      isAuthenticated: true,
    })
  })

  it('shows "Joining workspace…" immediately on mount without showing the invite card', () => {
    renderPage()
    expect(screen.getByText(/joining workspace/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /you.ve been invited/i })).not.toBeInTheDocument()
  })

  it('shows "Welcome to the team! Redirecting…" after the API succeeds', async () => {
    renderPage()
    expect(await screen.findByText(/welcome to the team/i)).toBeInTheDocument()
  })

  it('navigates to /{orgSlug}/dashboard after a brief delay on success', async () => {
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    renderPage()
    await screen.findByText(/welcome to the team/i)

    const navigateCall = timeoutSpy.mock.calls.find(([, ms]) => ms === 1500)
    act(() => { (navigateCall?.[0] as () => void)() })

    expect(screen.getByText('dashboard page')).toBeInTheDocument()
  })

  it('shows the expired-token message when the API returns TOKEN_EXPIRED', async () => {
    server.use(
      http.post('http://localhost:4000/orgs/invite/accept', () =>
        HttpResponse.json({ error: 'TOKEN_EXPIRED', message: 'Token expired' }, { status: 400 })
      )
    )
    renderPage()
    expect(
      await screen.findByText(/this invite link has expired/i)
    ).toBeInTheDocument()
  })

  it('shows the already-used message when the API returns TOKEN_USED', async () => {
    server.use(
      http.post('http://localhost:4000/orgs/invite/accept', () =>
        HttpResponse.json({ error: 'TOKEN_USED', message: 'Token already used' }, { status: 400 })
      )
    )
    renderPage()
    expect(
      await screen.findByText(/this invite link has already been used/i)
    ).toBeInTheDocument()
  })

  it('shows the API error message for other errors', async () => {
    server.use(
      http.post('http://localhost:4000/orgs/invite/accept', () =>
        HttpResponse.json({ error: 'INTERNAL_ERROR', message: 'Something went wrong on the server' }, { status: 500 })
      )
    )
    renderPage()
    expect(
      await screen.findByText(/something went wrong on the server/i)
    ).toBeInTheDocument()
  })
})
