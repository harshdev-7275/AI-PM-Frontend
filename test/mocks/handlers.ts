import { http, HttpResponse } from 'msw'

export const mockUser = {
  id:        '123e4567-e89b-12d3-a456-426614174000',
  name:      'Test User',
  email:     'test@example.com',
  avatarUrl: null,
  jobTitle:  'engineer',
  timezone:  'UTC',
  createdAt: '2026-01-01T00:00:00.000Z',
}

export const mockAuthResponse = {
  user:        mockUser,
  accessToken: 'mock-access-token',
  expiresIn:   900,
}

export const handlers = [
  http.post('http://localhost:4000/auth/login', () =>
    HttpResponse.json(mockAuthResponse)
  ),

  http.post('http://localhost:4000/auth/register', () =>
    HttpResponse.json(mockAuthResponse, { status: 201 })
  ),

  http.post('http://localhost:4000/auth/logout', () =>
    HttpResponse.json({ message: 'Logged out successfully' })
  ),

  http.post('http://localhost:4000/auth/refresh', () =>
    HttpResponse.json({ accessToken: 'new-access-token', expiresIn: 900 })
  ),

  http.get('http://localhost:4000/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (auth !== 'Bearer mock-access-token') {
      return HttpResponse.json(
        { error: 'UNAUTHORIZED', message: 'Invalid token' },
        { status: 401 },
      )
    }
    return HttpResponse.json(mockUser)
  }),
]
