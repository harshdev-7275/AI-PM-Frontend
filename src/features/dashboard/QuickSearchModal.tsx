import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Folder, BookOpen } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useIssueStore } from '@/store/useIssueStore'
import { Input } from '@/components/ui/input'

interface QuickSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const [query, setQuery] = useState('')
  const projects = useProjectStore((s) => s.projects)
  const issues = useIssueStore((s) => s.issues)

  const results = useMemo(() => {
    if (!query.trim()) {
      return {
        projects: projects.slice(0, 5),
        issues: [],
      }
    }

    const q = query.toLowerCase()
    return {
      projects: projects
        .filter((p) => p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q))
        .slice(0, 5),
      issues: issues
        .filter((i) => i.title.toLowerCase().includes(q))
        .slice(0, 5),
    }
  }, [query, projects, issues])

  const handleSelectProject = (projectId: string) => {
    navigate(`/${slug}/projects/${projectId}/board`)
    onClose()
  }

  const handleSelectIssue = () => {
    // This would open the issue detail, assuming there's a route for it
    // For now, we'll just close the modal
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', duration: 0.2 }}
            className="relative z-10 w-full max-w-lg mx-4 bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="px-4 py-3 border-b border-border">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search projects or issues..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') onClose()
                  }}
                  className="h-9 pl-9 text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {results.projects.length === 0 && results.issues.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {query ? 'No results found' : 'Start typing to search...'}
                </div>
              ) : (
                <>
                  {/* Projects section */}
                  {results.projects.length > 0 && (
                    <div className="px-2 py-2 border-b border-border/50 last:border-0">
                      <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Projects
                      </p>
                      {results.projects.map((project) => (
                        <motion.button
                          key={project.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => handleSelectProject(project.id)}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground hover:bg-muted transition-colors text-left"
                        >
                          <Folder size={14} className="text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{project.name}</p>
                            <p className="text-xs text-muted-foreground">{project.key}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Issues section */}
                  {results.issues.length > 0 && (
                    <div className="px-2 py-2">
                      <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Issues
                      </p>
                      {results.issues.map((issue) => (
                        <motion.button
                          key={issue.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={handleSelectIssue}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground hover:bg-muted transition-colors text-left"
                        >
                          <BookOpen size={14} className="text-muted-foreground shrink-0" />
                          <p className="truncate">{issue.title}</p>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground/60">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[10px]">ESC</kbd> to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
