import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { getOrgMembers } from '@/services/api'
import type { OrgMember } from '@/types'

// Reference React Query hook (FrontendRules §7 "Server/async state → TanStack
// Query"). Server state belongs here, not in a useState + useEffect hand-roll:
// React Query gives caching, dedup, background refetch and the three states for
// free. The remaining manual fetch hooks (see docs/frontend-migration.md) should
// follow this shape — a stable key factory + explicit staleTime, co-located in
// the feature's api/ folder.

export const orgMembersKeys = {
  all:  ['org-members'] as const,
  list: (slug: string) => ['org-members', slug] as const,
}

/**
 * Fetch the members of an org. Disabled until a slug is provided so it can be
 * called unconditionally (Rules of Hooks) before the slug resolves.
 */
export function useOrgMembers(slug: string): UseQueryResult<OrgMember[]> {
  return useQuery({
    queryKey: orgMembersKeys.list(slug),
    queryFn:  () => getOrgMembers(slug),
    staleTime: 1000 * 60 * 2, // 2 min — members change rarely within a session
    enabled:   Boolean(slug),
  })
}
