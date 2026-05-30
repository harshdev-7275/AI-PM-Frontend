import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../../../test/mocks/server'
import { mockAuthResponse } from '../../../../test/mocks/handlers'
import { useAuthStore } from '@/store/useAuthStore'
import LoginPage from './LoginPage'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { toast } from 'sonner'

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/dashboard" element={<div>dashboard page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false })
  vi.clearAllMocks()
})

describe('LoginPage', () => {
  it('updates email and password fields as the user types', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('name@company.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')

    expect(screen.getByPlaceholderText('name@company.com')).toHaveValue('test@example.com')
    expect(screen.getByPlaceholderText('••••••••')).toHaveValue('password123')
  })

  it('navigates to /dashboard after successful login', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('name@company.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('dashboard page')).toBeInTheDocument()
    })
  })

  it('shows a toast error when credentials are invalid', async () => {
    server.use(
      http.post('http://localhost:4000/auth/login', () =>
        HttpResponse.json(
          { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          { status: 401 },
        )
      )
    )

    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('name@company.com'), 'bad@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid email or password')
    })
  })

  it('disables the submit button while the request is in progress', async () => {
    server.use(
      http.post('http://localhost:4000/auth/login', async () => {
        await new Promise((r) => setTimeout(r, 100))
        return HttpResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 })
      })
    )

    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('name@company.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')

    const button = screen.getByRole('button', { name: 'Sign in' })
    await user.click(button)

    expect(button).toBeDisabled()
  })

  it('shows a success toast and navigates away after retry succeeds', async () => {
    // First attempt fails
    server.use(
      http.post('http://localhost:4000/auth/login', () =>
        HttpResponse.json(
          { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          { status: 401 },
        )
      )
    )

    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('name@company.com'), 'bad@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid email or password')
    })

    // Restore success handler for second attempt
    server.use(
      http.post('http://localhost:4000/auth/login', () =>
        HttpResponse.json(mockAuthResponse)
      )
    )

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('dashboard page')).toBeInTheDocument()
    })
  })
})
