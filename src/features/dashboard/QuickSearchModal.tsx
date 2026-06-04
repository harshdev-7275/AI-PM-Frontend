import { useNavigate, useParams } from 'react-router-dom'
import { Folder, BookOpen } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useIssueStore } from '@/store/useIssueStore'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'

interface QuickSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const projects = useProjectStore((s) => s.projects)
  const issues   = useIssueStore((s) => s.issues)

  // cmdk does its own fuzzy filtering — we hand it the full source list
  // and let it decide what matches each keystroke.

  const selectProject = (projectId: string) => {
    onClose()
    navigate(`/${slug}/projects/${projectId}/board`)
  }

  // Issue routing is not wired up yet (no detail route exists outside the
  // slide-over). For now, navigate to the project board the issue belongs to.
  const selectIssue = (issueId: string) => {
    const issue = issues.find((i) => i.id === issueId)
    if (!issue) { onClose(); return }
    onClose()
    navigate(`/${slug}/projects/${issue.projectId}/board`)
  }

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose() }}
      title="Quick search"
      description="Search projects and issues"
    >
      <CommandInput placeholder="Search projects or issues…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {projects.length > 0 && (
          <CommandGroup heading="Projects">
            {projects.map((p) => (
              <CommandItem
                key={p.id}
                value={`project ${p.name} ${p.key}`}
                onSelect={() => selectProject(p.id)}
              >
                <Folder className="text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.key}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {projects.length > 0 && issues.length > 0 && <CommandSeparator />}

        {issues.length > 0 && (
          <CommandGroup heading="Issues">
            {issues.slice(0, 50).map((i) => (
              <CommandItem
                key={i.id}
                value={`issue ${i.title}`}
                onSelect={() => selectIssue(i.id)}
              >
                <BookOpen className="text-muted-foreground" />
                <span className="truncate">{i.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
