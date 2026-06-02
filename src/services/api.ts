import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { z } from 'zod'
import { env } from '@/lib/env'
import { useAuthStore } from '@/store/useAuthStore'
import type {
  AuthResponse, User, Org, Project, Issue, IssueStatus, WorkflowStatus,
  CreateIssueInput, UpdateIssueInput,
  IssueDetail, Comment, IssueHistoryEntry,
  OrgMember, OrgMemberRole, InviteRole, Invitation, ProjectMember, Sprint,
} from '@/types'

// Thrown by deleteStatus when the backend returns 409 STATUS_HAS_ISSUES.
// Catch this in the UI to show the "X issues use this status" warning instead
// of a generic error toast.
export class StatusHasIssuesError extends Error {
  readonly issueCount: number

  constructor(issueCount: number) {
    super('STATUS_HAS_ISSUES')
    this.name = 'StatusHasIssuesError'
    this.issueCount = issueCount
  }
}


export const api = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 10_000,
  withCredentials: true,
})

// =============================================================================
// RESPONSE SCHEMAS — Zod validates all API responses at the boundary
// =============================================================================

const UserSchema = z.object({
  id:        z.string().uuid(),
  name:      z.string(),
  email:     z.string().email(),
  avatarUrl: z.string().nullable(),
  jobTitle:  z.string().nullable(),
  timezone:  z.string(),
  createdAt: z.string(),
})

const AuthResponseSchema = z.object({
  user:        UserSchema,
  accessToken: z.string(),
  expiresIn:   z.number(),
})

const RefreshResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn:   z.number(),
})

const LogoutResponseSchema = z.object({
  message: z.string(),
})

const ProjectSchema = z.object({
  id:                z.string().uuid(),
  orgId:             z.string().uuid(),
  name:              z.string(),
  key:               z.string(),
  description:       z.string().nullable(),
  icon:              z.string().nullable(),
  color:             z.string().nullable(),
  isArchived:        z.boolean(),
  createdBy:         z.string().uuid(),
  createdAt:         z.string(),
  cadenceType:       z.enum(['none', 'weekly', 'biweekly', 'monthly']).default('none'),
  cadenceStartDay:   z.number().nullable().default(null),
  cadenceDuration:   z.number().nullable().default(null),
  cadenceAutoCreate: z.boolean().default(false),
  cadenceNaming:     z.string().nullable().default(null),
})

const OrgSchema = z.object({
  id:        z.string().uuid(),
  name:      z.string(),
  slug:      z.string(),
  logoUrl:   z.string().nullable(),
  plan:      z.string(),
  isActive:  z.boolean(),
  createdAt: z.string(),
})

const OrgMemberRoleSchema = z.enum(['owner', 'admin', 'member'])

export const OrgMemberSchema = z.object({
  id:        z.string().uuid(),
  userId:    z.string().uuid(),
  name:      z.string(),
  email:     z.string().email(),
  avatarUrl: z.string().nullable(),
  role:      OrgMemberRoleSchema,
  joinedAt:  z.string(),
})

const InvitationSchema = z.object({
  token:     z.string(),
  email:     z.string().email(),
  expiresAt: z.string(),
})

const IssueStatusSchema = z.object({
  id:       z.string().uuid(),
  name:     z.string(),
  color:    z.string(),
  position: z.number(),
})

