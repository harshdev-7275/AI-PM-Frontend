import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mocks/server'
import { mockOrgMember, mockInvitation } from '../../test/mocks/handlers'
import { useMembers } from './useMembers'

beforeEach(() => {
  // Each test starts with a clean slate
})

// =============================================================================
// loadMembers
// =============================================================================

describe('loadMembers', () => {
  it('populates members from the API response', async () => {
    const { result } = renderHook(() => useMembers('test-org'))

    await act(async () => {
      await result.current.loadMembers('test-org')
    })

    expect(result.current.members).toHaveLength(1)
    expect(result.current.members[0]?.id).toBe(mockOrgMember.id)
    expect(result.current.members[0]?.email).toBe(mockOrgMember.email)
  })

  it('isLoading is false after a successful load', async () => {
    const { result } = renderHook(() => useMembers('test-org'))

    await act(async () => {
      await result.current.loadMembers('test-org')
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('sets error and clears isLoading when the API fails', async () => {
    server.use(
      http.get('http://localhost:4000/orgs/:slug/members', () =>
        HttpResponse.json({ error: 'NOT_FOUND', message: 'Org not found' }, { status: 404 })
      )
    )

    const { result } = renderHook(() => useMembers('test-org'))

    await act(async () => {
      await result.current.loadMembers('test-org')
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.isLoading).toBe(false)
  })
})

// =============================================================================
// handleInvite
// =============================================================================

describe('handleInvite', () => {
  it('sets error to "Email is required" when email is empty (no API call)', async () => {
    let apiCalled = false
    server.use(
      http.post('http://localhost:4000/orgs/:slug/invite', () => {
        apiCalled = true
        return HttpResponse.json(mockInvitation, { status: 201 })
      })
    )

    const { result } = renderHook(() => useMembers('test-org'))

    await act(async () => {
      await result.current.handleInvite('')
    })

    expect(result.current.error).toBe('Email is required')
    expect(apiCalled).toBe(false)
  })

  it('returns the invitation on success and clears error', async () => {
    const { result } = renderHook(() => useMembers('test-org'))

    let invitation: Awaited<ReturnType<typeof result.current.handleInvite>>

    await act(async () => {
      invitation = await result.current.handleInvite('newmember@example.com')
    })

    expect(invitation!.token).toBe(mockInvitation.token)
    expect(invitation!.email).toBe(mockInvitation.email)
    expect(result.current.error).toBeNull()
  })

  it('defaults role to "member" when not provided', async () => {
    let sentRole: string | undefined
    server.use(
      http.post('http://localhost:4000/orgs/:slug/invite', async ({ request }) => {
        const body = await request.json() as { role: string }
        sentRole = body.role
        return HttpResponse.json(mockInvitation, { status: 201 })
      })
    )

    const { result } = renderHook(() => useMembers('test-org'))

    await act(async () => {
      await result.current.handleInvite('newmember@example.com')
    })

    expect(sentRole).toBe('member')
  })

  it('sets isInviting to false after the call resolves', async () => {
    const { result } = renderHook(() => useMembers('test-org'))

    await act(async () => {
      await result.current.handleInvite('newmember@example.com')
    })

    expect(result.current.isInviting).toBe(false)
  })

  it('sets error to "This person is already a member" on ALREADY_MEMBER', async () => {
    server.use(
      http.post('http://localhost:4000/orgs/:slug/invite', () =>
        HttpResponse.json({ error: 'ALREADY_MEMBER', message: 'Already a member' }, { status: 409 })
      )
    )

    const { result } = renderHook(() => useMembers('test-org'))

    await act(async () => {
      await result.current.handleInvite('existing@example.com')
    })

    expect(result.current.error).toBe('This person is already a member')
  })

  it('sets error to "This person is already a member" on EMAIL_TAKEN', async () => {
    server.use(
      http.post('http://localhost:4000/orgs/:slug/invite', () =>
        HttpResponse.json({ error: 'EMAIL_TAKEN', message: 'Email taken' }, { status: 409 })
      )
    )

    const { result } = renderHook(() => useMembers('test-org'))

    await act(async () => {
      await result.current.handleInvite('existing@example.com')
    })

    expect(result.current.error).toBe('This person is already a member')
  })

  it('sets error from the API message for other errors', async () => {
    server.use(
      http.post('http://localhost:4000/orgs/:slug/invite', () =>
        HttpResponse.json({ error: 'FORBIDDEN', message: 'Only admins can invite members' }, { status: 403 })
      )
    )

    const { result } = renderHook(() => useMembers('test-org'))

    await act(async () => {
      await result.current.handleInvite('someone@example.com')
    })

    expect(result.current.error).toBe('Only admins can invite members')
  })
})

// =============================================================================
// handleUpdateRole
// =============================================================================

describe('handleUpdateRole', () => {
  it('updates the member role in the members array without a refetch', async () => {
    let getMembersCalls = 0
    server.use(
      http.get('http://localhost:4000/orgs/:slug/members', () => {
        getMembersCalls++
        return HttpResponse.json([mockOrgMember])
      })
    )

    const { result } = renderHook(() => useMembers('test-org'))

    // Seed the members list
    await act(async () => { await result.current.loadMembers('test-org') })
    const callsAfterLoad = getMembersCalls

    await act(async () => {
      await result.current.handleUpdateRole('test-org', mockOrgMember.userId, 'admin')
    })

    const updated = result.current.members.find((m) => m.userId === mockOrgMember.userId)
    expect(updated?.role).toBe('admin')
    expect(getMembersCalls).toBe(callsAfterLoad) // no extra fetch
  })
})

// =============================================================================
// handleRemoveMember
// =============================================================================

describe('handleRemoveMember', () => {
  it('removes the member from the members array without a refetch', async () => {
    let getMembersCalls = 0
    server.use(
      http.get('http://localhost:4000/orgs/:slug/members', () => {
        getMembersCalls++
        return HttpResponse.json([mockOrgMember])
      })
    )

    const { result } = renderHook(() => useMembers('test-org'))

    await act(async () => { await result.current.loadMembers('test-org') })
    expect(result.current.members).toHaveLength(1)
    const callsAfterLoad = getMembersCalls

    await act(async () => {
      await result.current.handleRemoveMember('test-org', mockOrgMember.userId)
    })

    expect(result.current.members).toHaveLength(0)
    expect(getMembersCalls).toBe(callsAfterLoad) // no extra fetch
  })
})
