import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mocks/server'
import {
  mockUser, mockAuthResponse, mockOrg,
  mockOrgMember, mockInvitation, mockWorkflowStatus, mockProjectMember,
} from '../../test/mocks/handlers'
import { useAuthStore } from '@/store/useAuthStore'
import {
  loginUser, registerUser, logoutUser, refreshToken, getMe,
  inviteMember, getOrgMembers, updateMemberRole, removeMember, acceptInvitation,
  getWorkflowStatuses, createStatus, updateStatus, deleteStatus, StatusHasIssuesError,
  getProjectMembers, sendChatMessage,
} from './api'

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

// =============================================================================
// MEMBERS
// =============================================================================

describe('getOrgMembers', () => {
  it('sends GET /orgs/:slug/members and returns OrgMember array', async () => {
    const result = await getOrgMembers('test-org')

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe(mockOrgMember.id)
    expect(result[0]?.email).toBe(mockOrgMember.email)
    expect(result[0]?.role).toBe(mockOrgMember.role)
    expect(result[0]?.joinedAt).toBe(mockOrgMember.joinedAt)
  })

  it('throws when org is not found (404)', async () => {
    server.use(
      http.get('http://localhost:4000/orgs/:slug/members', () =>
        HttpResponse.json({ error: 'NOT_FOUND', message: 'Org not found' }, { status: 404 })
      )
    )

    await expect(getOrgMembers('no-such-org')).rejects.toThrow()
  })
})

describe('inviteMember', () => {
  it('sends POST /orgs/:slug/invite with email and role, returns invitation', async () => {
    const result = await inviteMember('test-org', 'newmember@example.com', 'member')

    expect(result.token).toBe(mockInvitation.token)
    expect(result.email).toBe(mockInvitation.email)
    expect(result.expiresAt).toBe(mockInvitation.expiresAt)
  })

  it('uses role "member" as the default', async () => {
    let sentBody: unknown
    server.use(
      http.post('http://localhost:4000/orgs/:slug/invite', async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json(mockInvitation, { status: 201 })
      })
    )

    await inviteMember('test-org', 'newmember@example.com')

    expect((sentBody as { role: string }).role).toBe('member')
  })

  it('throws when the email is already a member (409)', async () => {
    server.use(
      http.post('http://localhost:4000/orgs/:slug/invite', () =>
        HttpResponse.json({ error: 'ALREADY_MEMBER', message: 'Already a member' }, { status: 409 })
      )
    )

    await expect(inviteMember('test-org', 'existing@example.com')).rejects.toThrow()
  })
})

describe('updateMemberRole', () => {
  it('sends PATCH /orgs/:slug/members/:userId with role and returns updated member', async () => {
    const result = await updateMemberRole('test-org', mockOrgMember.userId, 'admin')

    expect(result.userId).toBe(mockOrgMember.userId)
    expect(result.role).toBe('admin')
  })

  it('sends the correct role in the request body', async () => {
    let sentBody: unknown
    server.use(
      http.patch('http://localhost:4000/orgs/:slug/members/:userId', async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json({ ...mockOrgMember, role: 'admin' })
      })
    )

    await updateMemberRole('test-org', mockOrgMember.userId, 'admin')

    expect((sentBody as { role: string }).role).toBe('admin')
  })
})

describe('removeMember', () => {
  it('sends DELETE /orgs/:slug/members/:userId and resolves to undefined', async () => {
    const result = await removeMember('test-org', mockOrgMember.userId)

    expect(result).toBeUndefined()
  })

  it('throws when the member is not found (404)', async () => {
    server.use(
      http.delete('http://localhost:4000/orgs/:slug/members/:userId', () =>
        HttpResponse.json({ error: 'NOT_FOUND', message: 'Member not found' }, { status: 404 })
      )
    )

    await expect(removeMember('test-org', 'no-such-user')).rejects.toThrow()
  })
})

