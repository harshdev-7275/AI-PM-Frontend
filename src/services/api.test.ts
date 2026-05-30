import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mocks/server'
import { mockUser, mockAuthResponse } from '../../test/mocks/handlers'
import { loginUser, registerUser, logoutUser, refreshToken, getMe } from './api'

describe('loginUser', () => {
  it('sends POST /auth/login and returns AuthResponse', async () => {
    const result = await loginUser('test@example.com', 'password123')

    expect(result.user.email).toBe(mockUser.email)
    expect(result.user.id).toBe(mockUser.id)
    expect(result.accessToken).toBe(mockAuthResponse.accessToken)
    expect(result.expiresIn).toBe(mockAuthResponse.expiresIn)
  })

  it('throws on invalid credentials (401)', async () => {
    server.use(
      http.post('http://localhost:4000/auth/login', () =>
        HttpResponse.json(
          { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          { status: 401 },
        )
      )
    )

    await expect(loginUser('bad@example.com', 'wrong')).rejects.toThrow()
  })
})

describe('registerUser', () => {
  it('sends POST /auth/register and returns AuthResponse', async () => {
    const result = await registerUser('Test User', 'test@example.com', 'password123', 'engineer')

    expect(result.user.name).toBe(mockUser.name)
    expect(result.accessToken).toBe(mockAuthResponse.accessToken)
  })

  it('sends POST /auth/register without optional jobTitle', async () => {
    const result = await registerUser('Test User', 'test@example.com', 'password123')

    expect(result.user.email).toBe(mockUser.email)
  })

  it('throws when email is already taken (409)', async () => {
    server.use(
      http.post('http://localhost:4000/auth/register', () =>
        HttpResponse.json(
          { error: 'EMAIL_TAKEN', message: 'An account with this email already exists' },
          { status: 409 },
        )
      )
    )

    await expect(
      registerUser('Test User', 'taken@example.com', 'password123')
    ).rejects.toThrow()
  })
})

describe('logoutUser', () => {
  it('sends POST /auth/logout and returns success message', async () => {
    const result = await logoutUser()

    expect(result.message).toBe('Logged out successfully')
  })
})

describe('refreshToken', () => {
  it('sends POST /auth/refresh and returns new accessToken', async () => {
    const result = await refreshToken()

    expect(result.accessToken).toBe('new-access-token')
    expect(result.expiresIn).toBe(900)
  })

  it('throws when refresh token is expired or missing (401)', async () => {
    server.use(
      http.post('http://localhost:4000/auth/refresh', () =>
        HttpResponse.json(
          { error: 'REFRESH_TOKEN_EXPIRED', message: 'Session expired — please login again' },
          { status: 401 },
        )
      )
    )

    await expect(refreshToken()).rejects.toThrow()
  })
})

describe('getMe', () => {
  it('sends GET /auth/me with Bearer token and returns User', async () => {
    const result = await getMe('mock-access-token')

    expect(result.id).toBe(mockUser.id)
    expect(result.email).toBe(mockUser.email)
    expect(result.timezone).toBe(mockUser.timezone)
    expect(result.createdAt).toBe(mockUser.createdAt)
  })

  it('throws when token is invalid (401)', async () => {
    await expect(getMe('invalid-token')).rejects.toThrow()
  })
})
