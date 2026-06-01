import { useEffect, useState, Suspense } from 'react'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import {
  BarChart2,
  Bot,
  Kanban,
  CircleDot,
  Settings,
  Zap,
  FolderKanban,
  Plus,
  Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useOrgStore } from '@/store/useOrgStore'
import { useProject } from '@/hooks/useProject'
import { DashboardLoadingSkeleton } from '@/components/blocks/DashboardLoadingSkeleton'
import NewProjectModal from './NewProjectModal'

// =============================================================================
// NAV ITEMS
// =============================================================================

const NAV_ITEMS = [
  { icon: Kanban,    label: 'Boards',       path: 'dashboard' },
  { icon: CircleDot, label: 'Issues',       path: 'issues'    },
  { icon: Zap,       label: 'Sprints',      path: 'sprints'   },
  { icon: Bot,       label: 'AI Assistant', path: 'ai'        },
  { icon: BarChart2, label: 'Analytics',    path: 'analytics' },
] as const

// =============================================================================
// ICON RAIL
// =============================================================================

function IconRail() {
  const { slug }   = useParams<{ slug: string }>()
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const initials   = currentOrg?.name.slice(0, 2).toUpperCase() ?? '??'

  return (
    <aside className="w-12 flex flex-col items-center py-3 gap-1 border-r border-sidebar-border bg-sidebar shrink-0">
      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={`/${slug}/${path}`}
            title={label}
            className={({ isActive }) =>
              [
                'w-9 h-9 flex items-center justify-center rounded-lg transition-colors',
                isActive
                  ? 'bg-brand-primary text-white'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
              ].join(' ')
            }
          >
            <Icon size={18} />
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-2">
        <NavLink
          to={`/${slug}/settings/members`}
          title="Settings"
          className={({ isActive }) =>
            [
              'w-9 h-9 flex items-center justify-center rounded-lg transition-colors',
              isActive
                ? 'bg-brand-primary text-white'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
            ].join(' ')
          }
        >
          <Settings size={18} />
        </NavLink>

        <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-[11px] font-semibold select-none">
          {initials}
        </div>
      </div>
    </aside>
  )
}

// =============================================================================
// SIDEBAR
// =============================================================================

interface SidebarProps {
  onNewProject: () => void
}

function Sidebar({ onNewProject }: SidebarProps) {
  const { slug }   = useParams<{ slug: string }>()
  const navigate   = useNavigate()
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const { projects } = useProject()

  return (
    <aside className="w-56 flex flex-col border-r border-sidebar-border bg-sidebar shrink-0 overflow-hidden">
      {/* Org name + plan */}
      <div className="px-3 pt-4 pb-2">
        <p className="text-sm font-semibold text-sidebar-foreground truncate">
          {currentOrg?.name ?? '—'}
        </p>
        <p className="text-[11px] text-muted-foreground capitalize">
          {currentOrg?.plan ?? 'starter'} Plan
        </p>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search…"
            className="h-7 pl-7 text-xs bg-sidebar-accent border-sidebar-border focus-visible:ring-brand-primary/40"
          />
        </div>
      </div>

      <div className="h-px bg-sidebar-border mx-3" />

      {/* Nav text items */}
      <nav className="flex flex-col gap-0.5 px-2 py-2">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={`/${slug}/${path}`}
            className={({ isActive }) =>
              [
                'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-brand-primary/10 text-brand-primary font-medium'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
              ].join(' ')
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="h-px bg-sidebar-border mx-3 my-1" />

      {/* Projects section */}
      <div className="flex flex-col flex-1 overflow-hidden px-2">
        <div className="px-2 py-1.5">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Projects
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {projects.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground text-center">
              No projects yet
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/${slug}/projects/${project.id}/board`)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-left"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: project.color ?? 'var(--brand-primary)' }}
                  />
                  <span className="truncate">{project.name}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono shrink-0">
                    {project.key}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom links */}
      <div className="p-3 border-t border-sidebar-border flex flex-col gap-0.5">
        <NavLink
          to={`/${slug}/settings/members`}
          className={({ isActive }) =>
            [
              'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors',
              isActive
                ? 'bg-brand-primary/10 text-brand-primary font-medium'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
            ].join(' ')
          }
        >
          <Settings size={15} />
          Settings
        </NavLink>

        <button
          type="button"
          onClick={onNewProject}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <Plus size={15} />
          New project
        </button>
      </div>
    </aside>
  )
}

// =============================================================================
// TOPBAR
// =============================================================================

function Topbar() {
  const currentOrg = useOrgStore((s) => s.currentOrg)

  return (
    <header className="h-12 flex items-center px-4 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-2">
        <FolderKanban size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {currentOrg?.name ?? '—'}
        </span>
      </div>
    </header>
  )
}

// =============================================================================
// DASHBOARD LAYOUT
// =============================================================================

export default function DashboardLayout() {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const { slug } = useParams<{ slug: string }>()
  const { projects, loadProjects, isLoading } = useProject()

  // Load projects once when the org slug changes.
  // Guard prevents redundant fetches if projects are already loaded for this org.
  useEffect(() => {
    if (slug && projects.length === 0) {
      void loadProjects(slug).finally(() => setIsInitialLoading(false))
    } else if (projects.length > 0) {
      setIsInitialLoading(false)
    }
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show skeleton if still loading initially OR data is still being fetched
  const shouldShowSkeleton = isInitialLoading || (projects.length === 0 && isLoading)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <IconRail />
      <Sidebar onNewProject={() => setIsNewProjectModalOpen(true)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {shouldShowSkeleton ? (
            <DashboardLoadingSkeleton />
          ) : (
            <Suspense fallback={<DashboardLoadingSkeleton />}>
              <Outlet context={{ onNewProject: () => setIsNewProjectModalOpen(true) }} />
            </Suspense>
          )}
        </main>
      </div>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
      />
    </div>
  )
}
