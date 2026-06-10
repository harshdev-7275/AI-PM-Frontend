import { useState } from 'react'
import { ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Project } from '@/types'

// =============================================================================
// SPRINT SETTINGS — weekly auto-create toggle
// =============================================================================

interface SprintSettingsProps {
  project: Project
  onSave:  (input: { weeklyAutoCreate: boolean }) => Promise<void>
}

export function SprintSettings({ project, onSave }: SprintSettingsProps) {
  const [expanded,    setExpanded]    = useState(false)
  const [autoCreate,  setAutoCreate]  = useState(project.weeklyAutoCreate)
  const [isSaving,    setIsSaving]    = useState(false)
  const [savedFlash,  setSavedFlash]  = useState(false)

  // Re-seed the toggle when a different project is shown (render-time
  // adjustment — see React docs "Adjusting state when a prop changes")
  const [prevProjectId, setPrevProjectId] = useState(project.id)
  if (project.id !== prevProjectId) {
    setPrevProjectId(project.id)
    setAutoCreate(project.weeklyAutoCreate)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({ weeklyAutoCreate: autoCreate })
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setExpanded((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/40 transition-colors text-left"
      >
        <ChevronRight
          size={14}
          className={`text-muted-foreground transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
        />
        <span className="text-sm font-medium text-foreground flex-1">Sprint settings</span>
        {project.weeklyAutoCreate && (
          <Badge className="h-4 px-1.5 text-[10px] rounded bg-blue-500/15 text-blue-500 shrink-0">
            Auto-create on
          </Badge>
        )}
      </button>

      {/* Expanded form */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 flex flex-col gap-5">
          {/* Weekly auto-create toggle */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">Auto-create weekly sprint</p>
              <p className="text-[11px] text-muted-foreground">
                Completing a sprint automatically creates the next one with a 7-day window
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoCreate}
              onClick={() => setAutoCreate((v) => !v)}
              className={[
                'relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                autoCreate ? 'bg-brand-primary' : 'bg-input',
              ].join(' ')}
            >
              <span
                className={[
                  'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
                  autoCreate ? 'translate-x-4' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="h-8 px-4 text-sm bg-brand-primary hover:bg-brand-primary-hover text-white border-0"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
            {savedFlash && (
              <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                <Check size={12} />
                Saved
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
