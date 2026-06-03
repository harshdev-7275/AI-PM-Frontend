import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mocks/server'
import { useProjectMembers } from './useProjectMembers'

const SLUG = 'test-org'
const PROJECT_ID = 'cccccccc-0000-4000-8000-000000000001'
const base = `http://localhost:4000/orgs/${SLUG}/projects/${PROJECT_ID}/members`

const mockProjectMember = {
  id:        'aaaaaaaa-0000-4000-8000-000000000001',
  userId:    'bbbbbbbb-0000-4000-8000-000000000001',
  name:      'Pat Member',
  email:     'pat@example.com',
  avatarUrl: null as string | null,
  role:      'member' as const,
  addedAt:   '2026-01-01T00:00:00.000Z',
}

describe('useProjectMembers.load', () => {
  it('populates members from the API', async () => {
    server.use(http.get(base, () => HttpResponse.json([mockProjectMember])))

    const { result } = renderHook(() => useProjectMembers(SLUG, PROJECT_ID))
    await act(async () => { await result.current.load() })

    expect(result.current.members).toHaveLength(1)
    expect(result.current.members[0]?.userId).toBe(mockProjectMember.userId)
    expect(result.current.isLoading).toBe(false)
  })

  it('sets error when the API fails', async () => {
    server.use(http.get(base, () =>
      HttpResponse.json({ error: 'FORBIDDEN', message: 'No access' }, { status: 403 })))

    const { result } = renderHook(() => useProjectMembers(SLUG, PROJECT_ID))
    await act(async () => { await result.current.load() })

    expect(result.current.error).not.toBeNull()
    expect(result.current.isLoading).toBe(false)
  })
})

describe('useProjectMembers.add', () => {
  it('appends the new member and returns true on success', async () => {
    server.use(http.post(base, () => HttpResponse.json(mockProjectMember, { status: 201 })))

    const { result } = renderHook(() => useProjectMembers(SLUG, PROJECT_ID))
    let ok = false
    await act(async () => { ok = await result.current.add(mockProjectMember.userId, 'member') })

    expect(ok).toBe(true)
    expect(result.current.members).toHaveLength(1)
    expect(result.current.isAdding).toBe(false)
  })

  it('returns false and sets error on failure', async () => {
    server.use(http.post(base, () =>
      HttpResponse.json({ error: 'ALREADY_PROJECT_MEMBER', message: 'Already a member' }, { status: 409 })))

    const { result } = renderHook(() => useProjectMembers(SLUG, PROJECT_ID))
    let ok = true
    await act(async () => { ok = await result.current.add('someone', 'member') })

    expect(ok).toBe(false)
    expect(result.current.error).not.toBeNull()
  })
})

describe('useProjectMembers.updateRole and remove', () => {
  it('updates a role in place without a refetch', async () => {
    server.use(
      http.get(base, () => HttpResponse.json([mockProjectMember])),
      http.patch(`${base}/:userId`, () => HttpResponse.json({ message: 'updated' })),
    )

    const { result } = renderHook(() => useProjectMembers(SLUG, PROJECT_ID))
    await act(async () => { await result.current.load() })
    await act(async () => { await result.current.updateRole(mockProjectMember.userId, 'lead') })

    expect(result.current.members.find((m) => m.userId === mockProjectMember.userId)?.role).toBe('lead')
  })

  it('removes a member in place', async () => {
    server.use(
      http.get(base, () => HttpResponse.json([mockProjectMember])),
      http.delete(`${base}/:userId`, () => HttpResponse.json({ message: 'removed' })),
    )

    const { result } = renderHook(() => useProjectMembers(SLUG, PROJECT_ID))
    await act(async () => { await result.current.load() })
    expect(result.current.members).toHaveLength(1)

    await act(async () => { await result.current.remove(mockProjectMember.userId) })
    expect(result.current.members).toHaveLength(0)
  })
})