const WorkflowStatusSchema = IssueStatusSchema.extend({
  projectId: z.string().uuid(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const IssueUserSchema = z.object({
  id:        z.string().uuid(),
  name:      z.string(),
  email:     z.string(),
  avatarUrl: z.string().nullable(),
})

const CommentAuthorSchema = z.object({
  id:        z.string().uuid(),
  name:      z.string(),
  avatarUrl: z.string().nullable(),
})

const CommentSchema = z.object({
  id:        z.string().uuid(),
  issueId:   z.string().uuid(),
  body:      z.string(),
  isEdited:  z.boolean(),
  parentId:  z.string().uuid().nullable(),
  author:    CommentAuthorSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

const IssueHistoryEntrySchema = z.object({
  id:           z.string().uuid(),
  issueId:      z.string().uuid(),
  fieldChanged: z.string(),
  oldValue:     z.string().nullable(),
  newValue:     z.string().nullable(),
  changedAt:    z.string(),
  changedBy: z.object({
    id:        z.string().uuid(),
    name:      z.string(),
    avatarUrl: z.string().nullable(),
  }),
})

const IssueTypeSchema = z.enum(['epic', 'story', 'task', 'bug', 'feature', 'subtask'])
const IssuePrioritySchema = z.enum(['critical', 'high', 'medium', 'low'])

const IssueSchema = z.object({
  id:             z.string().uuid(),
  projectId:      z.string().uuid(),
  orgId:          z.string().uuid(),
  number:         z.number(),
  title:          z.string(),
  description:    z.string().nullable(),
  type:           IssueTypeSchema,
  priority:       IssuePrioritySchema,
  statusId:       z.string().uuid(),
  assigneeId:     z.string().uuid().nullable(),
  reporterId:     z.string().uuid(),
  parentId:       z.string().uuid().nullable(),
  sprintId:       z.string().uuid().nullable(),
  storyPoints:    z.number().nullable(),
  estimatedHours: z.number().nullable(),
  actualHours:    z.number().nullable(),
  dueDate:        z.string().nullable(),
  startedAt:      z.string().nullable(),
  completedAt:    z.string().nullable(),
  createdAt:      z.string(),
  updatedAt:      z.string(),
})



const IssueDetailSchema = IssueSchema.extend({
  status:   IssueStatusSchema,
  assignee: IssueUserSchema.nullable(),
  reporter: IssueUserSchema,
})

// =============================================================================
// TOKEN REFRESH INTERCEPTOR
// =============================================================================

// Attach the stored access token to every outgoing request automatically.
// Functions like createOrg/getUserOrgs that pass the token explicitly (called
// right after register before the store is populated) will override this header
// via their own config.headers — axios merges headers with the explicit value winning.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Extends axios config to track whether a request has already been retried.
// `as RetryableConfig` is used at the axios boundary where types cannot be
// augmented directly — InternalAxiosRequestConfig is a sealed axios internal.
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

// Prevents concurrent 401s from each triggering a separate refresh call.
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject:  (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null): void => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else       p.resolve(token as string)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as RetryableConfig
    if (!originalRequest) return Promise.reject(error)

    // Never retry auth endpoints:
    // - /auth/refresh would cause an infinite loop
    // - /auth/login and /auth/register 401 means wrong credentials, not expired token
    const isAuthEndpoint = ['/auth/refresh', '/auth/login', '/auth/register']
      .some((p) => originalRequest.url?.includes(p))

    if (isAuthEndpoint) {
      if (originalRequest.url?.includes('/auth/refresh')) {
        useAuthStore.getState().clearAuth()
      }
      return Promise.reject(error)
    }

    // Already retried with a fresh token and still got 401 — session is invalid
    if (originalRequest._retry) {
      useAuthStore.getState().clearAuth()
      return Promise.reject(error)
    }

    // Another request is already refreshing — queue this one until done
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers['Authorization'] = `Bearer ${token}`
        return api(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { accessToken } = await refreshToken()
      useAuthStore.getState().setAccessToken(accessToken)
      processQueue(null, accessToken)
      originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      useAuthStore.getState().clearAuth()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

// =============================================================================
// AUTH
// =============================================================================

export const loginUser = async (
  email:    string,
  password: string,
): Promise<AuthResponse> => {
  const res = await api.post('/auth/login', { email, password })
  return AuthResponseSchema.parse(res.data)
}

export const registerUser = async (
  name:      string,
  email:     string,
  password:  string,
  jobTitle?: string,
): Promise<AuthResponse> => {
  const res = await api.post('/auth/register', { name, email, password, jobTitle })
  return AuthResponseSchema.parse(res.data)
}

export const logoutUser = async (): Promise<{ message: string }> => {
  const res = await api.post('/auth/logout')
  return LogoutResponseSchema.parse(res.data)
}

export const refreshToken = async (): Promise<{ accessToken: string; expiresIn: number }> => {
  const res = await api.post('/auth/refresh')
  return RefreshResponseSchema.parse(res.data)
}

export const getMe = async (accessToken: string): Promise<User> => {
  const res = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return UserSchema.parse(res.data)
}

// =============================================================================
// ORGS
// =============================================================================

export const createOrg = async (
  name:        string,
  slug:        string,
  accessToken: string,
): Promise<Org> => {
  const res = await api.post('/orgs', { name, slug }, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return OrgSchema.parse(res.data)
}

export const getUserOrgs = async (accessToken: string): Promise<Org[]> => {
  const res = await api.get('/orgs/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return z.array(OrgSchema).parse(res.data)
}

export const getOrgMembers = async (slug: string): Promise<OrgMember[]> => {
  const res = await api.get(`/orgs/${slug}/members`)
  return z.array(OrgMemberSchema).parse(res.data)
}

export const inviteMember = async (
  slug:  string,
  email: string,
  role:  InviteRole = 'member',
): Promise<Invitation> => {
  const res = await api.post(`/orgs/${slug}/invite`, { email, role })
  return InvitationSchema.parse(res.data)
}

export const updateMemberRole = async (
  slug:   string,
  userId: string,
  role:   OrgMemberRole,
): Promise<OrgMember> => {
  const res = await api.patch(`/orgs/${slug}/members/${userId}`, { role })
  return OrgMemberSchema.parse(res.data)
}

export const removeMember = async (
  slug:   string,
  userId: string,
): Promise<void> => {
  await api.delete(`/orgs/${slug}/members/${userId}`)
}

// The request interceptor attaches the Bearer token automatically when the user
// is logged in. If no token is in the store, the request goes unauthenticated
// and the component is responsible for handling any resulting 401.
export const acceptInvitation = async (token: string): Promise<Org> => {
  const res = await api.post('/orgs/invite/accept', { token })
  return OrgSchema.parse(res.data)
}

// =============================================================================
// PROJECTS
// =============================================================================

export const getProjects = async (slug: string): Promise<Project[]> => {
  const res = await api.get(`/orgs/${slug}/projects`)
  return z.array(ProjectSchema).parse(res.data)
}

export const createProject = async (
  slug:         string,
  name:         string,
  key:          string,
  description?: string,
  icon?:        string,
  color?:       string,
): Promise<Project> => {
  const res = await api.post(`/orgs/${slug}/projects`, { name, key, description, icon, color })
  return ProjectSchema.parse(res.data)
}

export interface UpdateProjectInput {
  cadenceType?:       Project['cadenceType']
  cadenceStartDay?:   number | null
  cadenceDuration?:   number | null
  cadenceAutoCreate?: boolean
  cadenceNaming?:     string | null
}

export const updateProject = async (
  slug:      string,
  projectId: string,
  input:     UpdateProjectInput,
): Promise<Project> => {
  const res = await api.patch(`/orgs/${slug}/projects/${projectId}`, input)
  return ProjectSchema.parse(res.data)
}

export const getIssueStatuses = async (
  slug:      string,
  projectId: string,
): Promise<IssueStatus[]> => {
  const res = await api.get(`/orgs/${slug}/projects/${projectId}/issues/statuses`)
  return z.array(IssueStatusSchema).parse(res.data)
}

 export const getIssues = async (
    slug:      string,
    projectId: string,
  ): Promise<Issue[]> => {
    const res = await api.get(`/orgs/${slug}/projects/${projectId}/issues`)
    return z.array(IssueSchema).parse(res.data)
  }

  
export const createIssue = async (
    slug:      string,
    projectId: string,
    input:     CreateIssueInput,
  ): Promise<Issue> => {
    const res = await api.post(`/orgs/${slug}/projects/${projectId}/issues`,
  input)
    return IssueSchema.parse(res.data)
  }

export const getIssue = async (
  slug:      string,
  projectId: string,
  issueId:   string,
): Promise<IssueDetail> => {
  const res = await api.get(`/orgs/${slug}/projects/${projectId}/issues/${issueId}`)
  return IssueDetailSchema.parse(res.data)
}

export const updateIssue = async (
  slug:      string,
  projectId: string,
  issueId:   string,
  input:     UpdateIssueInput,
): Promise<Issue> => {
  const res = await api.patch(`/orgs/${slug}/projects/${projectId}/issues/${issueId}`, input)
  return IssueSchema.parse(res.data)
}

export const getComments = async (
  slug:      string,
  projectId: string,
  issueId:   string,
): Promise<Comment[]> => {
  const res = await api.get(`/orgs/${slug}/projects/${projectId}/issues/${issueId}/comments`)
  return z.array(CommentSchema).parse(res.data)
}

export const createComment = async (
  slug:      string,
  projectId: string,
  issueId:   string,
  body:      string,
): Promise<Comment> => {
  const res = await api.post(`/orgs/${slug}/projects/${projectId}/issues/${issueId}/comments`, { body })
  return CommentSchema.parse(res.data)
}

export const updateComment = async (
  slug:      string,
  projectId: string,
  issueId:   string,
  commentId: string,
  body:      string,
): Promise<Comment> => {
  const res = await api.patch(
    `/orgs/${slug}/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
    { body },
  )
  return CommentSchema.parse(res.data)
}

export const deleteComment = async (
  slug:      string,
  projectId: string,
  issueId:   string,
  commentId: string,
): Promise<void> => {
  await api.delete(`/orgs/${slug}/projects/${projectId}/issues/${issueId}/comments/${commentId}`)
}

export const getIssueHistory = async (
  slug:      string,
  projectId: string,
  issueId:   string,
): Promise<IssueHistoryEntry[]> => {
  const res = await api.get(`/orgs/${slug}/projects/${projectId}/issues/${issueId}/history`)
  return z.array(IssueHistoryEntrySchema).parse(res.data)
}

export const updateIssueStatus = async (
  slug:      string,
  projectId: string,
  issueId:   string,
  statusId:  string,
): Promise<Issue> => {
  const res = await api.patch(
    `/orgs/${slug}/projects/${projectId}/issues/${issueId}/status`,
    { statusId },
  )
  return IssueSchema.parse(res.data)
}

// =============================================================================
// PROJECT MEMBERS
// =============================================================================

const ProjectMemberSchema = z.object({
  id:        z.string().uuid(),
  userId:    z.string().uuid(),
  name:      z.string(),
  email:     z.string().email(),
  avatarUrl: z.string().nullable(),
  role:      z.string(),
  addedAt:   z.string(),
})

export const getProjectMembers = async (
  slug:      string,
  projectId: string,
): Promise<ProjectMember[]> => {
  const res = await api.get(`/orgs/${slug}/projects/${projectId}/members`)
  return z.array(ProjectMemberSchema).parse(res.data)
}

// =============================================================================
// WORKFLOW STATUSES
// =============================================================================

export const getWorkflowStatuses = async (
  slug:      string,
  projectId: string,
): Promise<WorkflowStatus[]> => {
  const res = await api.get(`/orgs/${slug}/projects/${projectId}/statuses`)
  return z.array(WorkflowStatusSchema).parse(res.data)
}

export const createStatus = async (
  slug:      string,
  projectId: string,
  name:      string,
  color:     string,
): Promise<WorkflowStatus> => {
  const res = await api.post(`/orgs/${slug}/projects/${projectId}/statuses`, { name, color })
  return WorkflowStatusSchema.parse(res.data)
}

export const updateStatus = async (
  slug:      string,
  projectId: string,
  statusId:  string,
  input:     { name?: string; color?: string; position?: number },
): Promise<WorkflowStatus> => {
  const res = await api.patch(`/orgs/${slug}/projects/${projectId}/statuses/${statusId}`, input)
  return WorkflowStatusSchema.parse(res.data)
}

export const deleteStatus = async (
  slug:      string,
  projectId: string,
  statusId:  string,
): Promise<void> => {
  try {
    await api.delete(`/orgs/${slug}/projects/${projectId}/statuses/${statusId}`)
  } catch (err: unknown) {
    if (
      axios.isAxiosError(err) &&
      err.response?.status === 409 &&
      err.response.data?.error === 'STATUS_HAS_ISSUES'
    ) {
      throw new StatusHasIssuesError(err.response.data.issueCount as number)
    }
    throw err
  }
}

// =============================================================================
// SPRINTS
// =============================================================================

const SprintSchema = z.object({
  id:        z.string().uuid(),
  projectId: z.string().uuid(),
  name:      z.string(),
  goal:      z.string().nullable(),
  status:    z.enum(['planned', 'active', 'completed']),
  startDate: z.string().nullable(),
  endDate:   z.string().nullable(),
  createdAt: z.string(),
})

export const getSprints = async (
  slug:      string,
  projectId: string,
): Promise<Sprint[]> => {
  const res = await api.get(`/orgs/${slug}/projects/${projectId}/sprints`)
  return z.array(SprintSchema).parse(res.data)
}

// Date inputs return YYYY-MM-DD; backend requires full ISO 8601 with offset.
const toISODateTime = (date: string) => `${date}T00:00:00Z`

export const createSprint = async (
  slug:       string,
  projectId:  string,
  name:       string,
  goal?:      string,
  startDate?: string,
  endDate?:   string,
): Promise<Sprint> => {
  const res = await api.post(`/orgs/${slug}/projects/${projectId}/sprints`, {
    name,
    goal,
    ...(startDate ? { startDate: toISODateTime(startDate) } : {}),
    ...(endDate   ? { endDate:   toISODateTime(endDate)   } : {}),
  })
  return SprintSchema.parse(res.data)
}

export const startSprint = async (
  slug:      string,
  projectId: string,
  sprintId:  string,
): Promise<Sprint> => {
  const res = await api.post(`/orgs/${slug}/projects/${projectId}/sprints/${sprintId}/start`)
  return SprintSchema.parse(res.data)
}

const CompleteSprintResultSchema = z.object({
  completedSprint: SprintSchema,
  nextSprint:      SprintSchema.nullable(),
})

export type CompleteSprintResult = z.infer<typeof CompleteSprintResultSchema>

export const completeSprint = async (
  slug:      string,
  projectId: string,
  sprintId:  string,
): Promise<CompleteSprintResult> => {
  const res = await api.post(`/orgs/${slug}/projects/${projectId}/sprints/${sprintId}/complete`)
  return CompleteSprintResultSchema.parse(res.data)
}

export const addIssueToSprint = async (
  slug:      string,
  projectId: string,
  sprintId:  string,
  issueId:   string,
): Promise<void> => {
  await api.post(`/orgs/${slug}/projects/${projectId}/sprints/${sprintId}/issues/${issueId}`)
}

export const removeIssueFromSprint = async (
  slug:      string,
  projectId: string,
  sprintId:  string,
  issueId:   string,
): Promise<void> => {
  await api.delete(`/orgs/${slug}/projects/${projectId}/sprints/${sprintId}/issues/${issueId}`)
}

// =============================================================================
// AI SERVICE — proxied through Node.js (secret never reaches the browser)
// =============================================================================

const ChatResponseSchema = z.object({
  intent: z.string().nullable(),
  result: z.object({ message: z.string() }).nullable(),
  error:  z.string().nullable(),
})

export type ChatResponse = z.infer<typeof ChatResponseSchema>

export const sendChatMessage = async (
  message:   string,
  _userId:   string,
  orgSlug:   string,
  projectId: string,
): Promise<ChatResponse> => {
  const res = await api.post('/api/chat', { message, orgSlug, projectId }, { timeout: 60_000 })
  return ChatResponseSchema.parse(res.data)
}

