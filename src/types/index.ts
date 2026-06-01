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

// Full status shape returned by the workflow management endpoints
export interface WorkflowStatus extends IssueStatus {
  projectId: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
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
  title:       string
  type:        IssueType
  priority:    IssuePriority
  statusId:    string
  assigneeId?: string
}

export interface UpdateIssueInput {
  title?:       string
  description?: string | null
  priority?:    IssuePriority
  assigneeId?:  string | null
  dueDate?:     string | null
}

export interface IssueUser {
  id:        string
  name:      string
  email:     string
  avatarUrl: string | null
}

export interface IssueDetail extends Issue {
  status:   IssueStatus
  assignee: IssueUser | null
  reporter: IssueUser
}

export interface CommentAuthor {
  id:        string
  name:      string
  avatarUrl: string | null
}

export interface Comment {
  id:        string
  issueId:   string
  body:      string
  isEdited:  boolean
  parentId:  string | null
  author:    CommentAuthor
  createdAt: string
  updatedAt: string
}

export type OrgMemberRole = 'owner' | 'admin' | 'member'
export type InviteRole    = Exclude<OrgMemberRole, 'owner'>

export interface OrgMember {
  id:        string
  userId:    string
  name:      string
  email:     string
  avatarUrl: string | null
  role:      OrgMemberRole
  joinedAt:  string
}

export interface Invitation {
  token:     string
  email:     string
  expiresAt: string
}

export interface ProjectMember {
  id:        string
  userId:    string
  name:      string
  email:     string
  avatarUrl: string | null
  role:      string
  addedAt:   string
}

export type SprintStatus = 'planned' | 'active' | 'completed'

export interface Sprint {
  id:        string
  projectId: string
  name:      string
  goal:      string | null
  status:    SprintStatus
  startDate: string | null
  endDate:   string | null
  createdAt: string
}

export interface IssueHistoryEntry {
  id:           string
  issueId:      string
  fieldChanged: string
  oldValue:     string | null
  newValue:     string | null
  changedAt:    string
  changedBy: {
    id:        string
    name:      string
    avatarUrl: string | null
  }
}
