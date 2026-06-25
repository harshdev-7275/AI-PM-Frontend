import { useState } from 'react'
import { ChevronsUpDown, ImageUp, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/UserAvatar'
import { AvatarUploadDialog } from '@/components/AvatarUploadDialog'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@/types'

interface ProfileMenuProps {
  user: User | null
}

/**
 * ProfileMenu — full-width user row shown in the sidebar footer.
 *
 * Renders:
 *   [Avatar] {user.name}            [Chevron]
 *            {user.email}
 *
 * Clicking the row opens a dropdown menu with photo and logout actions. The
 * whole row is the trigger so it's discoverable and matches the shadcn pattern
 * used by other dashboards (Linear, Vercel, etc.).
 */
export function ProfileMenu({ user }: ProfileMenuProps) {
  const { logout } = useAuth()
  const navigate    = useNavigate()
  const [photoOpen, setPhotoOpen] = useState(false)

  const handleLogout = async (): Promise<void> => {
    try {
      await logout()
      navigate('/login')
    } catch {
      toast.error('Logout failed. Please try again.')
    }
  }

  if (!user) return null

  const buttonLabel = `${user.name} — open profile menu`

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={buttonLabel}
            className="w-full flex items-center gap-2 rounded-md p-2 text-left text-sm transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-sidebar-accent"
          >
            <UserAvatar name={user.name} avatarUrl={user.avatarUrl} seed={user.id} />
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
            onSelect={(event) => {
              event.preventDefault()
              setPhotoOpen(true)
            }}
          >
            <ImageUp size={14} />
            {user.avatarUrl ? 'Change photo' : 'Upload photo'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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

      <AvatarUploadDialog user={user} open={photoOpen} onOpenChange={setPhotoOpen} />
    </>
  )
}
