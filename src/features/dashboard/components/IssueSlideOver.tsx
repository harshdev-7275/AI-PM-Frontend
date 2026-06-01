import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronDown } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useIssueDetail } from '@/hooks/useIssueDetail'
import { useIssueStore } from '@/store/useIssueStore'
import { useProjectStore } from '@/store/useProjectStore'
import { ActivityFeed } from './ActivityFeed'
import type { IssuePriority, IssueType, ProjectMember } from '@/types'

// =============================================================================
// CONSTANTS
// =============================================================================

const PRIORITY_OPTIONS: { value: IssuePriority; label: string; dot: string }[] = [
  { value: 'critical', label: 'Critical', dot: 'bg-red-500'   },
  { value: 'high',     label: 'High',     dot: 'bg-amber-400' },
  { value: 'medium',   label: 'Medium',   dot: 'bg-blue-400'  },
  { value: 'low',      label: 'Low',      dot: 'bg-gray-400'  },
]

const TYPE_LABEL: Record<IssueType, string> = {
  epic: 'Epic', story: 'Story', task: 'Task',
  bug: 'Bug', feature: 'Feature', subtask: 'Subtask',
}

// =============================================================================
// HELPERS
// =============================================================================

const initials = (name: string) =>
  name.trim().split(/\s+/).map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// const timeAgo = (iso: string) => {
//   const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
//   if (m < 1)  return 'just now'
//   if (m < 60) return `${m}m ago`
//   const h = Math.floor(m / 60)
//   if (h < 24) return `${h}h ago`
//   return `${Math.floor(h / 24)}d ago`
// }

// =============================================================================
// SMALL SHARED PIECES
// =============================================================================

function Avatar({ name, url }: { name: string; url?: string | null }) {
  return url ? (
    <img src={url} alt={name} className="w-6 h-6 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-white text-[9px] font-semibold shrink-0">
      {initials(name)}
    </div>
  )
}

function Bone({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      {children}
    </div>
  )
}

// =============================================================================
// STATUS DROPDOWN
// =============================================================================

function StatusDropdown({
  statusId,
  onSelect,
}: {
  statusId: string
  onSelect: (id: string) => void
}) {
  const statuses    = useIssueStore((s) => s.statuses)
  const current     = statuses.find((s) => s.id === statusId)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border text-xs font-medium text-foreground bg-background hover:bg-muted transition-colors"
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: current?.color ?? '#888' }} />
        {current?.name ?? 'Status'}
        <ChevronDown size={11} className="text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-10 min-w-[140px] bg-popover border border-border rounded-lg shadow-lg py-1 overflow-hidden">
          {statuses.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => { onSelect(s.id); setOpen(false) }}
              className={[
                'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors',
                s.id === statusId
                  ? 'bg-brand-primary/10 text-brand-primary font-medium'
                  : 'text-foreground hover:bg-muted',
              ].join(' ')}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// ASSIGNEE DROPDOWN
// =============================================================================

