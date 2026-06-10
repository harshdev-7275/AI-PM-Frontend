import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../../../test/mocks/server'
import { mockAuthResponse, mockOrg } from '../../../../test/mocks/handlers'
import { useAuthStore } from '@/store/useAuthStore'
import SignupPage from './SignupPage'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { toast } from 'sonner'

function renderSignupPage(initialUrl = '/signup') {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <Routes>
        <Route path="/signup"          element={<SignupPage />} />
        <Route path="/:slug/dashboard" element={<div>dashboard page</div>} />
        <Route path="/invite/:token"   element={<div>invite page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false })
  vi.clearAllMocks()
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fillStep1AndContinue(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Jane Doe'), 'Test User')
  await user.type(screen.getByPlaceholderText('jane@company.com'), 'test@example.com')
  await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
  await user.click(screen.getByRole('button', { name: /^continue$/i }))
}

async function goToStep3(user: ReturnType<typeof userEvent.setup>) {
  await fillStep1AndContinue(user)
  await user.click(screen.getByRole('radio', { name: 'Engineer' }))
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

describe('Step 1 — Account details', () => {
  it('shows a toast error when password is less than 8 characters', async () => {
    const user = userEvent.setup()
    renderSignupPage()

    await user.type(screen.getByPlaceholderText('Jane Doe'), 'Test User')
    await user.type(screen.getByPlaceholderText('jane@company.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'short')
    await user.click(screen.getByRole('button', { name: /^continue$/i }))

    expect(toast.error).toHaveBeenCalledWith('Password must be at least 8 characters')
  })

  it('does not advance when validation fails', async () => {
    const user = userEvent.setup()
    renderSignupPage()

    await user.type(screen.getByPlaceholderText('••••••••'), 'short')
    await user.click(screen.getByRole('button', { name: /^continue$/i }))

    expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument()
  })

  it('advances to step 2 when all fields are valid', async () => {
    const user = userEvent.setup()
    renderSignupPage()

    await fillStep1AndContinue(user)

    expect(screen.getByRole('radio', { name: 'Engineer' })).toBeInTheDocument()
  })
})

// ─── Step 2 ───────────────────────────────────────────────────────────────────

describe('Step 2 — Role selection', () => {
  it('advances to step 3 immediately when a role card is clicked', async () => {
    const user = userEvent.setup()
    renderSignupPage()

    await fillStep1AndContinue(user)
    await user.click(screen.getByRole('radio', { name: 'Engineer' }))

    expect(screen.getByRole('button', { name: /create workspace/i })).toBeInTheDocument()
  })

  it('goes back to step 1 when the back button is clicked', async () => {
    const user = userEvent.setup()
    renderSignupPage()

    await fillStep1AndContinue(user)
    await user.click(screen.getByRole('button', { name: /back/i }))

    expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument()
  })
})

// ─── Step 3 ───────────────────────────────────────────────────────────────────

describe('Step 3 — Organization details', () => {
  it('registers, creates org, and navigates to the org dashboard on success', async () => {
    server.use(
      http.post('http://localhost:4000/auth/register', () =>
        HttpResponse.json(mockAuthResponse, { status: 201 })
      ),
      http.post('http://localhost:4000/orgs', () =>
        HttpResponse.json(mockOrg, { status: 201 })
      ),
    )

    const user = userEvent.setup()
    renderSignupPage()

    await goToStep3(user)
    await user.click(screen.getByRole('button', { name: /create workspace/i }))

    await waitFor(() => {
      expect(screen.getByText('dashboard page')).toBeInTheDocument()
    })
  })

  it('shows a toast error when registration fails', async () => {
    server.use(
      http.post('http://localhost:4000/auth/register', () =>
        HttpResponse.json(
          { error: 'EMAIL_TAKEN', message: 'An account with this email already exists' },
          { status: 409 },
        )
      )
    )

    const user = userEvent.setup()
    renderSignupPage()

    await goToStep3(user)
    await user.click(screen.getByRole('button', { name: /create workspace/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong. Please try again.')
    })
  })

  it('shows a toast error when org creation fails', async () => {
    server.use(
      http.post('http://localhost:4000/auth/register', () =>
        HttpResponse.json(mockAuthResponse, { status: 201 })
      ),
      http.post('http://localhost:4000/orgs', () =>
        HttpResponse.json({ error: 'SLUG_TAKEN', message: 'Slug already taken' }, { status: 409 })
      ),
    )

    const user = userEvent.setup()
    renderSignupPage()

    await goToStep3(user)
    await user.click(screen.getByRole('button', { name: /create workspace/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong. Please try again.')
    })
  })

  it('goes back to step 2 when the back button is clicked', async () => {
    const user = userEvent.setup()
    renderSignupPage()

    await goToStep3(user)
    await user.click(screen.getByRole('button', { name: /back/i }))

    expect(screen.getByRole('radio', { name: 'Engineer' })).toBeInTheDocument()
  })
})

// =============================================================================
// INVITE FLOW
// =============================================================================

describe('invite query param', () => {
  it('skips workspace creation and redirects to /invite/{token} after the role step', async () => {
    let orgCreated = false
    server.use(
      http.post('http://localhost:4000/auth/register', () =>
        HttpResponse.json(mockAuthResponse, { status: 201 })
      ),
      http.post('http://localhost:4000/orgs', () => {
        orgCreated = true
        return HttpResponse.json(mockOrg, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    renderSignupPage('/signup?invite=abc-invite-token')

    // Selecting a role completes signup — step 3 (create workspace) never shows
    await fillStep1AndContinue(user)
    await user.click(screen.getByRole('radio', { name: 'Engineer' }))

    await waitFor(() => {
      expect(screen.getByText('invite page')).toBeInTheDocument()
    })
    expect(orgCreated).toBe(false)
  })

  it('stays on the wizard and shows an error toast when registration fails', async () => {
    server.use(
      http.post('http://localhost:4000/auth/register', () =>
        HttpResponse.json(
          { error: 'EMAIL_TAKEN', message: 'An account with this email already exists' },
          { status: 409 },
        )
      ),
    )

    const user = userEvent.setup()
    renderSignupPage('/signup?invite=abc-invite-token')

    await fillStep1AndContinue(user)
    await user.click(screen.getByRole('radio', { name: 'Engineer' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong. Please try again.')
    })
    expect(screen.queryByText('invite page')).not.toBeInTheDocument()
  })
})
