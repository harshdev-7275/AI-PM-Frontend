import { useState, useCallback } from 'react'
import { useIssueStore } from '@/store/useIssueStore'
import {
  getIssue,
  updateIssue          as updateIssueApi,
  updateIssueStatus    as updateIssueStatusApi,
  getComments,
  createComment        as createCommentApi,
  updateComment        as updateCommentApi,
  deleteComment        as deleteCommentApi,
  getIssueHistory,
  getProjectMembers,
} from '@/services/api'
import type { IssueDetail, Comment, IssueHistoryEntry, UpdateIssueInput, ProjectMember } from '@/types'

export function useIssueDetail(slug: string, projectId: string) {
  const [issue,     setIssue]     = useState<IssueDetail | null>(null)
  const [comments,  setComments]  = useState<Comment[]>([])
  const [history,   setHistory]   = useState<IssueHistoryEntry[]>([])
  const [members,   setMembers]   = useState<ProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving,  setIsSaving]  = useState(false)

  const statuses           = useIssueStore((s) => s.statuses)
  const updateIssueInStore = useIssueStore((s) => s.updateIssueStatus)
  const patchIssueInStore  = useIssueStore((s) => s.patchIssue)

  // ---------------------------------------------------------------------------
  // loadIssue — fetches detail, comments and history in parallel
  // ---------------------------------------------------------------------------

  const loadIssue = useCallback(async (issueId: string): Promise<void> => {
    setIsLoading(true)
    try {
      const [fetchedIssue, fetchedComments, fetchedHistory, fetchedMembers] = await Promise.all([
        getIssue(slug, projectId, issueId),
        getComments(slug, projectId, issueId),
        getIssueHistory(slug, projectId, issueId),
        getProjectMembers(slug, projectId),
      ])
      setIssue(fetchedIssue)
      setComments(fetchedComments)
      setHistory(fetchedHistory)
      setMembers(fetchedMembers)
    } finally {
      setIsLoading(false)
    }
  }, [slug, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // handleUpdateField — patches a single field, merges result into local state
  // ---------------------------------------------------------------------------

  const handleUpdateField = useCallback(async (
    field: keyof UpdateIssueInput,
    value: UpdateIssueInput[keyof UpdateIssueInput],
  ): Promise<void> => {
    if (!issue) return
    setIsSaving(true)
    try {
      const updated = await updateIssueApi(slug, projectId, issue.id, { [field]: value })
      setIssue((prev) => prev ? { ...prev, ...updated } : null)
      patchIssueInStore(issue.id, updated)
    } finally {
      setIsSaving(false)
    }
  }, [slug, projectId, issue, patchIssueInStore]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // handleUpdateStatus — updates statusId + joined status object in memory
  //                      and syncs the board card via the issue store
  // ---------------------------------------------------------------------------

  const handleUpdateStatus = useCallback(async (statusId: string): Promise<void> => {
    if (!issue) return
    setIsSaving(true)
    try {
      await updateIssueStatusApi(slug, projectId, issue.id, statusId)
      const newStatus = statuses.find((s) => s.id === statusId)
      setIssue((prev) => prev
        ? { ...prev, statusId, status: newStatus ?? prev.status }
        : null
      )
      updateIssueInStore(issue.id, statusId)
    } finally {
      setIsSaving(false)
    }
  }, [slug, projectId, issue, statuses, updateIssueInStore]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Comments
  // ---------------------------------------------------------------------------

  const handleAddComment = useCallback(async (body: string): Promise<void> => {
    if (!issue) return
    const comment = await createCommentApi(slug, projectId, issue.id, body)
    setComments((prev) => [...prev, comment])
  }, [slug, projectId, issue]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateComment = useCallback(async (commentId: string, body: string): Promise<void> => {
    if (!issue) return
    const updated = await updateCommentApi(slug, projectId, issue.id, commentId, body)
    setComments((prev) => prev.map((c) => c.id === commentId ? updated : c))
  }, [slug, projectId, issue]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteComment = useCallback(async (commentId: string): Promise<void> => {
    if (!issue) return
    await deleteCommentApi(slug, projectId, issue.id, commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }, [slug, projectId, issue]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------

  return {
    issue,
    comments,
    history,
    members,
    isLoading,
    isSaving,
    loadIssue,
    handleUpdateField,
    handleUpdateStatus,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
  }
}
