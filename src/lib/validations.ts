import { z } from 'zod'

// Better Auth's default minimum password length is 8.
const password = z.string().min(8, 'Password must be at least 8 characters')

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password,
})

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.email('Enter a valid email address'),
  password,
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
