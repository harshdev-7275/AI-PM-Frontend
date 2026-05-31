import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useWorkflow } from '@/hooks/useWorkflow'
import { useProject } from '@/hooks/useProject'
import type { WorkflowStatus } from '@/types'

// =============================================================================
// CONSTANTS
// =============================================================================

const PRESET_COLORS: string[] = [
  '#6b7280', '#3b82f6', '#f59e0b', '#10b981',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

// =============================================================================
// COLOR DOT
// =============================================================================

interface ColorDotProps {
  color:     string
  disabled?: boolean
  onChange:  (color: string) => void
}

function ColorDot({ color, disabled = false, onChange }: ColorDotProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        aria-label="Change status color"
        onClick={() => setOpen((o) => !o)}
        style={{ backgroundColor: color }}
        className="w-4 h-4 rounded-full border border-border/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 disabled:opacity-40 disabled:cursor-not-allowed"
      />
      {open && (
        <div className="absolute left-0 top-6 z-20 p-2 bg-popover border border-border rounded-lg shadow-md grid grid-cols-4 gap-1.5 w-[108px]">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              style={{ backgroundColor: c }}
              onClick={() => { onChange(c); setOpen(false) }}
              className={cn(
                'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none',
                c === color ? 'border-foreground' : 'border-transparent',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// STATUS ROW
// =============================================================================

type DeleteState = 'idle' | 'confirm' | 'warning'

interface StatusRowProps {
  status:    WorkflowStatus
  total:     number
  isSaving:  boolean
  onRename:  (id: string, name: string)  => Promise<void>
  onRecolor: (id: string, color: string) => Promise<void>
  onDelete:  (id: string) => Promise<{ issueCount: number } | undefined>
}

function StatusRow({ status, total, isSaving, onRename, onRecolor, onDelete }: StatusRowProps) {
  const [isEditing,   setIsEditing]   = useState(false)
  const [nameValue,   setNameValue]   = useState(status.name)
  const [deleteState, setDeleteState] = useState<DeleteState>('idle')
  const [issueCount,  setIssueCount]  = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: status.id })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: status.id })

  const canDelete = !status.isDefault && total > 1

  function startEdit() {
    setNameValue(status.name)
    setIsEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function commitRename() {
    setIsEditing(false)
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== status.name) await onRename(status.id, trimmed)
    else setNameValue(status.name)
  }

  async function confirmDelete() {
    const result = await onDelete(status.id)
    if (result) { setIssueCount(result.issueCount); setDeleteState('warning') }
    else          setDeleteState('idle')
  }

  return (
    <div ref={setDropRef}>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card transition-colors group',
          isOver && !isDragging && 'border-brand-primary/40 bg-brand-primary/5',
          isDragging && 'opacity-30',
        )}
      >
        {/* Drag handle */}
        <button
          ref={setDragRef}
          type="button"
          aria-label="Drag to reorder"
          {...listeners}
          {...attributes}
          className="text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0 touch-none"
        >
          <GripVertical size={14} />
        </button>

        {/* Color dot */}
        <ColorDot
          color={status.color}
          disabled={isSaving}
          onChange={(c) => void onRecolor(status.id, c)}
        />

        {/* Name — click to edit inline */}
        {isEditing ? (
          <Input
            ref={inputRef}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={() => void commitRename()}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  void commitRename()
              if (e.key === 'Escape') { setIsEditing(false); setNameValue(status.name) }
            }}
            className="h-6 text-sm flex-1 px-1 py-0 min-w-0"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="flex-1 text-left text-sm text-foreground hover:text-brand-primary truncate min-w-0"
          >
            {status.name}
          </button>
        )}

        {/* Default badge */}
        {status.isDefault && (
          <span className="text-[11px] text-muted-foreground shrink-0 select-none">Default</span>
        )}

        {/* Delete controls */}
        {deleteState === 'idle' && (
          <button
            type="button"
            aria-label={`Delete ${status.name}`}
            disabled={!canDelete || isSaving}
            onClick={() => setDeleteState('confirm')}
            className="shrink-0 text-transparent group-hover:text-muted-foreground hover:!text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={13} />
          </button>
        )}

        {deleteState === 'confirm' && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">Delete?</span>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              className="text-xs text-destructive font-medium hover:underline"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setDeleteState('idle')}
              className="text-xs text-muted-foreground hover:underline"
            >
              Cancel
            </button>
          </div>
        )}

        {/* No controls when warning is showing — user must dismiss via Cancel */}
        {deleteState === 'warning' && (
          <button
            type="button"
            onClick={() => setDeleteState('idle')}
            className="text-xs text-muted-foreground hover:underline shrink-0"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Issue warning — rendered below the row */}
      {deleteState === 'warning' && (
        <p className="mt-1 ml-3 text-xs text-amber-600 dark:text-amber-400">
          Cannot delete — {issueCount} {issueCount === 1 ? 'issue uses' : 'issues use'} this status.
          Move them to another status first.
        </p>
      )}
    </div>
  )
}

