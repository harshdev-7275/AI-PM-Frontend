import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { OrgMember } from '@/types'
import { useOrgMembers, orgMembersKeys } from './useOrgMembers'

vi.mock('@/services/api', () => ({ getOrgMembers: vi.fn() }))
import { getOrgMembers } from '@/services/api'

function makeWrapper() {
  // retry: false so a rejected query settles immediately in tests.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

const MEMBER: OrgMember = {
  id: 'm1', userId: 'u1', name: 'Ada', email: 'ada@acme.com',
  avatarUrl: null, role: 'owner', joinedAt: '2026-01-01T00:00:00Z',
}

beforeEach(() => { vi.clearAllMocks() })

describe('orgMembersKeys', () => {
  it('builds a stable, slug-scoped key', () => {
    expect(orgMembersKeys.list('acme')).toEqual(['org-members', 'acme'])
    expect(orgMembersKeys.all).toEqual(['org-members'])
  })
})

describe('useOrgMembers', () => {
  it('fetches members for the org slug', async () => {
    vi.mocked(getOrgMembers).mockResolvedValueOnce([MEMBER])

    const { result } = renderHook(() => useOrgMembers('acme'), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([MEMBER])
    expect(getOrgMembers).toHaveBeenCalledWith('acme')
  })

  it('surfaces the error state when the fetch fails', async () => {
    vi.mocked(getOrgMembers).mockRejectedValueOnce(new Error('boom'))

    const { result } = renderHook(() => useOrgMembers('acme'), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('does not fetch until a slug is provided', () => {
    const { result } = renderHook(() => useOrgMembers(''), { wrapper: makeWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(getOrgMembers).not.toHaveBeenCalled()
  })
})
