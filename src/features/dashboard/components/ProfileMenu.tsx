import { ChevronsUpDown, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@/types'

interface ProfileMenuProps {
  user: User | null
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

/**
 * ProfileMenu — full-width user row shown in the sidebar footer.
 *
 * Renders:
 *   [Avatar] {user.name}            [Chevron]
 *            {user.email}
 *
 * Clicking the row opens a dropdown menu with a Logout action. The whole
 * row is the trigger so it's discoverable and matches the shadcn pattern
 * used by other dashboards (Linear, Vercel, etc.).
 */
export function ProfileMenu({ user }: ProfileMenuProps) {
  const { logout } = useAuth()
  const navigate    = useNavigate()

  const handleLogout = async (): Promise<void> => {
    try {
      await logout()
      navigate('/login')
    } catch {
      toast.error('Logout failed. Please try again.')
    }
  }

  if (!user) return null

  const initials = getInitials(user.name)
  const buttonLabel = `${user.name} — open profile menu`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={buttonLabel}
          className="w-full flex items-center gap-2 rounded-md p-2 text-left text-sm transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-sidebar-accent"
        >
          <Avatar className="size-8">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-medium text-sidebar-foreground">
              {user.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" className="min-w-48">
        <DropdownMenuItem
          variant="destructive"
          onSelect={(event) => {
            event.preventDefault()
            void handleLogout()
          }}
        >
          <LogOut size={14} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
