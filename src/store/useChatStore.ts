import { create } from 'zustand'

/** Lifecycle of an assistant turn, mirrored from the AI service /chat status. */
export type ChatStatus =
  | 'awaiting_confirmation'
  | 'executed'
  | 'cancelled'
  | 'quota_exceeded'
  | 'validation_failed'
  /** AI needs more info from the user to proceed (e.g. a missing issue title). */
  | 'needs_input'

export interface ChatMessage {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  intent?:   string
  status?:   ChatStatus
  timestamp: Date
}

interface ChatState {
  messages:         ChatMessage[]
  isLoading:        boolean
  currentProjectId: string | null
}

interface ChatActions {
  addMessage:   (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setLoading:   (loading: boolean) => void
  setProjectId: (projectId: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  messages:         [],
  isLoading:        false,
  currentProjectId: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...message, id: crypto.randomUUID(), timestamp: new Date() },
      ],
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setProjectId: (projectId) => set({ currentProjectId: projectId }),

  clearMessages: () => set({ messages: [] }),
}))
