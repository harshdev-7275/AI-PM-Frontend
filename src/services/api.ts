import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { z } from 'zod'
import { env } from '@/lib/env'
import { useAuthStore } from '@/store/useAuthStore'
import type { AuthResponse, User } from '@/types'

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

// =============================================================================
// TOKEN REFRESH INTERCEPTOR
// =============================================================================

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
