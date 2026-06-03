import { Fragment, useEffect, useState, Suspense } from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import { ChevronRight, FolderKanban, Plus } from 'lucide-react'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useOrgStore } from '@/store/useOrgStore'
import { useProject } from '@/hooks/useProject'
import { DashboardLoadingSkeleton } from '@/components/blocks/DashboardLoadingSkeleton'
import { DashboardSidebar } from './components/DashboardSidebar'
import { buildBreadcrumbs } from './utils/breadcrumbs'
import NewProjectModal from './NewProjectModal'

// =============================================================================
// TOPBAR
// =============================================================================

function Topbar({ onNewProject }: { onNewProject: () => void }) {
  const currentOrg   = useOrgStore((s) => s.currentOrg)
  const { pathname } = useLocation()
  const { projects } = useProject()
  const crumbs = buildBreadcrumbs(pathname, projects)

  return (
    <header className="h-12 flex items-center px-4 border-b border-border bg-background shrink-0 gap-2">
      <SidebarTrigger className="-ml-1" />
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
        <FolderKanban size={16} className="text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground truncate">
          {currentOrg?.name ?? '—'}
        </span>
        {crumbs.map((crumb, i) => (
          <Fragment key={`${crumb.label}-${i}`}>
            <ChevronRight size={14} className="text-muted-foreground/50 shrink-0" />
            <span
              className={cn(
                'truncate text-sm',
                i === crumbs.length - 1
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {crumb.label}
            </span>
          </Fragment>
        ))}
      </nav>

      {/* Right-side actions */}
      <div className="ml-auto flex items-center gap-1">
        <Button size="sm" variant="outline" onClick={onNewProject} aria-label="New project">
          <Plus className="size-4" />
          <span className="hidden sm:inline">New project</span>
        </Button>
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
      <SidebarInset className="overflow-hidden md:peer-data-[variant=inset]:m-4 md:peer-data-[variant=inset]:h-[calc(100svh-2rem)]">
        <Topbar onNewProject={() => setIsNewProjectModalOpen(true)} />
        <main className="flex-1 overflow-y-auto min-h-0">
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
