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

// ─── Videos ─────────────────────────────────────────────────────────────────

// Video lessons use the subset of the shared progress_state enum. `unseen` is
// the "not started" state (the DB has no `not_started` value).
export const updateVideoProgressSchema = z.object({
  progressState: z.enum(['unseen', 'in_progress', 'completed']),
})

export const videoListQuerySchema = z.object({
  groupId: z.string().min(1, 'groupId is required'),
})

export type UpdateVideoProgressInput = z.infer<typeof updateVideoProgressSchema>
export type VideoProgressState = UpdateVideoProgressInput['progressState']

// The full shared progress_state enum (SPEC §6). ProgressBadge renders any of
// these; videos only ever use the VideoProgressState subset.
export type ProgressState =
  | 'unseen'
  | 'in_progress'
  | 'reviewing'
  | 'mastered'
  | 'completed'
