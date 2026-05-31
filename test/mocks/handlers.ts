import { http, HttpResponse } from 'msw'

export const mockOrgMember = {
  id:        'aaaaaaaa-0000-4000-8000-000000000001',
  userId:    '123e4567-e89b-12d3-a456-426614174000',
  name:      'Test User',
  email:     'test@example.com',
  avatarUrl: null as string | null,
  role:      'member' as const,
  joinedAt:  '2026-01-01T00:00:00.000Z',
}

export const mockInvitation = {
  token:     'invite-token-abc123',
  email:     'newmember@example.com',
  expiresAt: '2026-06-07T00:00:00.000Z',
}

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

export const mockOrg = {
  id:        '456e7890-e89b-12d3-a456-426614174000',
  name:      'Test Org',
  slug:      'test-org',
  logoUrl:   null,
  plan:      'starter',
  isActive:  true,
  createdAt: '2026-01-01T00:00:00.000Z',
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

  http.post('http://localhost:4000/orgs', () =>
    HttpResponse.json(mockOrg, { status: 201 })
  ),

  http.get('http://localhost:4000/orgs/me', () =>
    HttpResponse.json([mockOrg])
  ),

  // Members
  http.get('http://localhost:4000/orgs/:slug/members', () =>
    HttpResponse.json([mockOrgMember])
  ),

  http.post('http://localhost:4000/orgs/:slug/invite', () =>
    HttpResponse.json(mockInvitation, { status: 201 })
  ),

  http.patch('http://localhost:4000/orgs/:slug/members/:userId', () =>
    HttpResponse.json({ ...mockOrgMember, role: 'admin' })
  ),

  http.delete('http://localhost:4000/orgs/:slug/members/:userId', () =>
    new HttpResponse(null, { status: 204 })
  ),

  http.post('http://localhost:4000/orgs/invite/accept', () =>
    HttpResponse.json(mockOrg)
  ),
]
