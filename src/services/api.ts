import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { z } from 'zod'
import { env } from '@/lib/env'
import { useAuthStore } from '@/store/useAuthStore'
import type {
  AuthResponse, User, Org, Project, Category, Issue, IssueStatus, WorkflowStatus,
  CreateIssueInput, UpdateIssueInput,
  IssueDetail, Comment, IssueHistoryEntry,
  OrgMember, OrgMemberRole, InviteRole, Invitation, ProjectMember, ProjectRole, Sprint,
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

const ProjectStatsSchema = z.object({
  todo:       z.number(),
  inProgress: z.number(),
  done:       z.number(),
  total:      z.number(),
})

const ProjectSchema = z.object({
  id:               z.string().uuid(),
  orgId:            z.string().uuid(),
  name:             z.string(),
  key:              z.string(),
  description:      z.string().nullable(),
  icon:             z.string().nullable(),
  color:            z.string().nullable(),
  isArchived:       z.boolean(),
  createdBy:        z.string().uuid(),
  createdAt:        z.string(),
  weeklyAutoCreate: z.boolean().default(false),
  stats:            ProjectStatsSchema.default({ todo: 0, inProgress: 0, done: 0, total: 0 }),
})

const CategorySchema = z.object({
  id:          z.string().uuid(),
  projectId:   z.string().uuid(),
  orgId:       z.string().uuid(),
  name:        z.string(),
  color:       z.string(),
  description: z.string().nullable(),
  sprintId:    z.string().uuid().nullable(),
  createdBy:   z.string().uuid(),
  createdAt:   z.string(),
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

const OrgMemberRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer'])
const ProjectRoleSchema   = z.enum(['lead', 'member', 'viewer'])

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

const IssueTypeSchema = z.enum(['feature', 'bug', 'task', 'subtask'])
const IssuePrioritySchema = z.enum(['critical', 'high', 'medium', 'low'])

const IssueSchema = z.object({
  id:             z.string().uuid(),
  projectId:      z.string().uuid(),
  orgId:          z.string().uuid(),
  number:         z.number(),
  title:          z.string(),
  description:    z.string().nullable(),
  type:           IssueTypeSchema,
  categoryId:     z.string().uuid(),
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
// AVATAR UPLOAD
// =============================================================================

const AvatarUploadUrlSchema = z.object({
  uploadUrl: z.string().url(),
  key:       z.string(),
})

/** Ask the backend for a presigned PUT URL to upload an avatar to R2. */
export const getAvatarUploadUrl = async (
  contentType: string,
): Promise<{ uploadUrl: string; key: string }> => {
  const res = await api.post('/me/avatar/upload-url', { contentType })
  return AvatarUploadUrlSchema.parse(res.data)
}

/**
 * Upload the file bytes straight to R2 via the presigned URL. This bypasses
 * our axios instance (no auth header / baseURL) — it's a direct PUT to R2.
 */
export const uploadAvatarToR2 = async (uploadUrl: string, file: File): Promise<void> => {
  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    withCredentials: false,
  })
}

/** Persist the uploaded avatar key (or null to remove) and get the updated user. */
export const updateAvatar = async (avatarKey: string | null): Promise<User> => {
  const res = await api.patch('/me', { avatarKey })
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

export const transferOwnership = async (
  slug:   string,
  userId: string,
): Promise<void> => {
  await api.post(`/orgs/${slug}/transfer-ownership`, { userId })
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
  name?:             string
  description?:      string
  icon?:             string
  color?:            string
  isArchived?:       boolean
  weeklyAutoCreate?: boolean
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
  role:      ProjectRoleSchema,
  addedAt:   z.string(),
})

export const getProjectMembers = async (
  slug:      string,
  projectId: string,
): Promise<ProjectMember[]> => {
  const res = await api.get(`/orgs/${slug}/projects/${projectId}/members`)
  return z.array(ProjectMemberSchema).parse(res.data)
}

export const addProjectMember = async (
  slug:      string,
  projectId: string,
  userId:    string,
  role:      ProjectRole,
): Promise<ProjectMember> => {
  const res = await api.post(`/orgs/${slug}/projects/${projectId}/members`, { userId, role })
  return ProjectMemberSchema.parse(res.data)
}

export const updateProjectMemberRole = async (
  slug:      string,
  projectId: string,
  userId:    string,
  role:      ProjectRole,
): Promise<void> => {
  await api.patch(`/orgs/${slug}/projects/${projectId}/members/${userId}`, { role })
}

export const removeProjectMember = async (
  slug:      string,
  projectId: string,
  userId:    string,
): Promise<void> => {
  await api.delete(`/orgs/${slug}/projects/${projectId}/members/${userId}`)
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


// =============================================================================
// CATEGORIES
// =============================================================================

export const getCategories = async (
  slug:      string,
  projectId: string,
): Promise<Category[]> => {
  const res = await api.get(`/orgs/${slug}/projects/${projectId}/categories`)
  return z.array(CategorySchema).parse(res.data)
}

export const createCategory = async (
  slug:        string,
  projectId:   string,
  name:        string,
  color?:      string,
  description?: string,
): Promise<Category> => {
  const res = await api.post(`/orgs/${slug}/projects/${projectId}/categories`, { name, color, description })
  return CategorySchema.parse(res.data)
}

export const updateCategory = async (
  slug:        string,
  projectId:   string,
  categoryId:  string,
  input:       { name?: string; color?: string; description?: string | null },
): Promise<Category> => {
  const res = await api.patch(`/orgs/${slug}/projects/${projectId}/categories/${categoryId}`, input)
  return CategorySchema.parse(res.data)
}

export const deleteCategory = async (
  slug:       string,
  projectId:  string,
  categoryId: string,
): Promise<void> => {
  await api.delete(`/orgs/${slug}/projects/${projectId}/categories/${categoryId}`)
}

export const assignCategoryToSprint = async (
  slug:       string,
  projectId:  string,
  categoryId: string,
  sprintId:   string,
): Promise<Category> => {
  const res = await api.post(
    `/orgs/${slug}/projects/${projectId}/categories/${categoryId}/assign-sprint`,
    { sprintId },
  )
  return CategorySchema.parse(res.data)
}

export const unassignCategoryFromSprint = async (
  slug:       string,
  projectId:  string,
  categoryId: string,
): Promise<Category> => {
  const res = await api.delete(
    `/orgs/${slug}/projects/${projectId}/categories/${categoryId}/assign-sprint`,
  )
  return CategorySchema.parse(res.data)
}
