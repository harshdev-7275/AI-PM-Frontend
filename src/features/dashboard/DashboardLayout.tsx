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
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useOrgStore } from '@/store/useOrgStore'
import { useProject } from '@/hooks/useProject'
import { DashboardLoadingSkeleton } from '@/components/blocks/DashboardLoadingSkeleton'
import { ProfileMenu } from './components/ProfileMenu'
import NewProjectModal from './NewProjectModal'

// =============================================================================
// NAV ITEMS
// =============================================================================

const NAV_ITEMS = [
  { icon: Kanban,    label: 'Boards',       path: 'dashboard' },
  { icon: CircleDot, label: 'Issues',       path: 'issues'    },
  { icon: Zap,       label: 'Sprints',      path: 'sprints'   },
  { icon: Bot,       label: 'AI Assistant', path: 'ai-assistant' },
  { icon: BarChart2, label: 'Analytics',    path: 'analytics' },
] as const

// =============================================================================
// SIDEBAR (shadcn)
// =============================================================================

function DashboardSidebar({ onNewProject }: { onNewProject: () => void }) {
  const { slug }   = useParams<{ slug: string }>()
  const navigate   = useNavigate()
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const { projects } = useProject()
  const initials   = currentOrg?.name.slice(0, 2).toUpperCase() ?? '??'

  return (
    <Sidebar collapsible="icon">
      {/* Header — org name + plan */}
      <SidebarHeader>
        <div className="flex flex-col gap-0.5 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
          <p className="text-sm font-semibold text-sidebar-foreground truncate">
            {currentOrg?.name ?? '—'}
          </p>
          <p className="text-[11px] text-muted-foreground capitalize">
            {currentOrg?.plan ?? 'starter'} Plan
          </p>
        </div>
        {/* Search */}
        <SidebarGroup className="p-0 group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <form>
              <SidebarInput
                placeholder="Search…"
                className="h-7 text-xs"
              />
            </form>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        {/* Primary nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton
                    asChild
                    isActive={false /* set by react-router via the NavLink below */}
                    tooltip={label}
                  >
                    <NavLink to={`/${slug}/${path}`}>
                      <Icon />
                      <span>{label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            {projects.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground text-center">
                No projects yet
              </p>
            ) : (
              <SidebarMenu>
                {projects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton
                      onClick={() => navigate(`/${slug}/projects/${project.id}/board`)}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: project.color ?? 'var(--brand-primary)' }}
                      />
                      <span className="truncate">{project.name}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono shrink-0">
                        {project.key}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom links (Settings + New project) */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <NavLink to={`/${slug}/settings/members`}>
                    <Settings />
                    <span>Settings</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNewProject} tooltip="New project">
                  <Plus />
                  <span>New project</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Profile menu in footer */}
      <SidebarFooter>
        <div className="flex items-center justify-center p-1">
          <ProfileMenu initials={initials} />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

// =============================================================================
// TOPBAR
// =============================================================================

function Topbar() {
  const currentOrg = useOrgStore((s) => s.currentOrg)

  return (
    <header className="h-12 flex items-center px-4 border-b border-border bg-background shrink-0 gap-2">
      <SidebarTrigger className="-ml-1" />
      <FolderKanban size={16} className="text-muted-foreground" />
      <span className="text-sm font-medium text-foreground">
        {currentOrg?.name ?? '—'}
      </span>
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
    <SidebarProvider>
      <DashboardSidebar onNewProject={() => setIsNewProjectModalOpen(true)} />
      <SidebarInset>
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
      </SidebarInset>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
      />
    </SidebarProvider>
  )
}
