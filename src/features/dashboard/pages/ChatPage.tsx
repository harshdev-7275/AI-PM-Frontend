import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, ChevronDown, ChevronUp, Square } from 'lucide-react'
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
import { useAuthStore } from '@/store/useAuthStore'
import { UserAvatar } from '@/components/UserAvatar'
import { streamChatMessage, type ToolCallRecord } from '@/services/aiService'

// Sentinel for "no project" — Radix Select forbids empty-string item values.
const ALL_PROJECTS = '__all__'

// How many prior turns to replay for multi-turn context. Bounds payload size;
// the backend caps again on its side.
const MAX_HISTORY_TURNS = 20

// =============================================================================
// TYPES
// =============================================================================

interface ToolCallChip {
  id:    string
  tool:  string
  args:  Record<string, unknown>
  state: 'start' | 'end'
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

function MessageBubble({ msg, userName, userAvatarUrl, userSeed, streamingChips }: {
  msg: Message
  userName: string
  userAvatarUrl?: string | null
  userSeed?: string
  streamingChips?: ToolCallChip[] | undefined
}) {
  const isUser = msg.role === 'user'
  const showChips = !isUser && streamingChips && streamingChips.length > 0
  return (
    <div className="space-y-1.5">
      {/* Name + icon header */}
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

      {/* Content (aligned under the name) */}
      <div className="max-w-[75%] space-y-1 pl-9">
        <div className={cn(
          'text-sm leading-relaxed whitespace-pre-wrap',
          msg.error ? 'text-destructive' : 'text-foreground',
        )}>
          {msg.content}
        </div>
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
    {
      id:      'welcome',
      role:    'assistant',
      content: 'Hi! I\'m Planiqo Assistant. Ask me about your projects, issues, or team members.',
    },
  ])
  const [input,   setInput]   = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingChips, setStreamingChips] = useState<ToolCallChip[]>([])
  const [streamingAiId, setStreamingAiId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string>(ALL_PROJECTS)
  const projects = useProjectStore(s => s.projects)
  const userName = useAuthStore(s => s.user?.name ?? 'You')
  const userAvatarUrl = useAuthStore(s => s.user?.avatarUrl ?? null)
  const userSeed = useAuthStore(s => s.user?.id ?? 'you')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

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
  }, [messages, streamingChips])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const send = async () => {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    const aiMsgId = `${Date.now()}-ai`
    const aiMsg: Message = { id: aiMsgId, role: 'assistant', content: '' }
    setMessages(prev => [...prev, userMsg, aiMsg])
    setInput('')
    setStreaming(true)
    setStreamingChips([])
    setStreamingAiId(aiMsgId)

    const ac = new AbortController()
    abortRef.current = ac

    const scoped = projectId === ALL_PROJECTS ? undefined : projectId
    const history = messages
      .filter(m => m.id !== 'welcome' && !m.error)
      .slice(-MAX_HISTORY_TURNS)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      await streamChatMessage(text, scoped, history, {
        onToken: (delta) => {
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: m.content + delta } : m))
        },
        onToolStart: (tool, id, args) => {
          setStreamingChips(prev => [...prev, { id, tool, args, state: 'start', preview: null }])
        },
        onToolEnd: (id, preview) => {
          setStreamingChips(prev => prev.map(c => c.id === id ? { ...c, state: 'end', preview } : c))
        },
        onDone: (message, toolCalls, model, _steps) => {
          setMessages(prev => prev.map(m => m.id === aiMsgId
            ? { ...m, content: message || m.content, toolCalls, model }
            : m,
          ))
        },
        onError: (code, message) => {
          setMessages(prev => prev.map(m => m.id === aiMsgId
            ? { ...m, content: message || code, error: true }
            : m,
          ))
        },
      }, { signal: ac.signal })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled — keep whatever content was streamed so far.
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
          <MessageBubble
            key={msg.id}
            msg={msg}
            userName={userName}
            userAvatarUrl={userAvatarUrl}
            userSeed={userSeed}
            streamingChips={msg.id === streamingAiId ? visibleChips : undefined}
          />
        ))}
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
            disabled={streaming}
            autoFocus
          />
          <Select value={projectId} onValueChange={handleProjectChange} disabled={streaming}>
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
          {streaming ? (
            <Button
              size="icon"
              aria-label="Cancel"
              onClick={cancel}
              variant="destructive"
              className="shrink-0 h-10 w-10"
            >
              <Square size={14} />
            </Button>
          ) : (
            <Button
              size="icon"
              aria-label="Send"
              onClick={() => void send()}
              disabled={!input.trim()}
              className="shrink-0 h-10 w-10"
            >
              <Send size={16} />
            </Button>
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Enter to send · Shift+Enter for new line
          {projectId !== ALL_PROJECTS && ' · scoped to selected project'}
        </p>
      </div>
    </div>
  )
}
