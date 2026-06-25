import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, ChevronDown, ChevronUp, Square, Sparkles, Paperclip, Globe, Lightbulb, FileText, BarChart2, Zap } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/store/useProjectStore'
import { useAuthStore } from '@/store/useAuthStore'
import { UserAvatar } from '@/components/UserAvatar'
import { streamChatMessage, type ToolCallRecord } from '@/services/aiService'

const ALL_PROJECTS = '__all__'
const MAX_HISTORY_TURNS = 20

// =============================================================================
// TYPES
// =============================================================================

interface ToolCallChip {
  id:      string
  tool:    string
  args:    Record<string, unknown>
  state:   'start' | 'end'
  preview: string | null
}

interface Message {
  id:         string
  role:       'user' | 'assistant'
  content:    string
  toolCalls?: ToolCallRecord[]
  model?:     string
  error?:     boolean
}

// =============================================================================
// SUGGESTION CARDS (shown in welcome state)
// =============================================================================

const SUGGESTIONS = [
  {
    icon:  BarChart2,
    title: 'Synthesize Data',
    desc:  'Turn my project data into key bullet points for the team.',
  },
  {
    icon:  Lightbulb,
    title: 'Sprint Overview',
    desc:  'Summarize the current sprint status and blockers.',
  },
  {
    icon:  Zap,
    title: 'Check Issues',
    desc:  'List all open high-priority issues across projects.',
  },
]

// =============================================================================
// GLOW ORB
// =============================================================================

function GlowOrb() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <div className="absolute -inset-6 rounded-full bg-purple-400/15 blur-3xl animate-pulse" />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 32%, #f3e8ff, #c084fc 40%, #9333ea 68%, #581c87)',
          boxShadow: '0 0 48px 12px rgba(168,85,247,0.35), inset 0 0 20px rgba(255,255,255,0.08)',
        }}
      />
      <div
        className="absolute top-3 left-5 w-10 h-6 rounded-full bg-white/50 blur-md"
        style={{ transform: 'rotate(-18deg)' }}
      />
      <div className="absolute top-5 left-6 w-4 h-3 rounded-full bg-white/70 blur-sm" />
    </div>
  )
}

// =============================================================================
// THINKING DOTS
// =============================================================================

const DOT_VARIANTS = {
  start:  { y: 0,    opacity: 0.4 },
  bounce: { y: -5,   opacity: 1   },
  end:    { y: 0,    opacity: 0.4 },
}

function ThinkingDots() {
  return (
    <motion.div
      className="flex items-center gap-1.5 py-0.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
          variants={DOT_VARIANTS}
          initial="start"
          animate={['bounce', 'end']}
          transition={{
            duration:   0.5,
            repeat:     Infinity,
            repeatType: 'loop',
            delay:      i * 0.15,
            ease:       'easeInOut',
          }}
        />
      ))}
    </motion.div>
  )
}

// =============================================================================
// TOOL CALLS DISCLOSURE
// =============================================================================

