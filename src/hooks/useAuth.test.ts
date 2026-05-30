import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mocks/server'
import { mockUser, mockAuthResponse } from '../../test/mocks/handlers'
import { useAuthStore } from '@/store/useAuthStore'
import { useAuth } from './useAuth'

beforeEach(() => {
  useAuthStore.setState({
    user:            null,
    accessToken:     null,
    isLoading:       true,
    isAuthenticated: false,
  })
})

// =============================================================================
// login
// =============================================================================

describe('login', () => {
  it('sets user and isAuthenticated after successful login', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login('test@example.com', 'password123')
    })

    expect(result.current.user?.email).toBe(mockUser.email)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('throws so the form can catch and display the error', async () => {
    server.use(
      http.post('http://localhost:4000/auth/login', () =>
        HttpResponse.json(
          { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          { status: 401 },
        )
      )
    )

    const { result } = renderHook(() => useAuth())

    await expect(
      act(async () => {
        await result.current.login('bad@example.com', 'wrong')
      })
    ).rejects.toThrow()

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})

// =============================================================================
// register
// =============================================================================

describe('register', () => {
  it('sets user and isAuthenticated after successful registration', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.register('Test User', 'test@example.com', 'password123', 'engineer')
    })

    expect(result.current.user?.name).toBe(mockUser.name)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('registers without optional jobTitle', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.register('Test User', 'test@example.com', 'password123')
    })

    expect(result.current.isAuthenticated).toBe(true)
  })

  it('throws on duplicate email so the form can show an error', async () => {
    server.use(
      http.post('http://localhost:4000/auth/register', () =>
        HttpResponse.json(
          { error: 'EMAIL_TAKEN', message: 'An account with this email already exists' },
          { status: 409 },
        )
      )
    )

    const { result } = renderHook(() => useAuth())

    await expect(
      act(async () => {
        await result.current.register('Test User', 'taken@example.com', 'password123')
      })
    ).rejects.toThrow()

    expect(result.current.isAuthenticated).toBe(false)
  })
})

// =============================================================================
// logout
// =============================================================================

describe('logout', () => {
  it('clears user and isAuthenticated after logout', async () => {
    // Start logged in
    useAuthStore.setState({
      user:            mockUser,
      accessToken:     mockAuthResponse.accessToken,
      isAuthenticated: true,
      isLoading:       false,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })
})

// =============================================================================
// initialize
// =============================================================================

describe('initialize', () => {
  it('restores user session from HttpOnly cookie on app load', async () => {
    // Return the same token the default /auth/me handler accepts
    server.use(
      http.post('http://localhost:4000/auth/refresh', () =>
        HttpResponse.json({ accessToken: 'mock-access-token', expiresIn: 900 })
      )
    )

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.initialize()
    })

    expect(result.current.user?.email).toBe(mockUser.email)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('calls clearAuth and does not throw when refresh token is missing or expired', async () => {
    server.use(
      http.post('http://localhost:4000/auth/refresh', () =>
        HttpResponse.json(
          { error: 'REFRESH_TOKEN_EXPIRED', message: 'Session expired' },
          { status: 401 },
        )
      )
    )

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.initialize()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })
})
