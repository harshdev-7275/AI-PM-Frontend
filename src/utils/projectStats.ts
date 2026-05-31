import type { Issue, IssueStatus } from '@/types'

export interface ProjectStats {
  total: number
  completed: number
  inProgress: number
  todo: number
  completionPercentage: number
}

export function calculateProjectStats(
  issues: Issue[],
  projectId: string,
  statuses: IssueStatus[]
): ProjectStats {
  const projectIssues = issues.filter((i) => i.projectId === projectId)
  const total = projectIssues.length

  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      todo: 0,
      completionPercentage: 0,
    }
  }

  // Try to infer status categories from status names
  const getStatusType = (statusId: string): 'todo' | 'in-progress' | 'done' => {
    const status = statuses.find((s) => s.id === statusId)
    if (!status) return 'todo'

    const name = status.name.toLowerCase()
    if (name.includes('done') || name.includes('completed') || name.includes('closed'))
      return 'done'
    if (name.includes('progress') || name.includes('doing') || name.includes('in work'))
      return 'in-progress'
    return 'todo'
  }

  let completed = 0
  let inProgress = 0
  let todo = 0

  projectIssues.forEach((issue) => {
    const type = getStatusType(issue.statusId)
    if (type === 'done') completed++
    else if (type === 'in-progress') inProgress++
    else todo++
  })

  return {
    total,
    completed,
    inProgress,
    todo,
    completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}
