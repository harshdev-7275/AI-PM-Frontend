import { useState } from 'react'
import axios from 'axios'
import {
  getProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
} from '@/services/api'
import type { ProjectMember, ProjectRole } from '@/types'

interface ProjectMembersState {
  members:   ProjectMember[]
  isLoading: boolean
  isAdding:  boolean
  error:     string | null
}

function errorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data?.message as string | undefined) ?? fallback
  }
  return err instanceof Error ? err.message : fallback
}

/**
 * Manages the membership of a single project: load, add, change role, remove.
 * Mutations update local state in place so the UI reflects changes without a refetch.
 */
export function useProjectMembers(slug: string, projectId: string) {
  const [state, setState] = useState<ProjectMembersState>({
    members:   [],
    isLoading: false,
    isAdding:  false,
    error:     null,
  })

  const load = async (): Promise<void> => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const members = await getProjectMembers(slug, projectId)
      setState((s) => ({ ...s, members, isLoading: false }))
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false, error: errorMessage(err, 'Failed to load project members') }))
    }
  }

  // Returns true on success; errors are surfaced through the error state.
  const add = async (userId: string, role: ProjectRole): Promise<boolean> => {
    setState((s) => ({ ...s, isAdding: true, error: null }))
    try {
      const member = await addProjectMember(slug, projectId, userId, role)
      setState((s) => ({ ...s, isAdding: false, members: [...s.members, member] }))
      return true
    } catch (err) {
      setState((s) => ({ ...s, isAdding: false, error: errorMessage(err, 'Failed to add member') }))
      return false
    }
  }

  const updateRole = async (userId: string, role: ProjectRole): Promise<void> => {
    await updateProjectMemberRole(slug, projectId, userId, role)
    setState((s) => ({
      ...s,
      members: s.members.map((m) => (m.userId === userId ? { ...m, role } : m)),
    }))
  }

  const remove = async (userId: string): Promise<void> => {
    await removeProjectMember(slug, projectId, userId)
    setState((s) => ({ ...s, members: s.members.filter((m) => m.userId !== userId) }))
  }

  return {
    members:   state.members,
    isLoading: state.isLoading,
    isAdding:  state.isAdding,
    error:     state.error,
    load,
    add,
    updateRole,
    remove,
  }
}
