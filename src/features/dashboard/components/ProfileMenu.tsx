import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'

interface ProfileMenuProps {
  /** Up to 2 characters shown in the avatar trigger. */
  initials: string
}

/**
 * Profile menu — avatar trigger that opens a menu with a Logout action.
 * Shown in the icon rail of DashboardLayout.
 *
 * Usage: <ProfileMenu initials="PL" />
 */
export function ProfileMenu({ initials }: ProfileMenuProps) {
  const { logout } = useAuth()
  const navigate    = useNavigate()

  const handleLogout = async (): Promise<void> => {
    try {
      await logout()
      navigate('/login')
    } catch {
      // Stay on the current page if logout fails — the user can retry
      // and the toast explains what happened.
      toast.error('Logout failed. Please try again.')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={initials}
          className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-[11px] font-semibold select-none hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" className="min-w-40">
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
