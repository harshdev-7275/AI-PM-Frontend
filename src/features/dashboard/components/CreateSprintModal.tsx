import { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Sprint } from '@/types'

// =============================================================================
// SUB-COMPONENT — DatePickerField
// =============================================================================

interface DatePickerFieldProps {
  label:       string
  value:       string                // yyyy-MM-dd or ''
  onChange:    (iso: string) => void // empty string when cleared
  placeholder?: string
  disabled?:   (date: Date) => boolean
}

function DatePickerField({ label, value, onChange, placeholder = 'Pick a date', disabled }: DatePickerFieldProps) {
  // Treat the yyyy-MM-dd value as a local-time date so the calendar doesn't shift
  // by a day when the user is east of UTC.
  const selected = value ? new Date(`${value}T00:00:00`) : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'h-8 px-2.5 text-sm font-normal justify-start gap-2',
              !value && 'text-muted-foreground',
            )}
          >
            <CalendarIcon size={14} className="text-muted-foreground" />
            {value ? format(selected!, 'PP') : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : '')}
            disabled={disabled}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// =============================================================================
// CREATE SPRINT MODAL
// =============================================================================

interface CreateSprintModalProps {
  isOpen:   boolean
  onClose:  () => void
  onSubmit: (name: string, goal?: string, startDate?: string, endDate?: string) => Promise<Sprint>
}

export function CreateSprintModal({ isOpen, onClose, onSubmit }: CreateSprintModalProps) {
  const [name,         setName]         = useState('')
  const [goal,         setGoal]         = useState('')
  const [startDate,    setStartDate]    = useState('')
  const [endDate,      setEndDate]      = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setName('')
      setGoal('')
      setStartDate('')
      setEndDate('')
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit(
        name.trim(),
        goal.trim() || undefined,
        startDate  || undefined,
        endDate    || undefined,
      )
      onClose()
    } catch {
      setError('Failed to create sprint. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-background border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">New sprint</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              placeholder="Sprint 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="h-8 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Goal <span className="text-muted-foreground/60 font-normal">· optional</span>
            </Label>
            <textarea
              placeholder="What do you want to achieve?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary/40 focus:border-brand-primary/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DatePickerField
              label="Start date"
              value={startDate}
              onChange={setStartDate}
            />
            <DatePickerField
              label="End date"
              value={endDate}
              onChange={setEndDate}
              disabled={(d) => !!startDate && d < new Date(`${startDate}T00:00:00`)}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="h-8 px-3 text-sm">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="h-8 px-3 text-sm bg-brand-primary hover:bg-brand-primary-hover text-white border-0"
            >
              {isSubmitting ? 'Creating…' : 'Create sprint'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
