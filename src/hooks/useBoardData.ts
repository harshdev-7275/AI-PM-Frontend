import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useIssueStore } from '@/store/useIssueStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useBoardEvents } from '@/hooks/useBoardEvents'
import {
  getIssueStatuses,
  getIssues,
  getSprints,
  createIssue as createIssueApi,
  updateIssueStatus as updateIssueStatusApi,
} from '@/services/api'
import type { CreateIssueInput, Issue, Sprint } from '@/types'

export function useBoardData() {
  const { slug, projectId } = useParams<{ slug: string; projectId: string }>()
  const [sprints, setSprints] = useState<Sprint[]>([])

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

  const {
    issues,
    statuses,
    isLoading,
    setIssues,
    setStatuses,
    setLoading,
    addIssue,
    updateIssueStatus,
  } = useIssueStore()

  // Open SSE connection — receives board events from other users in real time
  useBoardEvents()

  useEffect(() => {
    if (!slug || !projectId) return

    const load = async () => {
      setLoading(true)
      try {
        const [fetchedStatuses, fetchedIssues, fetchedSprints] = await Promise.all([
          getIssueStatuses(slug, projectId),
          getIssues(slug, projectId),
          getSprints(slug, projectId),
        ])
        setStatuses(fetchedStatuses)
        setIssues(fetchedIssues)
        setSprints(fetchedSprints)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [slug, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragEnd = async (issueId: string, newStatusId: string): Promise<void> => {
    const original = issues.find((i) => i.id === issueId)
    if (!original || original.statusId === newStatusId) return

    // Optimistic update — card moves instantly
    updateIssueStatus(issueId, newStatusId)

    try {
      await updateIssueStatusApi(slug!, projectId!, issueId, newStatusId)
    } catch {
      // Revert if API call fails
      updateIssueStatus(issueId, original.statusId)
    }
  }

  const handleCreateIssue = async (input: CreateIssueInput): Promise<Issue> => {
    const issue = await createIssueApi(slug!, projectId!, input)
    addIssue(issue)
    return issue
  }

  return {
    issues,
    statuses,
    sprints,
    isLoading,
    handleDragEnd,
    handleCreateIssue,
  }
}
