import { create } from 'zustand'
import type { Project } from '@/types'
import { useIssueStore } from '@/store/useIssueStore'

interface ProjectState {
  projects:       Project[]
  currentProject: Project | null
}

interface ProjectActions {
  setProjects:       (projects: Project[]) => void
  setCurrentProject: (project: Project) => void
  clearProjects:     () => void
}

const initialState: ProjectState = {
  projects:       [],
  currentProject: null,
}

export const useProjectStore = create<ProjectState & ProjectActions>((set) => ({
  ...initialState,

  setProjects:       (projects) => set({ projects }),
  setCurrentProject: (project)  => set({ currentProject: project }),
  clearProjects: () => {
    useIssueStore.getState().clearIssues()
    set(initialState)
  },
}))
