import { useProjectStore } from '@/store/useProjectStore'
import { getProjects, createProject as createProjectApi } from '@/services/api'
import type { Project } from '@/types'

export function useProject() {
  const { projects, currentProject, setProjects, setCurrentProject } = useProjectStore()

  const loadProjects = async (slug: string): Promise<void> => {
    const data = await getProjects(slug)
    setProjects(data)
  }

  const createProject = async (
    slug:         string,
    name:         string,
    key:          string,
    description?: string,
    icon?:        string,
    color?:       string,
  ): Promise<Project> => {
    const project = await createProjectApi(slug, name, key, description, icon, color)
    // Append to current list — use getState() to avoid stale closure
    const current = useProjectStore.getState().projects
    setProjects([...current, project])
    setCurrentProject(project)
    return project
  }

  const switchProject = (project: Project): void => {
    setCurrentProject(project)
  }

  return { projects, currentProject, loadProjects, createProject, switchProject }
}
