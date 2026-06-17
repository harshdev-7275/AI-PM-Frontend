import { NavLink, useLocation, useParams } from 'react-router-dom'
import {
  BarChart2,
  Kanban,
  CircleDot,
  Settings,
  Zap,
  Plus,
  Bot,
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useOrgStore } from '@/store/useOrgStore'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'
import { useProject } from '@/hooks/useProject'
import { ProfileMenu } from './ProfileMenu'
import { ProjectNavTree } from './ProjectNavTree'

// Subtle brand-colored left accent bar shown on the active nav item.
// Uses existing sidebar tokens only — no new colors.
const ACTIVE_ACCENT =
  'relative data-[active=true]:before:absolute data-[active=true]:before:inset-y-1.5 ' +
  'data-[active=true]:before:left-0 data-[active=true]:before:w-0.5 ' +
  'data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary'

// =============================================================================
// NAV ITEMS
// =============================================================================

const NAV_ITEMS = [
  { icon: Kanban,    label: 'Boards',       path: 'dashboard'    },
  { icon: CircleDot, label: 'Issues',       path: 'issues'       },
  { icon: Zap,       label: 'Sprints',      path: 'sprints'      },
  { icon: BarChart2, label: 'Analytics',    path: 'analytics'    },
  { icon: Bot,       label: 'AI Assistant', path: 'chat'         },
] as const

// =============================================================================
// SIDEBAR (shadcn)
// =============================================================================

interface DashboardSidebarProps {
  onNewProject: () => void
}

/**
 * DashboardSidebar — the org-scoped navigation rail.
 *
 * Structure:
 *   Header   → workspace (org name + plan) + search
 *   Workspace → primary nav (Boards, Issues, Sprints, AI, Analytics)
 *   Projects  → per-project links (collapsible tree added in a later step)
 *   Footer   → ProfileMenu
 */
export function DashboardSidebar({ onNewProject }: DashboardSidebarProps) {
  const { slug }   = useParams<{ slug: string }>()
  const { pathname } = useLocation()
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const user       = useAuthStore((s) => s.user)
  const { projects } = useProject()

  return (
    <Sidebar variant="inset" collapsible="icon">
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
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
                const to = `/${slug}/${path}`
                const isActive = pathname === to || pathname.startsWith(`${to}/`)
                return (
                  <SidebarMenuItem key={path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={label}
                      className={cn(ACTIVE_ACCENT)}
                    >
                      <NavLink to={to}>
                        <Icon />
                        <span>{label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <ProjectNavTree projects={projects} slug={slug} />
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

      {/* Profile menu in footer — full-width row with name + email */}
      <SidebarFooter>
        <ProfileMenu user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
