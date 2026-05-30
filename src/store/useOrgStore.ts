import { create } from 'zustand'
import type { Org } from '@/types'
import { useProjectStore } from '@/store/useProjectStore'

interface OrgState {
  currentOrg: Org | null
  orgs:       Org[]
  isLoading:  boolean
}

interface OrgActions {
  setCurrentOrg: (org: Org) => void
  setOrgs:       (orgs: Org[]) => void
  setLoading:    (loading: boolean) => void
  clearOrgs:     () => void
}

const initialState: OrgState = {
  currentOrg: null,
  orgs:       [],
  isLoading:  false,
}

export const useOrgStore = create<OrgState & OrgActions>((set) => ({
  ...initialState,

  setCurrentOrg: (org) => set({ currentOrg: org }),

  setOrgs: (orgs) => set({ orgs }),

  setLoading: (loading) => set({ isLoading: loading }),

  clearOrgs: () => {
    useProjectStore.getState().clearProjects()
    set(initialState)
  },
}))