// =============================================================================
// ADD STATUS ROW
// =============================================================================

interface AddStatusRowProps {
  isSaving: boolean
  onSave:   (name: string, color: string) => Promise<void>
  onCancel: () => void
}

function AddStatusRow({ isSaving, onSave, onCancel }: AddStatusRowProps) {
  const [name,  setName]  = useState('')
  const [color, setColor] = useState<string>(PRESET_COLORS[0]!)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleSave() {
    const trimmed = name.trim()
    if (trimmed) await onSave(trimmed, color)
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-brand-primary/40 bg-brand-primary/5">
      <div className="w-3.5 shrink-0" />
      <ColorDot color={color} onChange={setColor} />
      <Input
        ref={inputRef}
        placeholder="Status name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter')  void handleSave()
          if (e.key === 'Escape') onCancel()
        }}
        className="h-6 text-sm flex-1 px-1 py-0 min-w-0"
        disabled={isSaving}
      />
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={!name.trim() || isSaving}
        className="text-xs text-brand-primary font-medium hover:underline disabled:opacity-40 shrink-0"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs text-muted-foreground hover:underline shrink-0"
      >
        Cancel
      </button>
    </div>
  )
}

// =============================================================================
// WORKFLOW PAGE
// =============================================================================

export default function WorkflowPage() {
  const { slug }    = useParams<{ slug: string }>()
  const { projects, loadProjects } = useProject()

  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [addingStatus,      setAddingStatus]      = useState(false)
  const [activeId,          setActiveId]          = useState<string | null>(null)

  const {
    statuses, isLoading, isSaving,
    loadStatuses, handleCreate, handleRename, handleRecolor, handleReorder, handleDelete,
  } = useWorkflow(slug ?? '', selectedProjectId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Load projects if not yet in store (navigated directly to /settings/workflow)
  useEffect(() => {
    if (slug && projects.length === 0) void loadProjects(slug)
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select first project when projects become available
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0]!.id)
    }
  }, [projects]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload statuses whenever the selected project changes
  useEffect(() => {
    if (selectedProjectId) {
      setAddingStatus(false)
      void loadStatuses()
    }
  }, [selectedProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const target = statuses.find((s) => s.id === over.id)
    if (target) void handleReorder(active.id as string, target.position)
  }

  const activeStatus = statuses.find((s) => s.id === activeId)

  return (
    <div className="max-w-xl">
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-base font-semibold text-foreground">Workflow</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Customise the stages issues move through in this project
        </p>
      </div>

      {/* Project selector + Add button */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger size="sm" className="w-52" aria-label="Select project">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="outline"
          disabled={!selectedProjectId || isSaving}
          onClick={() => setAddingStatus(true)}
          className="gap-1.5 shrink-0"
        >
          <Plus size={13} />
          Add status
        </Button>
      </div>

      {/* Content */}
      {!selectedProjectId ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Select a project to manage its workflow
        </p>
      ) : isLoading ? (
        <div className="space-y-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="space-y-1.5">
            {statuses.map((status) => (
              <StatusRow
                key={status.id}
                status={status}
                total={statuses.length}
                isSaving={isSaving}
                onRename={handleRename}
                onRecolor={handleRecolor}
                onDelete={handleDelete}
              />
            ))}

            {addingStatus && (
              <AddStatusRow
                isSaving={isSaving}
                onSave={async (name, color) => {
                  await handleCreate(name, color)
                  setAddingStatus(false)
                }}
                onCancel={() => setAddingStatus(false)}
              />
            )}
          </div>

          <DragOverlay>
            {activeStatus && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-brand-primary/60 bg-card shadow-lg opacity-90">
                <GripVertical size={14} className="text-muted-foreground/50" />
                <div
                  className="w-4 h-4 rounded-full border border-border/60 shrink-0"
                  style={{ backgroundColor: activeStatus.color }}
                />
                <span className="text-sm text-foreground">{activeStatus.name}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
