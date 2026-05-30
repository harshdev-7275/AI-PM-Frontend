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

export interface ApiError {
  error:   string
  message: string
  issues?: { field: string; message: string }[]
}