describe('acceptInvitation', () => {
  it('sends POST /orgs/invite/accept with token in body', async () => {
    let sentBody: unknown
    server.use(
      http.post('http://localhost:4000/orgs/invite/accept', async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json(mockOrg)
      })
    )

    await acceptInvitation('invite-token-abc123')

    expect((sentBody as { token: string }).token).toBe('invite-token-abc123')
  })

  it('sends without an Authorization header when no user is logged in', async () => {
    useAuthStore.setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false })

    let authHeader: string | null = null
    server.use(
      http.post('http://localhost:4000/orgs/invite/accept', ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json(mockOrg)
      })
    )

    await acceptInvitation('invite-token-abc123')

    expect(authHeader).toBeNull()
  })

  it('sends with Authorization header when user is logged in', async () => {
    useAuthStore.setState({
      user:            mockUser,
      accessToken:     'mock-access-token',
      isLoading:       false,
      isAuthenticated: true,
    })

    let authHeader: string | null = null
    server.use(
      http.post('http://localhost:4000/orgs/invite/accept', ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json(mockOrg)
      })
    )

    await acceptInvitation('invite-token-abc123')

    expect(authHeader).toBe('Bearer mock-access-token')
  })

  it('throws on invalid or expired token (400)', async () => {
    server.use(
      http.post('http://localhost:4000/orgs/invite/accept', () =>
        HttpResponse.json({ error: 'INVALID_TOKEN', message: 'Invite token is invalid or expired' }, { status: 400 })
      )
    )

    await expect(acceptInvitation('bad-token')).rejects.toThrow()
  })
})

// =============================================================================
// TOKEN REFRESH INTERCEPTOR
// =============================================================================

