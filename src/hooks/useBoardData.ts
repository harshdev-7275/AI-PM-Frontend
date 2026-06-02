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
  createIssue as createIssueApi,
  updateIssueStatus as updateIssueStatusApi,
} from '@/services/api'
import { env } from '@/lib/env'
import type { CreateIssueInput, Issue } from '@/types'

// =============================================================================
// SSE EVENT TYPES — must match backend issues.sse.ts
// =============================================================================

type BoardEvent =
  | { type: 'CONNECTED' }
  | { type: 'ISSUE_STATUS_UPDATED'; issueId: string; statusId: string; actorId: string; actorName: string }
  | { type: 'ISSUE_CREATED'; issue: Issue; actorId: string; actorName: string }

// =============================================================================
// QUERY KEYS
// =============================================================================

const boardKeys = {
  issues:   (slug: string, projectId: string) => ['board', slug, projectId, 'issues'] as const,
  statuses: (slug: string, projectId: string) => ['board', slug, projectId, 'statuses'] as const,
  sprints:  (slug: string, projectId: string) => ['board', slug, projectId, 'sprints'] as const,
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
  }, [slug, projectId, currentUserId, queryClient]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const dragMutation = useMutation({
    mutationFn: ({ issueId, statusId }: { issueId: string; statusId: string }) =>
      updateIssueStatusApi(slug!, projectId!, issueId, statusId),
    onMutate: async ({ issueId, statusId }) => {
      // Optimistic update — update the cached issues list immediately
      await queryClient.cancelQueries({ queryKey: boardKeys.issues(slug ?? '', projectId ?? '') })
      const previous = queryClient.getQueryData(boardKeys.issues(slug ?? '', projectId ?? ''))

      queryClient.setQueryData(boardKeys.issues(slug ?? '', projectId ?? ''), (old: Issue[] | undefined) =>
        old?.map((i) => (i.id === issueId ? { ...i, statusId } : i))
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

  const handleDragEnd = async (issueId: string, newStatusId: string): Promise<void> => {
    await dragMutation.mutateAsync({ issueId, statusId: newStatusId })
  }

  const handleCreateIssue = async (input: CreateIssueInput): Promise<Issue> => {
    return createMutation.mutateAsync(input)
  }

  return {
    issues:    issuesQuery.data ?? [],
    statuses:  statusesQuery.data ?? [],
    sprints:   sprintsQuery.data ?? [],
    isLoading: issuesQuery.isLoading || statusesQuery.isLoading || sprintsQuery.isLoading,
    handleDragEnd,
    handleCreateIssue,
  }
}