function ToolCallsDetail({ toolCalls }: { toolCalls: ToolCallRecord[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {toolCalls.length} tool call{toolCalls.length !== 1 ? 's' : ''}
      </button>
      {open && (
        <div className="mt-1.5 space-y-1">
          {toolCalls.map((tc, i) => (
            <div key={i} className="rounded bg-muted/60 px-2 py-1 font-mono text-[11px] text-muted-foreground">
              <span className="text-foreground font-medium">{tc.tool}</span>
              {Object.keys(tc.args).length > 0 && (
                <span className="ml-1 opacity-70">{JSON.stringify(tc.args)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MESSAGE BUBBLE
// =============================================================================

function MessageBubble({ msg, userName, userAvatarUrl, userSeed, streamingChips, isStreaming, statusText }: {
  msg:            Message
  userName:       string
  userAvatarUrl?: string | null
  userSeed?:      string
  streamingChips?: ToolCallChip[] | undefined
  isStreaming?:   boolean
  statusText?:    string | null
}) {
  const isUser    = msg.role === 'user'
  const showChips = !isUser && streamingChips && streamingChips.length > 0

  // Thinking state: no content yet, no chips, no status text → bouncing dots
  const showDots   = !isUser && isStreaming && !msg.content && !showChips && !statusText
  // Status label: "Thinking…" / "Analyzing results…" — disappears when content arrives
  const showStatus = !isUser && isStreaming && !!statusText && !msg.content

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {isUser ? (
          <UserAvatar name={userName} avatarUrl={userAvatarUrl} seed={userSeed} className="size-7" />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs bg-muted text-muted-foreground border border-border">
            <Bot size={14} />
          </div>
        )}
        <span className="text-xs font-semibold text-foreground">
          {isUser ? userName : 'Planiqo AI'}
        </span>
      </div>

      <div className="max-w-[75%] space-y-1 pl-9">
        <AnimatePresence mode="wait">
          {/* Thinking dots — before any content or chips arrive */}
          {showDots && (
            <ThinkingDots key="dots" />
          )}

          {/* Status text — "Thinking…" / "Analyzing results…" */}
          {showStatus && (
            <motion.p
              key="status"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              {statusText}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Message content */}
        {msg.content && (
          <div className={cn(
            'text-sm leading-relaxed whitespace-pre-wrap',
            msg.error ? 'text-destructive' : 'text-foreground',
          )}>
            {msg.content}
          </div>
        )}

        {/* Live tool chips during streaming */}
        {showChips && (
          <div className="flex flex-wrap gap-1">
            {streamingChips!.map(tc => (
              <span
                key={tc.id}
                data-testid="tool-chip"
                data-tool={tc.tool}
                data-state={tc.state}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-mono',
                  tc.state === 'start'
                    ? 'border-primary/40 bg-primary/5 text-primary animate-pulse'
                    : 'border-border bg-muted/60 text-muted-foreground',
                )}
                title={tc.preview ?? undefined}
              >
                {tc.tool}
                {Object.keys(tc.args).length > 0 && (
                  <span className="opacity-70">{JSON.stringify(tc.args)}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Completed tool call audit trail */}
        {msg.toolCalls && msg.toolCalls.length > 0 && !showChips && (
          <ToolCallsDetail toolCalls={msg.toolCalls} />
        )}
        {msg.model && (
          <p className="text-[10px] text-muted-foreground px-1">{msg.model}</p>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// CHAT PAGE
// =============================================================================

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: '' },
  ])
  const [input,         setInput]         = useState('')
  const [streaming,     setStreaming]     = useState(false)
  const [streamingChips, setStreamingChips] = useState<ToolCallChip[]>([])
  const [streamingAiId, setStreamingAiId] = useState<string | null>(null)
  const [statusText,    setStatusText]    = useState<string | null>(null)
  const [projectId,     setProjectId]     = useState<string>(ALL_PROJECTS)

  const projects      = useProjectStore(s => s.projects)
  const userName      = useAuthStore(s => s.user?.name ?? 'You')
  const userAvatarUrl = useAuthStore(s => s.user?.avatarUrl ?? null)
  const userSeed      = useAuthStore(s => s.user?.id ?? 'you')
  const firstName     = userName.split(' ')[0]

  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef    = useRef<AbortController | null>(null)

  const isWelcomeState = messages.length === 1 && messages[0].id === 'welcome'

  const handleProjectChange = (newId: string) => {
    if (newId === projectId) return
    setProjectId(newId)
    setMessages([{ id: 'welcome', role: 'assistant', content: '' }])
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingChips])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || streaming) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    const aiMsgId = `${Date.now()}-ai`
    const aiMsg: Message   = { id: aiMsgId, role: 'assistant', content: '' }
    setMessages(prev => [...prev, userMsg, aiMsg])
    setInput('')
    setStreaming(true)
    setStreamingChips([])
    setStreamingAiId(aiMsgId)
    setStatusText(null)

    const ac = new AbortController()
    abortRef.current = ac

    const scoped  = projectId === ALL_PROJECTS ? undefined : projectId
    const history = messages
      .filter(m => m.id !== 'welcome' && !m.error)
      .slice(-MAX_HISTORY_TURNS)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      await streamChatMessage(text, scoped, history, {
        onStatus: (msg) => {
          setStatusText(msg)
        },
        onToken: (delta) => {
          setStatusText(null)
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: m.content + delta } : m))
        },
        onToolStart: (tool, id, args) => {
          setStreamingChips(prev => [...prev, { id, tool, args, state: 'start', preview: null }])
        },
        onToolEnd: (id, preview) => {
          setStreamingChips(prev => prev.map(c => c.id === id ? { ...c, state: 'end', preview } : c))
        },
        onDone: (message, toolCalls, model, _steps) => {
          setStatusText(null)
          setMessages(prev => prev.map(m => m.id === aiMsgId
            ? { ...m, content: message || m.content, toolCalls, model }
            : m,
          ))
        },
        onError: (code, message) => {
          setStatusText(null)
          setMessages(prev => prev.map(m => m.id === aiMsgId
            ? { ...m, content: message || code, error: true }
            : m,
          ))
        },
      }, { signal: ac.signal })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setMessages(prev => prev.map(m => m.id === aiMsgId
          ? { ...m, content: m.content ? `${m.content}\n\n_(cancelled)_` : '_(cancelled)_' }
          : m,
        ))
      } else {
        setMessages(prev => prev.map(m => m.id === aiMsgId
          ? { ...m, content: err instanceof Error ? err.message : 'Something went wrong. Try again.', error: true }
          : m,
        ))
      }
    } finally {
      setStreaming(false)
      setStreamingChips([])
      setStreamingAiId(null)
      setStatusText(null)
      abortRef.current = null
      textareaRef.current?.focus()
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  const visibleChips = streamingAiId ? streamingChips : []

  // Shared input card rendered in both welcome and active states
  const inputCard = (
    <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask about anything — projects, issues, or team…"
        rows={isWelcomeState ? 2 : 1}
        className="border-0 shadow-none resize-none bg-transparent focus-visible:ring-0 focus-visible:outline-none min-h-[52px] max-h-[120px] px-4 pt-3 pb-1 text-sm"
        disabled={streaming}
        autoFocus
      />

      {/* Action row */}
      <div className="flex items-center justify-between px-3 py-2">
        {/* Left: project chip + icon buttons */}
        <div className="flex items-center gap-1">
          <Select value={projectId} onValueChange={handleProjectChange} disabled={streaming}>
            <SelectTrigger
              aria-label="Project context"
              className="h-7 gap-1.5 rounded-full border-border/60 bg-muted/40 hover:bg-muted/70 px-2.5 text-[11px] w-auto min-w-0 transition-colors"
            >
              <Sparkles size={10} className="text-purple-500 shrink-0" />
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PROJECTS}>All projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            className="flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Attach document"
          >
            <FileText size={13} />
          </button>
          <button
            type="button"
            className="flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Suggestions"
          >
            <Lightbulb size={13} />
          </button>
        </div>

        {/* Right: globe + send/cancel */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Language"
          >
            <Globe size={13} />
          </button>

          {streaming ? (
            <button
              type="button"
              aria-label="Cancel"
              onClick={cancel}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              <Square size={13} />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Send"
              onClick={() => void send()}
              disabled={!input.trim()}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <Send size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Saved prompts / attach file row */}
      <div className="border-t border-border/60 flex items-center justify-between px-3 py-1.5">
        <button
          type="button"
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sparkles size={11} className="text-purple-500" />
          Saved prompts
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Paperclip size={11} />
          Attach file
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-6 py-3 shrink-0">
        <Bot size={18} className="text-primary" />
        <h1 className="text-sm font-semibold">Planiqo Assistant</h1>
        <span className="ml-auto text-[11px] text-muted-foreground">Beta</span>
      </div>

      {isWelcomeState ? (
        /* ── Welcome / empty state ─────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 overflow-y-auto">
          <GlowOrb />
          <p className="text-2xl font-semibold text-purple-500 mb-1">
            Hello, {firstName}!
          </p>
          <p className="text-xl font-bold text-foreground mb-8">
            How can I assist you today?
          </p>

          <div className="w-full max-w-2xl space-y-4">
            {inputCard}

            {/* Suggestion cards */}
            <div className="grid grid-cols-3 gap-3">
              {SUGGESTIONS.map(s => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => {
                    setInput(s.desc)
                    textareaRef.current?.focus()
                  }}
                  className="text-left rounded-xl border border-border bg-background p-4 hover:bg-muted/50 transition-colors"
                >
                  <s.icon size={18} className="text-muted-foreground mb-2.5" />
                  <p className="text-sm font-semibold text-foreground mb-0.5">{s.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── Active chat state ─────────────────────────────────────── */
        <>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages
              .filter(m => m.id !== 'welcome')
              .map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  userName={userName}
                  userAvatarUrl={userAvatarUrl}
                  userSeed={userSeed}
                  streamingChips={msg.id === streamingAiId ? visibleChips : undefined}
                  isStreaming={msg.id === streamingAiId}
                  statusText={msg.id === streamingAiId ? statusText : null}
                />
              ))}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 px-6 py-3">
            {inputCard}
          </div>
        </>
      )}
    </div>
  )
}
