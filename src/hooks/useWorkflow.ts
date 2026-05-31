import { useState } from 'react'
import {
  getWorkflowStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
  StatusHasIssuesError,
} from '@/services/api'
import type { WorkflowStatus } from '@/types'

interface WorkflowState {
  statuses:  WorkflowStatus[]
  isLoading: boolean
  isSaving:  boolean
}

export function useWorkflow(slug: string, projectId: string) {
  const [state, setState] = useState<WorkflowState>({
    statuses:  [],
    isLoading: false,
    isSaving:  false,
  })

  // ---------------------------------------------------------------------------
  // loadStatuses — initial fetch, errors are swallowed (component shows empty state)
  // ---------------------------------------------------------------------------

  const loadStatuses = async (): Promise<void> => {
    setState((s) => ({ ...s, isLoading: true }))
    try {
      const statuses = await getWorkflowStatuses(slug, projectId)
      setState((s) => ({ ...s, statuses, isLoading: false }))
    } catch {
      setState((s) => ({ ...s, isLoading: false }))
    }
  }

  // ---------------------------------------------------------------------------
  // handleCreate — appends to end; server auto-assigns position = max + 1
  // ---------------------------------------------------------------------------

  const handleCreate = async (name: string, color: string): Promise<void> => {
    setState((s) => ({ ...s, isSaving: true }))
    try {
      const status = await createStatus(slug, projectId, name, color)
      setState((s) => ({ ...s, statuses: [...s.statuses, status], isSaving: false }))
    } catch (err) {
      setState((s) => ({ ...s, isSaving: false }))
      throw err
    }
  }

  // ---------------------------------------------------------------------------
  // handleRename — optimistic in-memory update; no refetch needed
  // ---------------------------------------------------------------------------

  const handleRename = async (statusId: string, name: string): Promise<void> => {
    setState((s) => ({ ...s, isSaving: true }))
    try {
      await updateStatus(slug, projectId, statusId, { name })
      setState((s) => ({
        ...s,
        isSaving:  false,
        statuses:  s.statuses.map((st) => st.id === statusId ? { ...st, name } : st),
      }))
    } catch (err) {
      setState((s) => ({ ...s, isSaving: false }))
      throw err
    }
  }

  // ---------------------------------------------------------------------------
  // handleRecolor — same pattern as rename
  // ---------------------------------------------------------------------------

  const handleRecolor = async (statusId: string, color: string): Promise<void> => {
    setState((s) => ({ ...s, isSaving: true }))
    try {
      await updateStatus(slug, projectId, statusId, { color })
      setState((s) => ({
        ...s,
        isSaving:  false,
        statuses:  s.statuses.map((st) => st.id === statusId ? { ...st, color } : st),
      }))
    } catch (err) {
      setState((s) => ({ ...s, isSaving: false }))
      throw err
    }
  }

  // ---------------------------------------------------------------------------
  // handleReorder — refetches full list because sibling positions shift server-side
  // ---------------------------------------------------------------------------

  const handleReorder = async (statusId: string, newPosition: number): Promise<void> => {
    setState((s) => ({ ...s, isSaving: true }))
    try {
      await updateStatus(slug, projectId, statusId, { position: newPosition })
      const statuses = await getWorkflowStatuses(slug, projectId)
      setState((s) => ({ ...s, statuses, isSaving: false }))
    } catch (err) {
      setState((s) => ({ ...s, isSaving: false }))
      throw err
    }
  }

  // ---------------------------------------------------------------------------
  // handleDelete — absorbs StatusHasIssuesError into return value so the
  // component can show "X issues use this status" without a try/catch at the call site.
  // All other errors (400 LAST_STATUS, 404, network) are re-thrown.
  // ---------------------------------------------------------------------------

  const handleDelete = async (
    statusId: string,
  ): Promise<{ issueCount: number } | undefined> => {
    setState((s) => ({ ...s, isSaving: true }))
    try {
      await deleteStatus(slug, projectId, statusId)
      setState((s) => ({
        ...s,
        isSaving:  false,
        statuses:  s.statuses.filter((st) => st.id !== statusId),
      }))
      return undefined
    } catch (err) {
      setState((s) => ({ ...s, isSaving: false }))
      if (err instanceof StatusHasIssuesError) {
        return { issueCount: err.issueCount }
      }
      throw err
    }
  }

  // ---------------------------------------------------------------------------

  return {
    statuses:  state.statuses,
    isLoading: state.isLoading,
    isSaving:  state.isSaving,
    loadStatuses,
    handleCreate,
    handleRename,
    handleRecolor,
    handleReorder,
    handleDelete,
  }
}
