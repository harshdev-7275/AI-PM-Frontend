export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export interface User {
  id:        string
  name:      string
  email:     string
  avatarUrl: string | null
  jobTitle:  string | null
  timezone:  string
  createdAt: string
}

export interface AuthResponse {
  user:        User
  accessToken: string
  expiresIn:   number
}

export interface Org {
  id:        string
  name:      string
  slug:      string
  logoUrl:   string | null
  plan:      string
  isActive:  boolean
  createdAt: string
}

export interface Project {
  id:          string
  orgId:       string
  name:        string
  key:         string
  description: string | null
  icon:        string | null
  color:       string | null
  isArchived:  boolean
  createdBy:   string
  createdAt:   string
}

export interface ApiError {
  error:   string
  message: string
  issues?: { field: string; message: string }[]
}


export interface IssueStatus {
  id: string
  name: string
  color: string
  position: number
}

export type IssueType = 'epic' | 'story' | 'task' | 'bug' | 'feature' | 'subtask'

export type IssuePriority  = 'critical' | 'high' | 'medium' | 'low'

export interface Issue {
  id: string
  projectId: string
  orgId: string
  number: number
  title: string
  description: string | null
  type: IssueType
  priority: IssuePriority
  statusId: string
  assigneeId: string | null
  reporterId: string
  parentId: string | null
  sprintId: string | null
  storyPoints: number | null
  estimatedHours: number | null
  actualHours: number | null
  dueDate: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}


export interface CreateIssueInput {
    title:      string
    type:       IssueType
    priority:   IssuePriority
    statusId:   string
    assigneeId?: string
  }
