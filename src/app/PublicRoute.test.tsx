import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { PublicRoute } from './PublicRoute'

beforeEach(() => {
  useAuthStore.setState({
    user:            null,
    accessToken:     null,
    isLoading:       false,
    isAuthenticated: false,
  })
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

  it('redirects to /dashboard when user is already authenticated', () => {
    useAuthStore.setState({
      isLoading:       false,
      isAuthenticated: true,
      user:            { id: '1', name: 'Test', email: 'test@example.com', avatarUrl: null, jobTitle: null, timezone: 'UTC', createdAt: '2026-01-01T00:00:00.000Z' },
      accessToken:     'mock-token',
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={
            <PublicRoute><div>login form</div></PublicRoute>
          } />
          <Route path="/dashboard" element={<div>dashboard page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('dashboard page')).toBeInTheDocument()
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
