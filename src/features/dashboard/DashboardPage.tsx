import { useOutletContext } from 'react-router-dom'
import { FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrgStore } from '@/store/useOrgStore'

interface DashboardOutletContext {
  onNewProject: () => void
}

export default function DashboardPage() {
  const currentOrg             = useOrgStore((s) => s.currentOrg)
  const { onNewProject }       = useOutletContext<DashboardOutletContext>()

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
      <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
        <FolderPlus size={24} className="text-brand-primary" />
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">
          Welcome to {currentOrg?.name ?? 'your workspace'}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Create your first project to start tracking issues, running sprints, and shipping faster.
        </p>
      </div>

      <Button
        onClick={onNewProject}
        className="bg-brand-primary hover:bg-brand-primary-hover text-white border-0 gap-2"
      >
        <FolderPlus size={16} />
        Create your first project
      </Button>
    </div>
  )
}