function AssigneeDropdown({
  assigneeId,
  assignee,
  members,
  onSelect,
}: {
  assigneeId: string | null
  assignee:   { id: string; name: string; avatarUrl?: string | null } | null
  members:    ProjectMember[]
  onSelect:   (userId: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-2 py-1 rounded-md hover:bg-muted transition-colors text-left"
      >
        {assignee ? (
          <>
            <Avatar name={assignee.name} url={assignee.avatarUrl ?? null} />
            <span className="text-sm text-foreground truncate">{assignee.name}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground/60 italic">Unassigned</span>
        )}
        <ChevronDown size={11} className="text-muted-foreground ml-auto shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-10 min-w-[180px] bg-popover border border-border rounded-lg shadow-lg py-1 overflow-hidden">
          <button
            type="button"
            onClick={() => { onSelect(null); setOpen(false) }}
            className={[
              'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors',
              assigneeId === null
                ? 'bg-brand-primary/10 text-brand-primary font-medium'
                : 'text-muted-foreground hover:bg-muted',
            ].join(' ')}
          >
            <span className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[9px] text-muted-foreground shrink-0">–</span>
            Unassigned
          </button>

          {members.map((m) => (
            <button
              key={m.userId}
              type="button"
              onClick={() => { onSelect(m.userId); setOpen(false) }}
              className={[
                'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors',
                assigneeId === m.userId
                  ? 'bg-brand-primary/10 text-brand-primary font-medium'
                  : 'text-foreground hover:bg-muted',
              ].join(' ')}
            >
              <Avatar name={m.name} url={m.avatarUrl} />
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// INLINE TITLE
// =============================================================================

function InlineTitle({
  value,
  isSaving,
  onSave,
}: {
  value: string
  isSaving: boolean
  onSave: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const commit = () => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onSave(trimmed)
    else setDraft(value)
  }

  return editing ? (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(value) } }}
        className="flex-1 text-lg font-semibold bg-transparent border-b border-brand-primary/60 text-foreground focus:outline-none pb-0.5"
      />
      {isSaving && <span className="text-[10px] text-muted-foreground shrink-0">Saving…</span>}
    </div>
  ) : (
    <h2
      onClick={() => setEditing(true)}
      className="text-lg font-semibold text-foreground cursor-text hover:bg-muted/50 rounded px-1 -mx-1 py-0.5 transition-colors"
    >
      {value}
    </h2>
  )
}

// =============================================================================
// INLINE DESCRIPTION
// =============================================================================

function InlineDescription({
  value,
  isSaving,
  onSave,
}: {
  value: string | null
  isSaving: boolean
  onSave: (v: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value ?? '')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(value ?? '') }, [value])
  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.selectionStart = ref.current.value.length } }, [editing])

  const commit = () => {
    setEditing(false)
    const trimmed = draft.trim() || null
    if (trimmed !== value) onSave(trimmed)
  }

  return editing ? (
    <div className="flex flex-col gap-1.5">
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Escape') { setEditing(false); setDraft(value ?? '') } }}
        rows={4}
        className="w-full resize-none rounded-md border border-brand-primary/40 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary/40 transition-colors"
      />
      {isSaving && <span className="text-[10px] text-muted-foreground">Saving…</span>}
    </div>
  ) : (
    <p
      onClick={() => setEditing(true)}
      className={[
        'text-sm rounded px-1 -mx-1 py-1 cursor-text hover:bg-muted/50 transition-colors whitespace-pre-wrap min-h-[2rem]',
        value ? 'text-foreground' : 'text-muted-foreground/60 italic',
      ].join(' ')}
    >
      {value ?? 'Add a description…'}
    </p>
  )
}

// =============================================================================
// COMMENT BOX
// =============================================================================

