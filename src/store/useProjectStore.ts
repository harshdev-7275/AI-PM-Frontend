import { create } from 'zustand'
import type { Project } from '@/types'
import { useIssueStore } from '@/store/useIssueStore'

interface ProjectState {
  projects:       Project[]
  currentProject: Project | null
}

interface ProjectActions {
  setProjects:          (projects: Project[]) => void
  setCurrentProject:    (project: Project) => void
  patchCurrentProject:  (patch: Partial<Project>) => void
  clearProjects:        () => void
}

const initialState: ProjectState = {
  projects:       [],
  currentProject: null,
}

export const useProjectStore = create<ProjectState & ProjectActions>((set) => ({
  ...initialState,

  setProjects:       (projects) => set({ projects }),
  setCurrentProject: (project)  => set({ currentProject: project }),
  patchCurrentProject: (patch) =>
    set((s) => ({
      currentProject: s.currentProject ? { ...s.currentProject, ...patch } : null,
      projects: s.projects.map((p) =>
        p.id === s.currentProject?.id ? { ...p, ...patch } : p
      ),
    })),
  clearProjects: () => {
    useIssueStore.getState().clearIssues()
    set(initialState)
  },
}))
