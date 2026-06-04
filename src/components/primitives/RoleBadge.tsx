import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { OrgMemberRole, ProjectRole } from '@/types'

// Single source of truth for role colours across both the org-level Members
// page and the project-level ProjectMembers page. Lead and Owner share the
// purple accent because both denote the highest authority in their context.
//
// Usage:
//   <RoleBadge role={member.role} />            // works for OrgMemberRole or ProjectRole
//   <RoleBadge role={'lead'} className="ml-2" />

type Role = OrgMemberRole | ProjectRole

const ROLE_LABEL: Record<Role, string> = {
  owner:  'Owner',
  admin:  'Admin',
  lead:   'Lead',
  member: 'Member',
  viewer: 'Viewer',
}

// Each row deliberately uses *tone* utilities (bg/text with /30 alpha on dark)
// rather than raw colour names so dark mode is consistent and accessible.
const ROLE_CLASS: Record<Role, string> = {
  owner:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  admin:  'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300',
  lead:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  member: 'bg-muted      text-muted-foreground',
  viewer: 'bg-zinc-100   text-zinc-600   dark:bg-zinc-800/40   dark:text-zinc-300',
}

interface RoleBadgeProps {
  role:       Role
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <Badge variant="secondary" className={cn(ROLE_CLASS[role], className)}>
      {ROLE_LABEL[role]}
    </Badge>
  )
}
