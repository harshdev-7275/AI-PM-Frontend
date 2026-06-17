import { z } from 'zod'

const EnvSchema = z.object({
  VITE_API_BASE_URL:    z.string().url(),
  VITE_APP_ENV:         z.enum(['development', 'staging', 'production']).default('development'),
})

export const env = EnvSchema.parse(import.meta.env)
