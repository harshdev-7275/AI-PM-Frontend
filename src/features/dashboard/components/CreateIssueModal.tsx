import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Category, CreateIssueInput, IssueStatus, IssueType, IssuePriority } from '@/types'

// =============================================================================
// CONSTANTS
// =============================================================================

const ISSUE_TYPES: { value: IssueType; label: string }[] = [
  { value: 'task',    label: 'Task'    },
  { value: 'bug',     label: 'Bug'     },
  { value: 'feature', label: 'Feature' },
  { value: 'subtask', label: 'Subtask' },
]

const PRIORITIES: { value: IssuePriority; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high',     label: 'High'     },
  { value: 'medium',   label: 'Medium'   },
  { value: 'low',      label: 'Low'      },
]

// =============================================================================
// PROPS
// =============================================================================

interface CreateIssueModalProps {
  isOpen:          boolean
  onClose:         () => void
  defaultStatusId: string
  statuses:        IssueStatus[]
  categories:      Category[]
  onSubmit:        (input: CreateIssueInput) => Promise<void>
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CreateIssueModal({
  isOpen,
  onClose,
  defaultStatusId,
  statuses,
  categories,
  onSubmit,
}: CreateIssueModalProps) {
  const [title,       setTitle]       = useState('')
  const [type,        setType]        = useState<IssueType>('task')
  const [categoryId,  setCategoryId]  = useState('')
  const [priority,    setPriority]    = useState<IssuePriority>('medium')
  const [statusId,    setStatusId]    = useState(defaultStatusId)
  const [assigneeId,  setAssigneeId]  = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // Render-time adjustments (see React docs "Adjusting state when a prop
  // changes"):
  // — sync statusId when the default changes (different column clicked)
  const [prevDefaultStatusId, setPrevDefaultStatusId] = useState(defaultStatusId)
  if (defaultStatusId !== prevDefaultStatusId) {
    setPrevDefaultStatusId(defaultStatusId)
    setStatusId(defaultStatusId)
  }
  // — default categoryId to the first category once categories load
  if (categories.length > 0 && !categoryId) {
    setCategoryId(categories[0]?.id ?? '')
  }

  // Escape key closes the modal
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Reset the form when the modal closes (render-time adjustment)
  const [wasOpen, setWasOpen] = useState(isOpen)
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)
    if (!isOpen) {
      setTitle('')
      setType('task')
      setCategoryId(categories[0]?.id ?? '')
      setPriority('medium')
      setAssigneeId('')
      setDescription('')
      setError(null)
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (!categoryId) {
      setError('Please select a category.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        title:      title.trim(),
        type,
        categoryId,
        priority,
        statusId,
        ...(assigneeId.trim() ? { assigneeId: assigneeId.trim() } : {}),
      })
      onClose()
    } catch {
      setError('Failed to create issue. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-background border border-border rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">New issue</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input
              placeholder="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="h-8 text-sm"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Category</Label>
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No categories yet — create one in Backlog first.</p>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary/40 focus:border-brand-primary/50 transition-colors"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Type + Priority — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IssueType)}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary/40 focus:border-brand-primary/50 transition-colors"
              >
                {ISSUE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary/40 focus:border-brand-primary/50 transition-colors"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <select
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary/40 focus:border-brand-primary/50 transition-colors"
            >
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Assignee
              <span className="ml-1 text-muted-foreground/60 font-normal">· optional</span>
            </Label>
            <Input
              placeholder="User ID"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="h-8 text-sm font-mono"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Description
              <span className="ml-1 text-muted-foreground/60 font-normal">· optional</span>
            </Label>
            <textarea
              placeholder="What needs to be done?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary/40 focus:border-brand-primary/50 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-8 px-3 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !categoryId}
              className="h-8 px-3 text-sm bg-brand-primary hover:bg-brand-primary-hover text-white border-0"
            >
              {isSubmitting ? 'Creating…' : 'Create issue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
