import { useState, useCallback } from 'react'
import {
  getSprints,
  getIssues,
  getIssueStatuses,
  createIssue,
  createSprint,
  startSprint,
  completeSprint,
  addIssueToSprint,
  removeIssueFromSprint,
} from '@/services/api'
import type { Sprint, Issue, IssueStatus, CreateIssueInput } from '@/types'

interface BacklogState {
  sprints:          Sprint[]
  issues:           Issue[]
  statuses:         IssueStatus[]
  isLoading:        boolean
  isCreatingSprint: boolean
}

export function useBacklog(slug: string, projectId: string) {
  const [state, setState] = useState<BacklogState>({
    sprints:          [],
    issues:           [],
    statuses:         [],
    isLoading:        false,
    isCreatingSprint: false,
  })

  const loadBacklog = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }))
    try {
      const [fetchedSprints, fetchedIssues, fetchedStatuses] = await Promise.all([
        getSprints(slug, projectId),
        getIssues(slug, projectId),
        getIssueStatuses(slug, projectId),
      ])
      setState((s) => ({
        ...s,
        sprints:  fetchedSprints,
        issues:   fetchedIssues,
        statuses: fetchedStatuses,
      }))
    } finally {
      setState((s) => ({ ...s, isLoading: false }))
    }
  }, [slug, projectId])

  const handleCreateSprint = useCallback(async (
    name:       string,
    goal?:      string,
    startDate?: string,
    endDate?:   string,
  ): Promise<Sprint> => {
    setState((s) => ({ ...s, isCreatingSprint: true }))
    try {
      const sprint = await createSprint(slug, projectId, name, goal, startDate, endDate)
      setState((s) => ({ ...s, sprints: [...s.sprints, sprint] }))
      return sprint
    } finally {
      setState((s) => ({ ...s, isCreatingSprint: false }))
    }
  }, [slug, projectId])

  const handleCreateIssue = useCallback(async (input: CreateIssueInput): Promise<Issue> => {
    const issue = await createIssue(slug, projectId, input)
    setState((s) => ({ ...s, issues: [...s.issues, issue] }))
    return issue
  }, [slug, projectId])

  const handleStartSprint = useCallback(async (sprintId: string): Promise<void> => {
    await startSprint(slug, projectId, sprintId)
    setState((s) => ({
      ...s,
      sprints: s.sprints.map((sp) =>
        sp.id === sprintId ? { ...sp, status: 'active' as const } : sp
      ),
    }))
  }, [slug, projectId])

  const handleCompleteSprint = useCallback(async (sprintId: string): Promise<void> => {
    const { completedSprint, nextSprint } = await completeSprint(slug, projectId, sprintId)
    setState((s) => {
      const updatedSprints = s.sprints.map((sp) =>
        sp.id === sprintId ? { ...sp, ...completedSprint } : sp
      )
      return {
        ...s,
        sprints: nextSprint ? [...updatedSprints, nextSprint] : updatedSprints,
      }
    })
  }, [slug, projectId])

  // Patches sprintId on the issue — backlogIssues updates automatically.
  const handleAddIssueToSprint = useCallback(async (sprintId: string, issue: Issue): Promise<void> => {
    await addIssueToSprint(slug, projectId, sprintId, issue.id)
    setState((s) => ({
      ...s,
      issues: s.issues.map((i) =>
        i.id === issue.id ? { ...i, sprintId } : i
      ),
    }))
  }, [slug, projectId])

  // Patches sprintId to null — issue reappears in backlogIssues automatically.
  const handleRemoveIssueFromSprint = useCallback(async (sprintId: string, issueId: string): Promise<void> => {
    await removeIssueFromSprint(slug, projectId, sprintId, issueId)
    setState((s) => ({
      ...s,
      issues: s.issues.map((i) =>
        i.id === issueId ? { ...i, sprintId: null } : i
      ),
    }))
  }, [slug, projectId])

  const backlogIssues = state.issues.filter((i) => i.sprintId === null)

  return {
    sprints:          state.sprints,
    backlogIssues,
    statuses:         state.statuses,
    isLoading:        state.isLoading,
    isCreatingSprint: state.isCreatingSprint,
    allIssues:        state.issues,
    loadBacklog,
    handleCreateSprint,
    handleCreateIssue,
    handleStartSprint,
    handleCompleteSprint,
    handleAddIssueToSprint,
    handleRemoveIssueFromSprint,
  }
}
