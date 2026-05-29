import axios from 'axios'
import { env } from '@/lib/env'

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
