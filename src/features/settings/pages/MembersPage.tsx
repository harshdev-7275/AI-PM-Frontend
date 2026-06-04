import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoleBadge } from '@/components/primitives/RoleBadge'
import { cn } from '@/lib/utils'
import type { OrgMember, InviteRole, Invitation } from '@/types'

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function SkeletonRow() {
  return (
    <TableRow role="status" aria-label="Loading member" className="animate-pulse">
      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-32 rounded bg-muted" />
            <div className="h-2.5 w-48 rounded bg-muted" />
          </div>
        </div>
      </TableCell>
      <TableCell><div className="h-5 w-14 rounded-full bg-muted" /></TableCell>
      <TableCell />
    </TableRow>
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

// Composite shape the table understands — adds derived per-row capability
// flags so the column cells never recompute permissions on render.
type MemberRow = OrgMember & {
  isSelf:        boolean
  canChangeRole: boolean
  canRemove:     boolean
  canTransfer:   boolean
}

export default function MembersPage() {
  const { slug }  = useParams<{ slug: string }>()
  const user      = useAuthStore((s) => s.user)

  const {
    members, isLoading, isInviting, error,
    loadMembers, handleInvite, handleUpdateRole, handleRemoveMember, handleTransferOwnership,
  } = useMembers(slug ?? '')

  const [successInvite, setSuccessInvite] = useState<Invitation | null>(null)
  const [copied,        setCopied]        = useState(false)
  const [filter,        setFilter]        = useState('')
  const [sorting,       setSorting]       = useState<SortingState>([])

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

  // Decorate each member with its per-row capabilities once, so the column
  // cells stay pure and sort/filter don't re-evaluate permissions.
  const rowData: MemberRow[] = useMemo(() => {
    return members.map((m) => {
      const isSelf       = m.userId === user?.id
      const isOtherOwner = m.role === 'owner'
      return {
        ...m,
        isSelf,
        canChangeRole: isOwner   && !isSelf && !isOtherOwner,
        canRemove:     canManage && !isSelf,
        canTransfer:   isOwner   && !isSelf && !isOtherOwner,
      }
    })
  }, [members, user?.id, isOwner, canManage])

  const columns = useMemo<ColumnDef<MemberRow>[]>(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const m = row.original
        const initials = m.name.slice(0, 2).toUpperCase()
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-primary/15 flex items-center justify-center text-[11px] font-semibold text-brand-primary shrink-0 select-none">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {m.name}
                {m.isSelf && <span className="ml-1.5 text-xs text-muted-foreground font-normal">(you)</span>}
              </p>
              <p className="text-xs text-muted-foreground truncate">{m.email}</p>
            </div>
          </div>
        )
      },
      // Search across name + email from one filter input (used by the
      // column-level filter; the global filter also searches both).
      filterFn: (row, _id, value: string) => {
        const q = value.trim().toLowerCase()
        if (!q) return true
        return row.original.name.toLowerCase().includes(q)
            || row.original.email.toLowerCase().includes(q)
      },
      sortingFn: (a, b) => a.original.name.localeCompare(b.original.name),
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const m = row.original
        return m.canChangeRole ? (
          <Select
            value={m.role}
            onValueChange={(v) => void handleUpdateRole(slug ?? '', m.userId, v as InviteRole)}
          >
            <SelectTrigger size="sm" aria-label={`Role for ${m.name}`} className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <RoleBadge role={m.role} />
        )
      },
      // Sort by canonical authority (owner > admin > member > viewer)
      // rather than alphabetic — auditors want the most-privileged users
      // surfaced first.
      sortingFn: (a, b) => {
        const rank: Record<OrgMember['role'], number> = {
          owner: 0, admin: 1, member: 2, viewer: 3,
        }
        return rank[a.original.role] - rank[b.original.role]
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const m = row.original
        return (
          <div className="flex items-center justify-end gap-2">
            {/* Transfer ownership — AlertDialog (was window.confirm) */}
            {m.canTransfer && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Make ${m.name} the owner`}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline shrink-0"
                  >
                    Make owner
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Transfer ownership to {m.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be demoted to admin and {m.name} will become the
                      workspace owner. This action cannot be undone by you.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void handleTransferOwnership(slug ?? '', m.userId)}>
                      Transfer ownership
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Remove — AlertDialog (was no-confirm) */}
            {m.canRemove && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Remove ${m.name}`}
                    className="text-xs text-destructive hover:underline shrink-0"
                  >
                    Remove
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove {m.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      They will lose access to this workspace and every project in it.
                      You can re-invite them later if needed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => void handleRemoveMember(slug ?? '', m.userId)}
                    >
                      Remove member
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )
      },
    },
  ], [handleUpdateRole, handleRemoveMember, handleTransferOwnership, slug])

  const table = useReactTable({
    data: rowData,
    columns,
    state: { globalFilter: filter, sorting },
    onGlobalFilterChange: setFilter,
    onSortingChange:      setSorting,
    globalFilterFn:       (row, _id, value: string) => {
      const q = value.trim().toLowerCase()
      if (!q) return true
      return row.original.name.toLowerCase().includes(q)
          || row.original.email.toLowerCase().includes(q)
          || row.original.role.toLowerCase().includes(q)
    },
    getCoreRowModel:     getCoreRowModel(),
    getSortedRowModel:   getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

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
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Members ({members.length}{filter.trim() ? ` · ${table.getFilteredRowModel().rows.length} matching` : ''})
          </h2>

          <div className="relative max-w-xs flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Filter members…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter members"
              className="h-8 pl-7 text-sm"
            />
          </div>
        </div>

        <div className="rounded-md border border-border overflow-hidden">
          {!isLoading && members.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">
              No members yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30">
                    {hg.headers.map((header) => {
                      const canSort  = header.column.getCanSort()
                      const sortDir  = header.column.getIsSorted()
                      const SortIcon =
                        sortDir === 'asc'  ? ArrowUp :
                        sortDir === 'desc' ? ArrowDown :
                        ChevronsUpDown
                      return (
                        <TableHead
                          key={header.id}
                          className="h-9 px-4 text-xs font-medium text-muted-foreground"
                        >
                          {canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <SortIcon size={11} className={cn(!sortDir && 'opacity-40')} />
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-6">
                      No members match “{filter}”.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3 px-4 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </div>
  )
}