function CommentBox({ onSubmit }: { onSubmit: (body: string) => Promise<void> }) {
  const [body,        setBody]        = useState('')
  const [submitting, setSubmitting]   = useState(false)

  const submit = async () => {
    const trimmed = body.trim()
    if (!trimmed) return
    setSubmitting(true)
    try { await onSubmit(trimmed); setBody('') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit() }}
        placeholder="Add a comment… (⌘↵ to submit)"
        rows={3}
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-brand-primary/40 focus:border-brand-primary/50 transition-colors"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!body.trim() || submitting}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-brand-primary hover:bg-brand-primary-hover text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function SlideOverSkeleton() {
  return (
    <div className="flex gap-6 p-6 h-full">
      <div className="flex flex-col gap-4 flex-[2]">
        <Bone className="h-6 w-3/4" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
        <Bone className="h-4 w-2/3" />
        <div className="mt-4 flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2.5">
              <Bone className="w-6 h-6 rounded-full shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Bone className="h-3 w-24" />
                <Bone className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-5 w-44 shrink-0">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Bone className="h-2.5 w-16" />
            <Bone className="h-7 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface IssueSlideOverProps {
  issueId:   string
  isOpen:    boolean
  onClose:   () => void
}

export function IssueSlideOver({ issueId, isOpen, onClose }: IssueSlideOverProps) {
  const { slug, projectId } = useParams<{ slug: string; projectId: string }>()
  const currentProject      = useProjectStore((s) => s.currentProject)

  const statuses = useIssueStore((s) => s.statuses)

  const {
    issue, comments, history, members, isLoading, isSaving,
    loadIssue, handleUpdateField, handleUpdateStatus, handleAddComment,
  } = useIssueDetail(slug!, projectId!)

  // Load when the slide-over opens or the issueId changes
  useEffect(() => {
    if (isOpen && issueId) void loadIssue(issueId)
  }, [issueId, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const priorityOpt = PRIORITY_OPTIONS.find((p) => p.value === issue?.priority)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative z-10 flex flex-col w-[62vw] min-w-[580px] max-w-[960px] h-full bg-background border-l border-border shadow-2xl overflow-hidden"
          >
            {/* ---------------------------------------------------------------- */}
            {/* Header                                                            */}
            {/* ---------------------------------------------------------------- */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">
              {/* Issue ref + type badge */}
              <div className="flex items-center gap-2 mr-auto">
                <span className="text-xs font-mono text-muted-foreground">
                  {currentProject?.key ?? '…'}-{issue?.number ?? '…'}
                </span>
                {issue && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {TYPE_LABEL[issue.type as IssueType] ?? issue.type}
                  </span>
                )}
              </div>

              {/* Status dropdown */}
              {issue && (
                <StatusDropdown
                  statusId={issue.statusId}
                  onSelect={(id) => void handleUpdateStatus(id)}
                />
              )}

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="ml-2 w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Body                                                              */}
            {/* ---------------------------------------------------------------- */}
            {isLoading || !issue ? (
              <SlideOverSkeleton />
            ) : (
              <div className="flex flex-1 overflow-hidden">
                {/* Left panel — main content */}
                <div className="flex flex-col gap-6 flex-[2] overflow-y-auto px-6 py-5 min-w-0">
                  {/* Title */}
                  <InlineTitle
                    value={issue.title}
                    isSaving={isSaving}
                    onSave={(v) => void handleUpdateField('title', v)}
                  />

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</span>
                    <InlineDescription
                      value={issue.description}
                      isSaving={isSaving}
                      onSave={(v) => void handleUpdateField('description', v)}
                    />
                  </div>

                  {/* Activity — comments + history interleaved */}
                  <div className="flex flex-col gap-4">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Activity
                      {(comments.length + history.length) > 0 && (
                        <span className="ml-1.5 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                          {comments.length + history.length}
                        </span>
                      )}
                    </span>

                    <ActivityFeed
                      comments={comments}
                      history={history}
                      statuses={statuses}
                    />

                    <CommentBox onSubmit={(body) => handleAddComment(body)} />
                  </div>
                </div>

                {/* Right panel — metadata */}
                <div className="flex flex-col gap-5 w-52 shrink-0 border-l border-border overflow-y-auto px-4 py-5 bg-muted/20">
                  {/* Assignee */}
                  <MetaRow label="Assignee">
                    <AssigneeDropdown
                      assigneeId={issue.assigneeId}
                      assignee={issue.assignee}
                      members={members}
                      onSelect={(userId) => void handleUpdateField('assigneeId', userId)}
                    />
                  </MetaRow>

                  {/* Reporter */}
                  <MetaRow label="Reporter">
                    <div className="flex items-center gap-2">
                      <Avatar name={issue.reporter.name} url={issue.reporter.avatarUrl} />
                      <span className="text-sm text-foreground truncate">{issue.reporter.name}</span>
                    </div>
                  </MetaRow>

                  {/* Priority */}
                  <MetaRow label="Priority">
                    <select
                      value={issue.priority}
                      onChange={(e) => void handleUpdateField('priority', e.target.value as IssuePriority)}
                      className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary/40 transition-colors"
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    {priorityOpt && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${priorityOpt.dot}`} />
                        <span className="text-[11px] text-muted-foreground">{priorityOpt.label}</span>
                      </div>
                    )}
                  </MetaRow>

                  {/* Due date */}
                  <MetaRow label="Due date">
                    <input
                      type="date"
                      value={issue.dueDate ? issue.dueDate.slice(0, 10) : ''}
                      onChange={(e) => void handleUpdateField('dueDate', e.target.value || null)}
                      className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary/40 transition-colors"
                    />
                  </MetaRow>

                  {/* Created */}
                  <MetaRow label="Created">
                    <span className="text-sm text-muted-foreground">{fmtDate(issue.createdAt)}</span>
                  </MetaRow>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
