import { create } from 'zustand'
import type { SuggestionPage } from '@/services/aiService'

interface NavState {
  lastPage:      SuggestionPage
  lastProjectId: string | undefined
  setLastPage:   (page: SuggestionPage, projectId?: string) => void
}

export const useNavStore = create<NavState>((set) => ({
  lastPage:      'dashboard',
  lastProjectId: undefined,
  setLastPage:   (page, projectId) => set({ lastPage: page, lastProjectId: projectId }),
}))
