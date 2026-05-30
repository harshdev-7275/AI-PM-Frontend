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
