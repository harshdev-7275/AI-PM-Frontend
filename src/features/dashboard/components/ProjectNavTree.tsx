import { ChevronRight } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import type { Project } from '@/types'

// Sub-routes each project expands into. Both are real routes
// (see app/router.tsx: projects/:projectId/{board,backlog}).
const PROJECT_SUBROUTES = [
  { label: 'Board',   segment: 'board'   },
  { label: 'Backlog', segment: 'backlog' },
] as const

interface ProjectNavTreeProps {
  projects: Project[]
  slug: string | undefined
}

/**
 * ProjectNavTree — the Projects section rendered as a collapsible tree.
 *
 * Each project is a row that expands to its Board / Backlog sub-links.
 * The project owning the current route is expanded by default so the
 * active sub-link is visible on load.
 */
export function ProjectNavTree({ projects, slug }: ProjectNavTreeProps) {
  const { pathname } = useLocation()

  if (projects.length === 0) {
    return (
      <p className="px-2 py-3 text-xs text-muted-foreground text-center">
        No projects yet
      </p>
    )
  }

  return (
    <SidebarMenu>
      {projects.map((project) => {
        const base = `/${slug}/projects/${project.id}`
        const isProjectActive = pathname.startsWith(`${base}/`)

        return (
          <Collapsible
            key={project.id}
            defaultOpen={isProjectActive}
            className="group/project"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: project.color ?? 'var(--brand-primary)' }}
                  />
                  <span className="truncate">{project.name}</span>
                  <span className="ml-auto flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground/60">
                      {project.key}
                    </span>
                    <ChevronRight className="size-3.5 text-muted-foreground/60 transition-transform group-data-[state=open]/project:rotate-90" />
                  </span>
                </SidebarMenuButton>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <SidebarMenuSub>
                  {PROJECT_SUBROUTES.map(({ label, segment }) => {
                    const to = `${base}/${segment}`
                    return (
                      <SidebarMenuSubItem key={segment}>
                        <SidebarMenuSubButton asChild isActive={pathname === to}>
                          <NavLink to={to}>{label}</NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        )
      })}
    </SidebarMenu>
  )
}
