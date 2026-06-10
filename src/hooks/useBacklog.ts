import { useState, useCallback } from 'react'
import {
  getSprints,
  getIssues,
  getIssueStatuses,
  getCategories,
  createIssue,
  createCategory,
  updateCategory,
  deleteCategory,
  createSprint,
  startSprint,
  completeSprint,
  assignCategoryToSprint,
  unassignCategoryFromSprint,
} from '@/services/api'
import type { Sprint, Issue, IssueStatus, Category, CreateIssueInput } from '@/types'

interface BacklogState {
  sprints:          Sprint[]
  issues:           Issue[]
  statuses:         IssueStatus[]
  categories:       Category[]
  isLoading:        boolean
  isCreatingSprint: boolean
}

export function useBacklog(slug: string, projectId: string) {
  const [state, setState] = useState<BacklogState>({
    sprints:          [],
    issues:           [],
    statuses:         [],
    categories:       [],
    isLoading:        false,
    isCreatingSprint: false,
  })

  const loadBacklog = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }))
    try {
      const [fetchedSprints, fetchedIssues, fetchedStatuses, fetchedCategories] = await Promise.all([
        getSprints(slug, projectId),
        getIssues(slug, projectId),
        getIssueStatuses(slug, projectId),
        getCategories(slug, projectId),
      ])
      setState((s) => ({
        ...s,
        sprints:    fetchedSprints,
        issues:     fetchedIssues,
        statuses:   fetchedStatuses,
        categories: fetchedCategories,
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

  const handleCreateCategory = useCallback(async (
    name:         string,
    color:        string,
    description?: string,
  ): Promise<Category> => {
    const category = await createCategory(slug, projectId, name, color, description)
    setState((s) => ({ ...s, categories: [...s.categories, category] }))
    return category
  }, [slug, projectId])

  const handleUpdateCategory = useCallback(async (
    categoryId: string,
    input:       { name?: string; color?: string; description?: string | null },
  ): Promise<Category> => {
    const updated = await updateCategory(slug, projectId, categoryId, input)
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) => c.id === categoryId ? updated : c),
    }))
    return updated
  }, [slug, projectId])

  const handleDeleteCategory = useCallback(async (categoryId: string): Promise<void> => {
    await deleteCategory(slug, projectId, categoryId)
    setState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== categoryId),
    }))
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
        // Unassign categories that were on the completed sprint
        categories: s.categories.map((c) =>
          c.sprintId === sprintId ? { ...c, sprintId: null } : c
        ),
      }
    })
  }, [slug, projectId])

  // Assigns a category to a sprint — all category issues inherit the sprint
  const handleAssignCategoryToSprint = useCallback(async (categoryId: string, sprintId: string): Promise<void> => {
    const updated = await assignCategoryToSprint(slug, projectId, categoryId, sprintId)
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) => c.id === categoryId ? updated : c),
      // Sync issue sprint assignments in local state
      issues: s.issues.map((i) =>
        i.categoryId === categoryId ? { ...i, sprintId } : i
      ),
    }))
  }, [slug, projectId])

  // Unassigns a category from its sprint — all category issues move to backlog
  const handleUnassignCategoryFromSprint = useCallback(async (categoryId: string): Promise<void> => {
    const updated = await unassignCategoryFromSprint(slug, projectId, categoryId)
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) => c.id === categoryId ? updated : c),
      issues: s.issues.map((i) =>
        i.categoryId === categoryId ? { ...i, sprintId: null } : i
      ),
    }))
  }, [slug, projectId])

  const backlogIssues = state.issues.filter((i) => i.sprintId === null)

  return {
    sprints:          state.sprints,
    backlogIssues,
    statuses:         state.statuses,
    categories:       state.categories,
    isLoading:        state.isLoading,
    isCreatingSprint: state.isCreatingSprint,
    allIssues:        state.issues,
    loadBacklog,
    handleCreateSprint,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleCreateIssue,
    handleStartSprint,
    handleCompleteSprint,
    handleAssignCategoryToSprint,
    handleUnassignCategoryFromSprint,
  }
}
