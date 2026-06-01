import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { getProjects, createProject as createProjectApi, updateProject as updateProjectApi } from '@/services/api'
import type { UpdateProjectInput } from '@/services/api'
import type { Project } from '@/types'

interface ProjectHookState {
  isLoading: boolean
  error: string | null
}

export function useProject() {
  const { projects, currentProject, setProjects, setCurrentProject, patchCurrentProject } = useProjectStore()
  const [state, setState] = useState<ProjectHookState>({
    isLoading: false,
    error: null,
  })

  const loadProjects = async (slug: string): Promise<void> => {
    setState({ isLoading: true, error: null })
    try {
      const data = await getProjects(slug)
      setProjects(data)
      setState({ isLoading: false, error: null })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load projects'
      setState({ isLoading: false, error: errorMsg })
      throw err
    }
  }

  const createProject = async (
    slug: string,
    name: string,
    key: string,
    description?: string,
    icon?: string,
    color?: string,
  ): Promise<Project> => {
    setState({ isLoading: true, error: null })
    try {
      const project = await createProjectApi(slug, name, key, description, icon, color)
      // Append to current list — use getState() to avoid stale closure
      const current = useProjectStore.getState().projects
      setProjects([...current, project])
      setCurrentProject(project)
      setState({ isLoading: false, error: null })
      return project
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create project'
      setState({ isLoading: false, error: errorMsg })
      throw err
    }
  }

  const switchProject = (project: Project): void => {
    setCurrentProject(project)
  }

  const updateProject = async (
    slug:      string,
    projectId: string,
    input:     UpdateProjectInput,
  ): Promise<Project> => {
    const updated = await updateProjectApi(slug, projectId, input)
    patchCurrentProject(updated)
    return updated
  }

  return {
    projects,
    currentProject,
    loadProjects,
    createProject,
    updateProject,
    switchProject,
    isLoading: state.isLoading,
    error: state.error,
  }
}
