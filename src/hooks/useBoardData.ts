import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/useAuthStore'
import { useProjectStore } from '@/store/useProjectStore'
import {
  getIssueStatuses,
  getIssues,
  getSprints,
  getCategories,
  createIssue as createIssueApi,
  createCategory as createCategoryApi,
  updateIssue as updateIssueApi,
} from '@/services/api'
import { env } from '@/lib/env'
import type { Category, CreateIssueInput, Issue } from '@/types'

// =============================================================================
// DRAG UPDATE
// =============================================================================

/**
 * Builds the PATCH payload for a card dropped on a (category × status) cell.
 * Only fields that actually changed are included (the backend writes a history
 * row per submitted field). Returns null for a no-op drop.
 */
export function buildDragUpdate(
  issue:      Pick<Issue, 'statusId' | 'categoryId'>,
  statusId:   string,
  categoryId: string,
): { statusId?: string; categoryId?: string } | null {
  const update = {
    ...(statusId   !== issue.statusId   && { statusId }),
    ...(categoryId !== issue.categoryId && { categoryId }),
  }
  return Object.keys(update).length > 0 ? update : null
}

// =============================================================================
// SSE EVENT TYPES — must match backend issues.sse.ts
// =============================================================================

type BoardEvent =
  | { type: 'CONNECTED' }
  | { type: 'ISSUE_STATUS_UPDATED'; issueId: string; statusId: string; actorId: string; actorName: string }
  | { type: 'ISSUE_UPDATED'; issue: Issue; actorId: string; actorName: string }
  | { type: 'ISSUE_CREATED'; issue: Issue; actorId: string; actorName: string }

// =============================================================================
// QUERY KEYS
// =============================================================================

const boardKeys = {
  issues:     (slug: string, projectId: string) => ['board', slug, projectId, 'issues'] as const,
  statuses:   (slug: string, projectId: string) => ['board', slug, projectId, 'statuses'] as const,
  sprints:    (slug: string, projectId: string) => ['board', slug, projectId, 'sprints'] as const,
  categories: (slug: string, projectId: string) => ['board', slug, projectId, 'categories'] as const,
}

// =============================================================================
// HOOK
// =============================================================================

