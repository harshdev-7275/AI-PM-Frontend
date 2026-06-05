import { z } from 'zod'

// Form schemas for the auth feature. Co-located per FrontendRules §7 (Form state
// → React Hook Form + Zod). zodResolver consumes these so the field-level error
// messages below are what the user sees inline.

export const loginSchema = z.object({
  email:    z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginValues = z.infer<typeof loginSchema>
