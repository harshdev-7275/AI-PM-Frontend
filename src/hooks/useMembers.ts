import { useState } from 'react'
import axios from 'axios'
import {
  getOrgMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  transferOwnership,
} from '@/services/api'
import type { OrgMember, OrgMemberRole, InviteRole, Invitation } from '@/types'

interface MembersState {
  members:    OrgMember[]
  isLoading:  boolean
  isInviting: boolean
  error:      string | null
}

function extractInviteError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const code = err.response?.data?.error as string | undefined
    if (code === 'ALREADY_MEMBER' || code === 'EMAIL_TAKEN') {
      return 'This person is already a member'
    }
    const msg = err.response?.data?.message as string | undefined
    return msg ?? 'Failed to send invite'
  }
  return err instanceof Error ? err.message : 'Failed to send invite'
}

export function useMembers(slug: string) {
  const [state, setState] = useState<MembersState>({
    members:    [],
    isLoading:  false,
    isInviting: false,
    error:      null,
  })

  const loadMembers = async (orgSlug: string): Promise<void> => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const members = await getOrgMembers(orgSlug)
      setState((s) => ({ ...s, members, isLoading: false }))
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined) ?? 'Failed to load members'
        : 'Failed to load members'
      setState((s) => ({ ...s, isLoading: false, error: msg }))
    }
  }

  // Returns the Invitation on success, or undefined if validation/API failed.
  // Errors are surfaced through the error state — callers do not need to catch.
  const handleInvite = async (
    email: string,
    role:  InviteRole = 'member',
  ): Promise<Invitation | undefined> => {
    if (!email.trim()) {
      setState((s) => ({ ...s, error: 'Email is required' }))
      return undefined
    }

    setState((s) => ({ ...s, isInviting: true, error: null }))
    try {
      const invitation = await inviteMember(slug, email, role)
      setState((s) => ({ ...s, isInviting: false }))
      return invitation
    } catch (err) {
      setState((s) => ({ ...s, isInviting: false, error: extractInviteError(err) }))
      return undefined
    }
  }

  const handleUpdateRole = async (
    orgSlug: string,
    userId:  string,
    newRole: OrgMemberRole,
  ): Promise<void> => {
    const updated = await updateMemberRole(orgSlug, userId, newRole)
    setState((s) => ({
      ...s,
      members: s.members.map((m) => m.userId === userId ? { ...m, role: updated.role } : m),
    }))
  }

  const handleRemoveMember = async (orgSlug: string, userId: string): Promise<void> => {
    await removeMember(orgSlug, userId)
    setState((s) => ({
      ...s,
      members: s.members.filter((m) => m.userId !== userId),
    }))
  }

  // Promotes the target to owner and demotes the current owner to admin — mirrors
  // the backend's atomic swap so the list reflects the new roles without a refetch.
  const handleTransferOwnership = async (orgSlug: string, newOwnerUserId: string): Promise<void> => {
    await transferOwnership(orgSlug, newOwnerUserId)
    setState((s) => ({
      ...s,
      members: s.members.map((m) => {
        if (m.userId === newOwnerUserId) return { ...m, role: 'owner' }
        if (m.role === 'owner')          return { ...m, role: 'admin' }
        return m
      }),
    }))
  }

  return {
    members:            state.members,
    isLoading:          state.isLoading,
    isInviting:         state.isInviting,
    error:              state.error,
    loadMembers,
    handleInvite,
    handleUpdateRole,
    handleRemoveMember,
    handleTransferOwnership,
  }
}
