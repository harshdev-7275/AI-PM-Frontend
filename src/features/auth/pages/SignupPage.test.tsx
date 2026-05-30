import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../../../test/mocks/server'
import { mockAuthResponse } from '../../../../test/mocks/handlers'
import { useAuthStore } from '@/store/useAuthStore'
import SignupPage from './SignupPage'

function renderSignupPage() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup"    element={<SignupPage />} />
        <Route path="/dashboard" element={<div>dashboard page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  useAuthStore.setState({
    user:            null,
    accessToken:     null,
    isLoading:       false,
    isAuthenticated: false,
  })
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
  await user.click(screen.getByRole('button', { name: 'Engineer' }))
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

describe('Step 1 — Account details', () => {
  it('shows a validation error when password is less than 8 characters', async () => {
    const user = userEvent.setup()
    renderSignupPage()

    await user.type(screen.getByPlaceholderText('Jane Doe'), 'Test User')
    await user.type(screen.getByPlaceholderText('jane@company.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'short')
    await user.click(screen.getByRole('button', { name: /^continue$/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i)
  })

  it('does not advance when validation fails', async () => {
    const user = userEvent.setup()
    renderSignupPage()

    await user.type(screen.getByPlaceholderText('••••••••'), 'short')
    await user.click(screen.getByRole('button', { name: /^continue$/i }))

    // Still on step 1
    expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument()
  })

  it('advances to step 2 when all fields are valid', async () => {
    const user = userEvent.setup()
    renderSignupPage()

    await fillStep1AndContinue(user)

    // Step 2 role grid is visible
    expect(screen.getByRole('button', { name: 'Engineer' })).toBeInTheDocument()
  })
})

// ─── Step 2 ───────────────────────────────────────────────────────────────────

describe('Step 2 — Role selection', () => {
  it('advances to step 3 immediately when a role card is clicked', async () => {
    const user = userEvent.setup()
    renderSignupPage()

    await fillStep1AndContinue(user)
    await user.click(screen.getByRole('button', { name: 'Engineer' }))

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
  it('calls register and navigates to /dashboard on success', async () => {
    server.use(
      http.post('http://localhost:4000/auth/register', () =>
        HttpResponse.json(mockAuthResponse, { status: 201 })
      )
    )

    const user = userEvent.setup()
    renderSignupPage()

    await goToStep3(user)
    await user.click(screen.getByRole('button', { name: /create workspace/i }))

    await waitFor(() => {
      expect(screen.getByText('dashboard page')).toBeInTheDocument()
    })
  })

  it('shows an error message when registration fails', async () => {
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
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('goes back to step 2 when the back button is clicked', async () => {
    const user = userEvent.setup()
    renderSignupPage()

    await goToStep3(user)
    await user.click(screen.getByRole('button', { name: /back/i }))

    expect(screen.getByRole('button', { name: 'Engineer' })).toBeInTheDocument()
  })
})
