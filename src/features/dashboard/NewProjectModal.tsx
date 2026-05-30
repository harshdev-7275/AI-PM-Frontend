import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProject } from '@/hooks/useProject'

// =============================================================================
// CONSTANTS
// =============================================================================

const PRESET_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
]

// Generates a key from the project name: first letter of each word, uppercase, max 6 chars.
// "Website Revamp" → "WR", "Acme Corp API" → "ACA"
const generateKey = (name: string): string => {
  const key = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 6)
  return key || ''
}

// =============================================================================
// COMPONENT
// =============================================================================

interface NewProjectModalProps {
  isOpen:  boolean
  onClose: () => void
}

export default function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const { slug }        = useParams<{ slug: string }>()
  const navigate        = useNavigate()
  const { createProject } = useProject()

  const [name,              setName]              = useState('')
  const [key,               setKey]               = useState('')
  const [keyEdited,         setKeyEdited]         = useState(false)
  const [description,       setDescription]       = useState('')
  const [selectedColor,     setSelectedColor]     = useState(PRESET_COLORS[0] ?? '#6366f1')
  const [isSubmitting,      setIsSubmitting]      = useState(false)

  // Auto-generate key from name unless the user has manually edited it
  useEffect(() => {
    if (!keyEdited) setKey(generateKey(name))
  }, [name, keyEdited])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setKey('')
      setKeyEdited(false)
      setDescription('')
      setSelectedColor(PRESET_COLORS[0] ?? '#6366f1')
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleKeyChange = (val: string) => {
    setKey(val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
    setKeyEdited(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug || !name.trim() || !key.trim()) return

    setIsSubmitting(true)
    try {
      const project = await createProject(
        slug,
        name.trim(),
        key.trim(),
        description.trim() || undefined,
        undefined,
        selectedColor,
      )
      toast.success(`Project "${project.name}" created`)
      onClose()
      navigate(`/${slug}/projects/${project.id}/board`)
    } catch {
      toast.error('Failed to create project. The key may already be taken.')
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
          <h2 className="text-sm font-semibold text-foreground">New project</h2>
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
          {/* Project name */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Project name</Label>
            <Input
              placeholder="e.g. Website Revamp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="h-8 text-sm"
            />
          </div>

          {/* Project key */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Project key
              <span className="ml-1 text-muted-foreground/60 font-normal">· used as issue prefix (WEB-1)</span>
            </Label>
            <Input
              placeholder="WEB"
              value={key}
              onChange={(e) => handleKeyChange(e.target.value)}
              required
              maxLength={6}
              className="h-8 text-sm font-mono uppercase"
            />
          </div>

          {/* Color picker */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Color</Label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none"
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {selectedColor === color && (
                    <span className="flex items-center justify-center h-full">
                      <svg viewBox="0 0 12 12" className="w-3 h-3 text-white fill-current">
                        <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Description
              <span className="ml-1 text-muted-foreground/60 font-normal">· optional</span>
            </Label>
            <textarea
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary/40 focus:border-brand-primary/50 transition-colors"
            />
          </div>

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
              disabled={isSubmitting || !name.trim() || !key.trim()}
              className="h-8 px-3 text-sm bg-brand-primary hover:bg-brand-primary-hover text-white border-0"
            >
              {isSubmitting ? 'Creating…' : 'Create project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
