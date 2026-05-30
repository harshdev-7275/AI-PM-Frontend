import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { ProtectedRoute } from './ProtectedRoute'

beforeEach(() => {
  useAuthStore.setState({
    user:            null,
    accessToken:     null,
    isLoading:       false,
    isAuthenticated: false,
  })
})

describe('ProtectedRoute', () => {
  it('renders nothing while auth is initializing', () => {
    useAuthStore.setState({ isLoading: true, isAuthenticated: false, user: null, accessToken: null })

    render(
      <MemoryRouter>
        <ProtectedRoute><div>protected content</div></ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('redirects to /login when user is not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={
            <ProtectedRoute><div>protected content</div></ProtectedRoute>
          } />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('renders children when user is authenticated', () => {
    useAuthStore.setState({
      isLoading:       false,
      isAuthenticated: true,
      user:            { id: '1', name: 'Test', email: 'test@example.com', avatarUrl: null, jobTitle: null, timezone: 'UTC', createdAt: '2026-01-01T00:00:00.000Z' },
      accessToken:     'mock-token',
    })

    render(
      <MemoryRouter>
        <ProtectedRoute><div>protected content</div></ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('protected content')).toBeInTheDocument()
  })
})
