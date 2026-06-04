import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useMembers } from '@/hooks/useMembers'
import { useProjectMembers } from '@/hooks/useProjectMembers'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { RoleBadge } from '@/components/primitives/RoleBadge'
import type { OrgMember, ProjectMember, ProjectRole } from '@/types'

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface AddMemberSectionProps {
  candidates: OrgMember[]
  isAdding:   boolean
  error:      string | null
  onAdd:      (userId: string, role: ProjectRole) => void
}

function AddMemberSection({ candidates, isAdding, error, onAdd }: AddMemberSectionProps) {
  const [userId, setUserId] = useState('')
  const [role,   setRole]   = useState<ProjectRole>('member')

  return (
    <section className="mb-8">
      <h3 className="text-sm font-semibold text-foreground mb-3">Add a member</h3>
      <div className="flex items-start gap-2">
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger size="sm" aria-label="Select person" className="h-9 flex-1">
            <SelectValue placeholder={candidates.length ? 'Select an org member' : 'No one left to add'} />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((c) => (
              <SelectItem key={c.userId} value={c.userId}>{c.name} · {c.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={role} onValueChange={(v) => setRole(v as ProjectRole)}>
          <SelectTrigger size="sm" aria-label="Project role" className="h-9 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="sm"
          className="h-9 shrink-0"
          disabled={isAdding || !userId}
          onClick={() => { onAdd(userId, role); setUserId('') }}
        >
          {isAdding ? 'Adding…' : 'Add'}
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </section>
  )
}

interface MemberRowProps {
  member:     ProjectMember
  isSelf:     boolean
  canManage:  boolean
  onRole:     (userId: string, role: ProjectRole) => void
  onRemove:   (userId: string) => void
}

function MemberRow({ member, isSelf, canManage, onRole, onRemove }: MemberRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-brand-primary/15 flex items-center justify-center text-[11px] font-semibold text-brand-primary shrink-0 select-none">
        {member.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {member.name}{isSelf && <span className="ml-1.5 text-xs text-muted-foreground font-normal">(you)</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
      </div>

      {canManage ? (
        <Select value={member.role} onValueChange={(v) => onRole(member.userId, v as ProjectRole)}>
          <SelectTrigger size="sm" aria-label={`Role for ${member.name}`} className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <RoleBadge role={member.role} />
      )}

      {canManage && (
        <button
          type="button"
          aria-label={`Remove ${member.name}`}
          onClick={() => onRemove(member.userId)}
          className="text-xs text-destructive hover:underline ml-2 shrink-0"
        >
          Remove
        </button>
      )}
    </div>
  )
}

// =============================================================================
// PAGE
// =============================================================================

export default function ProjectMembersPage() {
  const { slug, projectId } = useParams<{ slug: string; projectId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const currentProject = useProjectStore((s) => s.currentProject)

  const org     = useMembers(slug ?? '')
  const project = useProjectMembers(slug ?? '', projectId ?? '')

  useEffect(() => {
    if (!slug || !projectId) return
    void org.loadMembers(slug)
    void project.load()
  }, [slug, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const myOrgRole     = org.members.find((m) => m.userId === user?.id)?.role
  const myProjectRole = project.members.find((m) => m.userId === user?.id)?.role
  const canManage     = myOrgRole === 'owner' || myOrgRole === 'admin' || myProjectRole === 'lead'

  // Org members who still need explicit project access (owners/admins already have it)
  const candidates = org.members.filter(
    (m) => (m.role === 'member' || m.role === 'viewer')
      && !project.members.some((pm) => pm.userId === m.userId),
  )

  return (
    <div className="px-6 py-6 max-w-2xl">
      <button
        type="button"
        onClick={() => navigate(`/${slug}/projects/${projectId}/board`)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft size={13} /> Back to board
      </button>

      <h1 className="text-lg font-semibold text-foreground mb-1">Project members</h1>
      <p className="text-sm text-muted-foreground mb-6">{currentProject?.name ?? 'This project'}</p>

      {canManage && (
        <AddMemberSection
          candidates={candidates}
          isAdding={project.isAdding}
          error={project.error}
          onAdd={(userId, role) => void project.add(userId, role)}
        />
      )}

      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Members ({project.members.length})</h2>
        <div className="rounded-md border border-border divide-y divide-border">
          {project.isLoading ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Loading…</p>
          ) : project.members.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No members yet.</p>
          ) : (
            project.members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                isSelf={m.userId === user?.id}
                canManage={canManage}
                onRole={(userId, role) => void project.updateRole(userId, role)}
                onRemove={(userId) => void project.remove(userId)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  )
}
