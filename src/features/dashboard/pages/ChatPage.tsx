import { useState, useRef, useEffect } from 'react'
import { Bot, Send, User, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { sendChatMessage, type ToolCallRecord } from '@/services/aiService'

// Sentinel for "no project" — Radix Select forbids empty-string item values.
const ALL_PROJECTS = '__all__'

// How many prior turns to replay for multi-turn context. Bounds payload size;
// the backend caps again on its side.
const MAX_HISTORY_TURNS = 20

// =============================================================================
// TYPES
// =============================================================================

interface Message {
  id:         string
  role:       'user' | 'assistant'
  content:    string
  toolCalls?: ToolCallRecord[]
  model?:     string
  error?:     boolean
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

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs',
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground border border-border',
      )}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[75%] space-y-1', isUser && 'items-end flex flex-col')}>
        <div className={cn(
          'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : msg.error
              ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm'
              : 'bg-muted text-foreground rounded-tl-sm',
        )}>
          {msg.content}
        </div>
        {msg.toolCalls && msg.toolCalls.length > 0 && (
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
    {
      id:      'welcome',
      role:    'assistant',
      content: 'Hi! I\'m Planiqo Assistant. Ask me about your projects, issues, or team members.',
    },
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [projectId, setProjectId] = useState<string>(ALL_PROJECTS)
  const projects = useProjectStore(s => s.projects)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleProjectChange = (newId: string) => {
    if (newId === projectId) return
    setProjectId(newId)
    const label = newId === ALL_PROJECTS
      ? 'All projects'
      : projects.find(p => p.id === newId)?.name ?? 'selected project'
    setMessages([
      {
        id:      'welcome',
        role:    'assistant',
        content: `Switched to **${label}**. How can I help?`,
      },
    ])
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const scoped = projectId === ALL_PROJECTS ? undefined : projectId
      // Replay prior turns (excluding the welcome message and error bubbles) so
      // the agent can resolve references like "from TP". `messages` here is the
      // pre-update array — it holds the conversation before this user turn.
      const history = messages
        .filter(m => m.id !== 'welcome' && !m.error)
        .slice(-MAX_HISTORY_TURNS)
        .map(m => ({ role: m.role, content: m.content }))
      const res = await sendChatMessage(text, scoped, history)
      setMessages(prev => [...prev, {
        id:        `${Date.now()}-ai`,
        role:      'assistant',
        content:   res.message,
        toolCalls: res.tool_calls,
        model:     res.model,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        id:      `${Date.now()}-err`,
        role:    'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong. Try again.',
        error:   true,
      }])
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-6 py-3 shrink-0">
        <Bot size={18} className="text-primary" />
        <h1 className="text-sm font-semibold">Planiqo Assistant</h1>
        <span className="ml-auto text-[11px] text-muted-foreground">Beta</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-muted-foreground">
              <Bot size={14} />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border px-6 py-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about projects, issues, or team…"
            rows={1}
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            disabled={loading}
            autoFocus
          />
          <Select value={projectId} onValueChange={handleProjectChange} disabled={loading}>
            <SelectTrigger
              aria-label="Project context"
              className="h-10 w-40 shrink-0 text-sm"
            >
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PROJECTS}>All projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            aria-label="Send"
            onClick={() => void send()}
            disabled={!input.trim() || loading}
            className="shrink-0 h-10 w-10"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Enter to send · Shift+Enter for new line
          {projectId !== ALL_PROJECTS && ' · scoped to selected project'}
        </p>
      </div>
    </div>
  )
}