describe('Token refresh interceptor', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user:            mockUser,
      accessToken:     'expired-token',
      isLoading:       false,
      isAuthenticated: true,
    })
  })

  it('retries the original request with the new token after a 401', async () => {
    let callCount = 0
    server.use(
      http.post('http://localhost:4000/auth/refresh', () =>
        HttpResponse.json({ accessToken: 'mock-access-token', expiresIn: 900 })
      ),
      http.get('http://localhost:4000/auth/me', ({ request }) => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
        }
        const auth = request.headers.get('Authorization')
        return auth === 'Bearer mock-access-token'
          ? HttpResponse.json(mockUser)
          : HttpResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
      })
    )

    const result = await getMe('expired-token')
    expect(result.email).toBe(mockUser.email)
    expect(callCount).toBe(2)
  })

  it('updates the access token in the store after a successful refresh', async () => {
    let callCount = 0
    server.use(
      http.post('http://localhost:4000/auth/refresh', () =>
        HttpResponse.json({ accessToken: 'mock-access-token', expiresIn: 900 })
      ),
      http.get('http://localhost:4000/auth/me', () => {
        callCount++
        if (callCount === 1) return HttpResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
        return HttpResponse.json(mockUser)
      })
    )

    await getMe('expired-token')
    expect(useAuthStore.getState().accessToken).toBe('mock-access-token')
  })

  it('clears auth and redirects to /login when refresh fails', async () => {
    server.use(
      http.post('http://localhost:4000/auth/refresh', () =>
        HttpResponse.json({ error: 'REFRESH_TOKEN_EXPIRED' }, { status: 401 })
      ),
      http.get('http://localhost:4000/auth/me', () =>
        HttpResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
      )
    )

    await expect(getMe('expired-token')).rejects.toThrow()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('does not retry the refresh endpoint to prevent infinite loops', async () => {
    server.use(
      http.post('http://localhost:4000/auth/refresh', () =>
        HttpResponse.json({ error: 'NO_REFRESH_TOKEN' }, { status: 401 })
      )
    )

    await expect(refreshToken()).rejects.toThrow()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('passes non-401 errors through without triggering a refresh', async () => {
    let refreshCalled = false
    server.use(
      http.get('http://localhost:4000/auth/me', () =>
        HttpResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
      ),
      http.post('http://localhost:4000/auth/refresh', () => {
        refreshCalled = true
        return HttpResponse.json({ accessToken: 'token', expiresIn: 900 })
      })
    )

    await expect(getMe('any-token')).rejects.toThrow()
    expect(refreshCalled).toBe(false)
  })
})

// =============================================================================
// WORKFLOW STATUSES
// =============================================================================

const SLUG       = 'test-org'
const PROJECT_ID = 'cccccccc-0000-4000-8000-000000000001'
const STATUS_ID  = 'bbbbbbbb-0000-4000-8000-000000000001'

describe('getWorkflowStatuses', () => {
  it('sends GET /orgs/:slug/projects/:projectId/statuses and returns WorkflowStatus[]', async () => {
    const result = await getWorkflowStatuses(SLUG, PROJECT_ID)

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe(mockWorkflowStatus.id)
    expect(result[0]?.name).toBe(mockWorkflowStatus.name)
    expect(result[0]?.color).toBe(mockWorkflowStatus.color)
    expect(result[0]?.position).toBe(mockWorkflowStatus.position)
    expect(result[0]?.isDefault).toBe(mockWorkflowStatus.isDefault)
    expect(result[0]?.projectId).toBe(mockWorkflowStatus.projectId)
  })

  it('throws when org not found (404)', async () => {
    server.use(
      http.get('http://localhost:4000/orgs/:slug/projects/:projectId/statuses', () =>
        HttpResponse.json({ error: 'ORG_NOT_FOUND' }, { status: 404 })
      )
    )
    await expect(getWorkflowStatuses('no-org', PROJECT_ID)).rejects.toThrow()
  })
})

describe('createStatus', () => {
  it('sends POST with name and color and returns the created WorkflowStatus', async () => {
    const result = await createStatus(SLUG, PROJECT_ID, 'QA Testing', '#8b5cf6')

    expect(result.name).toBe('QA Testing')
    expect(result.color).toBe('#8b5cf6')
    expect(result.position).toBe(6)
    expect(result.isDefault).toBe(false)
  })

  it('throws on 400 validation error (bad color)', async () => {
    server.use(
      http.post('http://localhost:4000/orgs/:slug/projects/:projectId/statuses', () =>
        HttpResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
      )
    )
    await expect(createStatus(SLUG, PROJECT_ID, 'Bad', 'notacolor')).rejects.toThrow()
  })

  it('throws on 403 forbidden (not a workflow manager)', async () => {
    server.use(
      http.post('http://localhost:4000/orgs/:slug/projects/:projectId/statuses', () =>
        HttpResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      )
    )
    await expect(createStatus(SLUG, PROJECT_ID, 'Hack', '#000000')).rejects.toThrow()
  })
})

describe('updateStatus', () => {
  it('sends PATCH with name and returns updated WorkflowStatus', async () => {
    const result = await updateStatus(SLUG, PROJECT_ID, STATUS_ID, { name: 'In Development' })

    expect(result.name).toBe('In Development')
    expect(result.id).toBe(mockWorkflowStatus.id)
  })

  it('sends PATCH with color and returns updated WorkflowStatus', async () => {
    server.use(
      http.patch('http://localhost:4000/orgs/:slug/projects/:projectId/statuses/:statusId', () =>
        HttpResponse.json({ ...mockWorkflowStatus, color: '#0ea5e9' })
      )
    )
    const result = await updateStatus(SLUG, PROJECT_ID, STATUS_ID, { color: '#0ea5e9' })
    expect(result.color).toBe('#0ea5e9')
  })

  it('sends PATCH with position and returns updated WorkflowStatus', async () => {
    server.use(
      http.patch('http://localhost:4000/orgs/:slug/projects/:projectId/statuses/:statusId', () =>
        HttpResponse.json({ ...mockWorkflowStatus, position: 2 })
      )
    )
    const result = await updateStatus(SLUG, PROJECT_ID, STATUS_ID, { position: 2 })
    expect(result.position).toBe(2)
  })

  it('throws on 404 when status does not exist', async () => {
    server.use(
      http.patch('http://localhost:4000/orgs/:slug/projects/:projectId/statuses/:statusId', () =>
        HttpResponse.json({ error: 'STATUS_NOT_FOUND' }, { status: 404 })
      )
    )
    await expect(updateStatus(SLUG, PROJECT_ID, 'no-such-id', { name: 'Ghost' })).rejects.toThrow()
  })
})

describe('deleteStatus', () => {
  it('sends DELETE and resolves to undefined on success', async () => {
    const result = await deleteStatus(SLUG, PROJECT_ID, STATUS_ID)
    expect(result).toBeUndefined()
  })

  it('throws StatusHasIssuesError with issueCount when status has issues (409)', async () => {
    server.use(
      http.delete('http://localhost:4000/orgs/:slug/projects/:projectId/statuses/:statusId', () =>
        HttpResponse.json(
          { error: 'STATUS_HAS_ISSUES', message: 'Move issues first', issueCount: 3 },
          { status: 409 },
        )
      )
    )

    try {
      await deleteStatus(SLUG, PROJECT_ID, STATUS_ID)
      expect.fail('should have thrown StatusHasIssuesError')
    } catch (err) {
      expect(err).toBeInstanceOf(StatusHasIssuesError)
      expect((err as StatusHasIssuesError).issueCount).toBe(3)
    }
  })

  it('throws a regular error when it is the last status (400)', async () => {
    server.use(
      http.delete('http://localhost:4000/orgs/:slug/projects/:projectId/statuses/:statusId', () =>
        HttpResponse.json({ error: 'LAST_STATUS' }, { status: 400 })
      )
    )
    await expect(deleteStatus(SLUG, PROJECT_ID, STATUS_ID)).rejects.toThrow()
  })

  it('throws on 404 when status does not exist', async () => {
    server.use(
      http.delete('http://localhost:4000/orgs/:slug/projects/:projectId/statuses/:statusId', () =>
        HttpResponse.json({ error: 'STATUS_NOT_FOUND' }, { status: 404 })
      )
    )
    await expect(deleteStatus(SLUG, PROJECT_ID, 'no-such-id')).rejects.toThrow()
  })
})

describe('getProjectMembers', () => {
  it('GETs /orgs/:slug/projects/:projectId/members and returns ProjectMember[]', async () => {
    const result = await getProjectMembers('test-org', 'cccccccc-0000-4000-8000-000000000001')

    expect(result).toHaveLength(1)
    expect(result[0]?.userId).toBe(mockProjectMember.userId)
    expect(result[0]?.name).toBe(mockProjectMember.name)
    expect(result[0]?.avatarUrl).toBe(mockProjectMember.avatarUrl)
    expect(result[0]?.role).toBe(mockProjectMember.role)
  })
})

describe('sendChatMessage', () => {
  it('parses a validation_failed response (pre-flight entity check)', async () => {
    // The AI service returns this when the user mentions an entity (assignee,
    // sprint, issue number) that doesn't exist. The frontend MUST surface it
    // — silent failure here is a regression (the user sees nothing).
    server.use(
      http.post('http://localhost:4000/api/chat', () =>
        HttpResponse.json({
          intent: 'CREATE_ISSUE',
          result: { message: "No team member named 'Alice' found in this project." },
          status: 'validation_failed',
          error:  null,
        })
      )
    )
    const res = await sendChatMessage(
      'create a bug, assign to Alice',
      'user-id',
      'test-org',
      'cccccccc-0000-4000-8000-000000000001',
    )
    expect(res.status).toBe('validation_failed')
    expect(res.result?.message).toMatch(/No team member named 'Alice'/)
    expect(res.intent).toBe('CREATE_ISSUE')
  })

  it('parses an awaiting_confirmation response', async () => {
    server.use(
      http.post('http://localhost:4000/api/chat', () =>
        HttpResponse.json({
          intent: 'CREATE_ISSUE',
          result: { message: "I'll create a bug titled 'x' with medium priority. Reply 'yes' to confirm or 'no' to cancel." },
          status: 'awaiting_confirmation',
          error:  null,
        })
      )
    )
    const res = await sendChatMessage('create a bug called x', 'user-id', 'test-org', 'cccccccc-0000-4000-8000-000000000001')
    expect(res.status).toBe('awaiting_confirmation')
  })

  it('parses a quota_exceeded response', async () => {
    server.use(
      http.post('http://localhost:4000/api/chat', () =>
        HttpResponse.json({
          intent: null,
          result: { message: 'This workspace has reached its AI usage limit.' },
          status: 'quota_exceeded',
          error:  null,
        })
      )
    )
    const res = await sendChatMessage('hi', 'user-id', 'test-org', 'cccccccc-0000-4000-8000-000000000001')
    expect(res.status).toBe('quota_exceeded')
  })
})
