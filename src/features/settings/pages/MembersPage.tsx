import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useMembers } from '@/hooks/useMembers'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { RoleBadge } from '@/components/primitives/RoleBadge'
import type { OrgMember, InviteRole, Invitation } from '@/types'

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function SkeletonRow() {
  return (
    <div role="status" aria-label="Loading member" className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-32 rounded bg-muted" />
        <div className="h-2.5 w-48 rounded bg-muted" />
      </div>
      <div className="h-5 w-14 rounded-full bg-muted" />
    </div>
  )
}

interface MemberRowProps {
  member:        OrgMember
  isSelf:        boolean
  canRemove:     boolean
  canChangeRole: boolean
  canTransfer:   boolean
  slug:          string
  onUpdateRole:  (slug: string, userId: string, role: InviteRole) => Promise<void>
  onRemove:      (slug: string, userId: string) => Promise<void>
  onTransfer:    (slug: string, userId: string) => Promise<void>
}

function MemberRow({
  member, isSelf, canRemove, canChangeRole, canTransfer, slug, onUpdateRole, onRemove, onTransfer,
}: MemberRowProps) {
  const initials = member.name.slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-brand-primary/15 flex items-center justify-center text-[11px] font-semibold text-brand-primary shrink-0 select-none">
        {initials}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {member.name}
          {isSelf && <span className="ml-1.5 text-xs text-muted-foreground font-normal">(you)</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
      </div>

      {/* Role badge / dropdown */}
      {canChangeRole ? (
        <Select
          value={member.role}
          onValueChange={(v) => void onUpdateRole(slug, member.userId, v as InviteRole)}
        >
          <SelectTrigger size="sm" aria-label={`Role for ${member.name}`} className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <RoleBadge role={member.role} />
      )}

      {/* Transfer ownership */}
      {canTransfer && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              aria-label={`Make ${member.name} the owner`}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline ml-2 shrink-0"
            >
              Make owner
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Transfer ownership to {member.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be demoted to admin and {member.name} will become the
                workspace owner. This action cannot be undone by you.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void onTransfer(slug, member.userId)}>
                Transfer ownership
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Remove button */}
      {canRemove && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              aria-label={`Remove ${member.name}`}
              className="text-xs text-destructive hover:underline ml-2 shrink-0"
            >
              Remove
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                They will lose access to this workspace and every project in it.
                You can re-invite them later if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => void onRemove(slug, member.userId)}
              >
                Remove member
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

interface InviteSectionProps {
  isInviting: boolean
  hookError:  string | null
  onInvite:   (email: string, role: InviteRole) => void
}

function InviteSection({ isInviting, hookError, onInvite }: InviteSectionProps) {
  const [email,      setEmail]      = useState('')
  const [inviteRole, setInviteRole] = useState<InviteRole>('member')

  function handleSubmit() {
    onInvite(email, inviteRole)
    if (!email.trim()) return   // validation error — don't clear
    setEmail('')
  }

  return (
    <section className="mb-8">
      <h3 className="text-sm font-semibold text-foreground mb-3">Invite people</h3>

      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 flex-1"
              aria-invalid={!!hookError}
            />
            <Select
              value={inviteRole}
              onValueChange={(v) => setInviteRole(v as InviteRole)}
            >
              <SelectTrigger size="sm" aria-label="Invite as" className="w-28 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hookError && (
            <p className="text-xs text-destructive">{hookError}</p>
          )}
        </div>

        <Button
          size="sm"
          disabled={isInviting}
          onClick={handleSubmit}
          className="h-9 shrink-0"
        >
          {isInviting ? 'Sending…' : 'Send invite'}
        </Button>
      </div>
    </section>
  )
}

// =============================================================================
// MEMBERS PAGE
// =============================================================================

export default function MembersPage() {
  const { slug }  = useParams<{ slug: string }>()
  const user      = useAuthStore((s) => s.user)

  const {
    members, isLoading, isInviting, error,
    loadMembers, handleInvite, handleUpdateRole, handleRemoveMember, handleTransferOwnership,
  } = useMembers(slug ?? '')

  const [successInvite, setSuccessInvite] = useState<Invitation | null>(null)
  const [copied, setCopied] = useState(false)

  const inviteLink = successInvite ? `${window.location.origin}/invite/${successInvite.token}` : null

  async function copyInviteLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (slug) void loadMembers(slug)
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  // Derive the current user's membership role from the loaded list
  const currentMember = members.find((m) => m.userId === user?.id)
  const isOwner       = currentMember?.role === 'owner'
  const canManage     = isOwner || currentMember?.role === 'admin'

  async function onInvite(email: string, role: InviteRole) {
    const invitation = await handleInvite(email, role)
    if (invitation) {
      setSuccessInvite(invitation)
      setCopied(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Invite section — only for owners and admins */}
      {canManage && (
        <InviteSection
          isInviting={isInviting}
          hookError={error}
          onInvite={onInvite}
        />
      )}

      {/* Invite link — share this with the invited person */}
      {successInvite && inviteLink && (
        <div className="mb-6 rounded-md border border-border bg-card px-4 py-3">
          <p className="text-sm text-foreground mb-2">
            Invite created for <span className="font-medium">{successInvite.email}</span>. Share this link:
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={inviteLink} aria-label="Invite link" className="h-9 flex-1 text-xs" />
            <Button size="sm" variant="outline" className="h-9 shrink-0" onClick={() => void copyInviteLink()}>
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        </div>
      )}

      {/* Members list */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Members ({members.length})
        </h2>

        <div className="rounded-md border border-border divide-y divide-border">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : members.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">
              No members yet.
            </p>
          ) : (
            members.map((member) => {
              const isSelf       = member.userId === user?.id
              const isOtherOwner = member.role === 'owner'
              return (
                <MemberRow
                  key={member.id}
                  member={member}
                  isSelf={isSelf}
                  slug={slug ?? ''}
                  canChangeRole={isOwner && !isSelf && !isOtherOwner}
                  canRemove={canManage && !isSelf}
                  canTransfer={isOwner && !isSelf && !isOtherOwner}
                  onUpdateRole={handleUpdateRole}
                  onRemove={handleRemoveMember}
                  onTransfer={handleTransferOwnership}
                />
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
