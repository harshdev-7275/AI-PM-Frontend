import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useChat } from '@/hooks/useChat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// =============================================================================
// CONSTANTS
// =============================================================================

const SUGGESTED = [
  'Show me all open issues',
  'Create a bug for the login page',
  "What's the sprint status?",
  'Who has the most issues assigned?',
] as const

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// =============================================================================
// LOADING DOTS
// =============================================================================

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )
}

// =============================================================================
// AI ASSISTANT PAGE
// =============================================================================

export default function AIAssistantPage() {
  const { projects } = useProjectStore()
  const { messages, isLoading, sendMessage, setProject, clearMessages } = useChat()

  const [input, setInput] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Set first project as default context on mount
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      const first = projects[0]!
      setSelectedProjectId(first.id)
      setProject(first.id)
    }
  }, [projects]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId)
    setProject(projectId)
    clearMessages()
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading || !selectedProjectId) return
    setInput('')
    await sendMessage(text)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const handleSuggestion = (text: string) => {
    setInput(text)
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  return (
    <div className="flex h-full overflow-hidden">

      {/* ------------------------------------------------------------------ */}
      {/* LEFT — Context panel                                                */}
      {/* ------------------------------------------------------------------ */}
      <aside className="w-[280px] shrink-0 flex flex-col gap-5 border-r border-border bg-sidebar p-4 overflow-y-auto">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Context
          </p>

          {/* Project selector */}
          <Select value={selectedProjectId} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-full h-8 text-sm">
              <SelectValue placeholder="Select a project…" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.color ?? 'var(--brand-primary)' }}
                    />
                    {p.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Active project indicator */}
          {selectedProject && (
            <div className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedProject.color ?? 'var(--brand-primary)' }}
              />
              <span className="text-xs text-foreground font-medium truncate">
                {selectedProject.name}
              </span>
            </div>
          )}

          <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
            AI has access to issues, sprints, and members in this project.
          </p>
        </div>

        {/* Suggested questions */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={12} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Suggested
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSuggestion(q)}
                className="text-left text-xs px-2.5 py-2 rounded-md border border-border bg-background hover:bg-muted/60 hover:border-brand-primary/40 transition-colors text-muted-foreground hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT — Chat area                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.length === 0 && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground select-none">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Bot size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm">Ask me anything about your project</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'user' ? (
                    // User bubble — right, purple
                    <div className="max-w-[70%] flex flex-col items-end gap-1">
                      <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-brand-primary text-white text-sm leading-relaxed">
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-muted-foreground px-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  ) : (
                    // Assistant card — left, surface
                    <div className="max-w-[70%] flex flex-col items-start gap-1">
                      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/60 border border-border text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(msg.timestamp)}
                        </span>
                        {msg.intent && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                            {msg.intent}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm bg-muted/60 border border-border">
                    <LoadingDots />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-background px-6 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about issues, sprints, members…"
                className="min-h-[44px] max-h-[120px] resize-none text-sm leading-relaxed"
                rows={1}
                disabled={isLoading || !selectedProjectId}
              />
            </div>
            <Button
              size="icon"
              onClick={() => void handleSend()}
              disabled={!input.trim() || isLoading || !selectedProjectId}
              className="h-[44px] w-[44px] shrink-0 bg-brand-primary hover:bg-brand-primary/90"
            >
              <Send size={16} />
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            AI can create issues, query sprint status, and more · Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>
    </div>
  )
}
