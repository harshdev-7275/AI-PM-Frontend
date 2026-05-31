import { NavLink, Outlet, useParams } from 'react-router-dom'
import { Users, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const SETTINGS_NAV = [
  { icon: SlidersHorizontal, label: 'General', path: '' },
  { icon: Users,             label: 'Members', path: 'members' },
] as const

export default function SettingsPage() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <div className="flex h-full">
      {/* Settings sidebar nav */}
      <aside className="w-52 shrink-0 border-r border-border p-4">
        <h1 className="text-sm font-semibold text-foreground mb-4">Settings</h1>
        <nav className="flex flex-col gap-0.5">
          {SETTINGS_NAV.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={label}
              to={`/${slug}/settings${path ? `/${path}` : ''}`}
              end={path === ''}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-brand-primary/10 text-brand-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  )
}
