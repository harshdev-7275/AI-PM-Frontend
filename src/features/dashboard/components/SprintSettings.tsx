import { useState, useEffect } from 'react'
import { ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Project, CadenceType } from '@/types'

// =============================================================================
// CONSTANTS
// =============================================================================

const CADENCE_OPTIONS: { value: Exclude<CadenceType, 'none'>; label: string; days: number }[] = [
  { value: 'weekly',   label: 'Weekly (7 days)',    days: 7  },
  { value: 'biweekly', label: 'Biweekly (14 days)', days: 14 },
  { value: 'monthly',  label: 'Monthly (30 days)',  days: 30 },
]

const DAY_OPTIONS = [
  { value: '1', label: 'Monday'    },
  { value: '2', label: 'Tuesday'   },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday'  },
  { value: '5', label: 'Friday'    },
  { value: '6', label: 'Saturday'  },
  { value: '0', label: 'Sunday'    },
]

// =============================================================================
// SPRINT SETTINGS
// =============================================================================

interface SprintSettingsProps {
  project:     Project
  sprintCount: number
  onSave:      (input: {
    cadenceType:       CadenceType
    cadenceStartDay:   number | null
    cadenceDuration:   number | null
    cadenceAutoCreate: boolean
    cadenceNaming:     string | null
  }) => Promise<void>
}

export function SprintSettings({ project, sprintCount, onSave }: SprintSettingsProps) {
  const [expanded,   setExpanded]   = useState(false)
  const [autoCreate, setAutoCreate] = useState(project.cadenceAutoCreate)
  const [cadence,    setCadence]    = useState<Exclude<CadenceType, 'none'>>(
    project.cadenceType === 'none' ? 'weekly' : project.cadenceType
  )
  const [startDay,   setStartDay]   = useState(String(project.cadenceStartDay ?? 5))
  const [naming,     setNaming]     = useState(project.cadenceNaming ?? 'Sprint {n}')
  const [isSaving,   setIsSaving]   = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setAutoCreate(project.cadenceAutoCreate)
    setCadence(project.cadenceType === 'none' ? 'weekly' : project.cadenceType)
    setStartDay(String(project.cadenceStartDay ?? 5))
    setNaming(project.cadenceNaming ?? 'Sprint {n}')
  }, [project.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const previewName = naming
    .replace('{n}', String(sprintCount + 1))
    .replace('{date}', new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const duration = CADENCE_OPTIONS.find((c) => c.value === cadence)?.days ?? 7
      await onSave({
        cadenceType:       autoCreate ? cadence : 'none',
        cadenceStartDay:   autoCreate ? Number(startDay) : null,
        cadenceDuration:   autoCreate ? duration : null,
        cadenceAutoCreate: autoCreate,
        cadenceNaming:     naming.trim() || null,
      })
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
        {project.cadenceAutoCreate && (
          <Badge className="h-4 px-1.5 text-[10px] rounded bg-blue-500/15 text-blue-500 shrink-0">
            Auto-create on
          </Badge>
        )}
      </button>

      {/* Expanded form */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 flex flex-col gap-5">

          {/* Auto-create row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">Auto-create next sprint</p>
              <p className="text-[11px] text-muted-foreground">
                Automatically create the next sprint when you complete the current one
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

          {/* Cadence fields — disabled when auto-create is off */}
          <div className={`flex flex-col gap-4 transition-opacity ${autoCreate ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

            {/* Cadence + Start day */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Cadence</Label>
                <Select value={cadence} onValueChange={(v) => setCadence(v as Exclude<CadenceType, 'none'>)}>
                  <SelectTrigger className="h-8 text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CADENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Start day</Label>
                <Select value={startDay} onValueChange={setStartDay}>
                  <SelectTrigger className="h-8 text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_OPTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Naming pattern */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Naming pattern
                <span className="ml-1 font-normal text-muted-foreground/60">
                  · {'{n}'} = number &nbsp;{'{date}'} = start date
                </span>
              </Label>
              <Input
                value={naming}
                onChange={(e) => setNaming(e.target.value)}
                placeholder="Sprint {n}"
                className="h-8 text-sm"
              />
              {naming.trim() && (
                <p className="text-[11px] text-muted-foreground">
                  Next sprint: <span className="font-medium text-foreground">{previewName}</span>
                </p>
              )}
            </div>
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
