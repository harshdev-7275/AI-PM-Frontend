import axios from 'axios'
import { z } from 'zod'
import { env } from '@/lib/env'
import type { AuthResponse, User } from '@/types'

export const api = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 10_000,
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    return Promise.reject(error)
  },
)

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
