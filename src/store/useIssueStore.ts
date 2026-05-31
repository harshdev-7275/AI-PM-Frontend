import { create } from 'zustand'
import type { Issue, IssueStatus } from '@/types'

interface IssueState {
  issues:    Issue[]
  statuses:  IssueStatus[]
  isLoading: boolean
}

interface IssueActions {
  setIssues:         (issues: Issue[]) => void
  setStatuses:       (statuses: IssueStatus[]) => void
  setLoading:        (loading: boolean) => void
  addIssue:          (issue: Issue) => void
  updateIssueStatus: (issueId: string, statusId: string) => void
  clearIssues:       () => void
}

const initialState: IssueState = {
  issues:    [],
  statuses:  [],
  isLoading: false,
}

export const useIssueStore = create<IssueState & IssueActions>((set) => ({
  ...initialState,

  setIssues:   (issues)   => set({ issues }),
  setStatuses: (statuses) => set({ statuses }),
  setLoading:  (loading)  => set({ isLoading: loading }),

  addIssue: (issue) =>
    set((state) => ({ issues: [...state.issues, issue] })),

  updateIssueStatus: (issueId, statusId) =>
    set((state) => ({
      issues: state.issues.map((i) =>
        i.id === issueId ? { ...i, statusId } : i
      ),
    })),

  clearIssues: () => set(initialState),
}))
