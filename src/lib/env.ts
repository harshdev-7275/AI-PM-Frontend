import { z } from 'zod'

const EnvSchema = z.object({
  VITE_API_BASE_URL:    z.string().url(),
  VITE_APP_ENV:         z.enum(['development', 'staging', 'production']).default('development'),
  VITE_AI_SERVICE_URL:  z.string().url().default('http://localhost:8000'),
  VITE_INTERNAL_SECRET: z.string().min(1),
})

export const env = EnvSchema.parse(import.meta.env)