export function useBoardData() {
  const { slug, projectId } = useParams<{ slug: string; projectId: string }>()
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore((s) => s.user?.id)

  // Ensure currentProject is set even on direct URL load
  const projects          = useProjectStore((s) => s.projects)
  const currentProject    = useProjectStore((s) => s.currentProject)
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject)

  useEffect(() => {
    if (!projectId) return
    if (currentProject?.id === projectId) return
    const match = projects.find((p) => p.id === projectId)
    if (match) setCurrentProject(match)
  }, [projectId, projects, currentProject?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // SSE connection — invalidates React Query cache instead of mutating Zustand
  useEffect(() => {
    if (!slug || !projectId) return

    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken) return

    const url = `${env.VITE_API_BASE_URL}/orgs/${slug}/projects/${projectId}/issues/events?token=${encodeURIComponent(accessToken)}`
    const es = new EventSource(url)

    es.onmessage = (e: MessageEvent<string>) => {
      let event: BoardEvent
      try {
        event = JSON.parse(e.data) as BoardEvent
      } catch {
        return
      }

      if (event.type === 'CONNECTED') return

      const isMe = event.actorId === currentUserId
      const actor = isMe ? 'You' : event.actorName

      if (event.type === 'ISSUE_STATUS_UPDATED') {
        // Invalidate the issues query so React Query refetches fresh data
        if (!isMe) {
          void queryClient.invalidateQueries({ queryKey: boardKeys.issues(slug, projectId) })
        }

        const qk = boardKeys.statuses(slug, projectId)
        const statuses = queryClient.getQueryData<{ id: string; name: string }[]>(qk)
        const statusName = statuses?.find((s) => s.id === event.statusId)?.name ?? 'a new column'

        toast(`${actor} moved an issue → ${statusName}`, {
          duration: 3000,
          icon:     isMe ? '✓' : '👤',
        })
      }

      if (event.type === 'ISSUE_UPDATED') {
        // Covers board drags (status/category move) and field edits
        if (!isMe) {
          void queryClient.invalidateQueries({ queryKey: boardKeys.issues(slug, projectId) })
          toast(`${actor} updated "${event.issue.title}"`, { duration: 3000, icon: '👤' })
        }
      }

      if (event.type === 'ISSUE_CREATED') {
        if (!isMe) {
          void queryClient.invalidateQueries({ queryKey: boardKeys.issues(slug, projectId) })
        }
        toast(`${actor} created "${event.issue.title}"`, {
          duration: 3000,
          icon:     isMe ? '✓' : '👤',
        })
      }
    }

    return () => es.close()
  }, [slug, projectId, currentUserId, queryClient])  

  const issuesQuery = useQuery({
    queryKey: boardKeys.issues(slug ?? '', projectId ?? ''),
    queryFn:  () => getIssues(slug!, projectId!),
    enabled:  Boolean(slug) && Boolean(projectId),
  })

  const statusesQuery = useQuery({
    queryKey: boardKeys.statuses(slug ?? '', projectId ?? ''),
    queryFn:  () => getIssueStatuses(slug!, projectId!),
    enabled:  Boolean(slug) && Boolean(projectId),
  })

  const sprintsQuery = useQuery({
    queryKey: boardKeys.sprints(slug ?? '', projectId ?? ''),
    queryFn:  () => getSprints(slug!, projectId!),
    enabled:  Boolean(slug) && Boolean(projectId),
  })

  const categoriesQuery = useQuery({
    queryKey: boardKeys.categories(slug ?? '', projectId ?? ''),
    queryFn:  () => getCategories(slug!, projectId!),
    enabled:  Boolean(slug) && Boolean(projectId),
  })

  const dragMutation = useMutation({
    mutationFn: ({ issueId, update }: { issueId: string; update: { statusId?: string; categoryId?: string } }) =>
      updateIssueApi(slug!, projectId!, issueId, update),
    onMutate: async ({ issueId, update }) => {
      // Optimistic update — update the cached issues list immediately
      await queryClient.cancelQueries({ queryKey: boardKeys.issues(slug ?? '', projectId ?? '') })
      const previous = queryClient.getQueryData(boardKeys.issues(slug ?? '', projectId ?? ''))

      queryClient.setQueryData(boardKeys.issues(slug ?? '', projectId ?? ''), (old: Issue[] | undefined) =>
        old?.map((i) => (i.id === issueId ? { ...i, ...update } : i))
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      // Revert on failure
      if (context?.previous) {
        queryClient.setQueryData(boardKeys.issues(slug ?? '', projectId ?? ''), context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: boardKeys.issues(slug ?? '', projectId ?? '') })
    },
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateIssueInput) =>
      createIssueApi(slug!, projectId!, input),
    onSuccess: (issue) => {
      void queryClient.invalidateQueries({ queryKey: boardKeys.issues(slug ?? '', projectId ?? '') })
      return issue
    },
  })

  const createCategoryMutation = useMutation({
    mutationFn: ({ name, color, description }: { name: string; color: string; description?: string }) =>
      createCategoryApi(slug!, projectId!, name, color, description),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardKeys.categories(slug ?? '', projectId ?? '') })
    },
  })

  // Dropping on a (category × status) cell can change status, category, or
  // both. A category change also re-inherits that category's sprint (backend).
  const handleDragEnd = async (issueId: string, newStatusId: string, newCategoryId?: string): Promise<void> => {
    const issue = (issuesQuery.data ?? []).find((i) => i.id === issueId)
    if (!issue) return

    const update = buildDragUpdate(issue, newStatusId, newCategoryId ?? issue.categoryId)
    if (!update) return

    await dragMutation.mutateAsync({ issueId, update })
  }

  const handleCreateIssue = async (input: CreateIssueInput): Promise<Issue> => {
    return createMutation.mutateAsync(input)
  }

  const handleCreateCategory = async (name: string, color: string, description?: string): Promise<Category> => {
    return createCategoryMutation.mutateAsync({ name, color, ...(description !== undefined ? { description } : {}) })
  }

  return {
    issues:     issuesQuery.data ?? [],
    statuses:   statusesQuery.data ?? [],
    sprints:    sprintsQuery.data ?? [],
    categories: categoriesQuery.data ?? [] as Category[],
    isLoading:  issuesQuery.isLoading || statusesQuery.isLoading || sprintsQuery.isLoading,
    handleDragEnd,
    handleCreateIssue,
    handleCreateCategory,
  }
}
