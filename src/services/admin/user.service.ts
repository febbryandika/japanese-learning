import { randomInt } from 'node:crypto'

import { and, asc, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user as authUser, session as authSession } from '@/lib/db/auth-schema'
import {
  bookmarks,
  mockExamAttempts,
  readerProgress,
  studyProgress,
  userProfiles,
} from '@/lib/db/schema'
import type {
  AdminUsersListQuery,
  CreateUserInput,
  ResetPasswordInput,
  UpdateUserInput,
} from '@/lib/validations'
import { mapPgError, UniqueConstraintError } from '@/services/admin/errors'

export type AdminUser = {
  id: string
  name: string
  email: string
  role: 'admin' | 'learner'
  status: 'active' | 'disabled'
  createdAt: Date
}

const columns = {
  id: authUser.id,
  name: authUser.name,
  email: authUser.email,
  role: userProfiles.role,
  status: userProfiles.status,
  createdAt: authUser.createdAt,
}

const sortColumn = {
  name: authUser.name,
  email: authUser.email,
  role: userProfiles.role,
  status: userProfiles.status,
  createdAt: authUser.createdAt,
} as const

// ─── Read ───────────────────────────────────────────────────────────────────

export async function listUsersAdmin({
  q,
  sortBy,
  sortDir,
  page,
  pageSize,
}: AdminUsersListQuery): Promise<{ items: AdminUser[]; total: number }> {
  const filters: SQL[] = []
  if (q) {
    const term = `%${q}%`
    const match = or(ilike(authUser.name, term), ilike(authUser.email, term))
    if (match) filters.push(match)
  }
  const where = filters.length ? and(...filters) : undefined

  const order = sortDir === 'asc' ? asc(sortColumn[sortBy]) : desc(sortColumn[sortBy])

  const [items, totalResult] = await Promise.all([
    db
      .select(columns)
      .from(authUser)
      .innerJoin(userProfiles, eq(userProfiles.userId, authUser.id))
      .where(where)
      // id tiebreaker keeps offset paging deterministic when sort values tie.
      .orderBy(order, asc(authUser.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: count() })
      .from(authUser)
      .innerJoin(userProfiles, eq(userProfiles.userId, authUser.id))
      .where(where),
  ])

  return { items, total: totalResult[0]?.total ?? 0 }
}

export async function getUserAdmin(id: string): Promise<AdminUser | null> {
  const [row] = await db
    .select(columns)
    .from(authUser)
    .innerJoin(userProfiles, eq(userProfiles.userId, authUser.id))
    .where(eq(authUser.id, id))
    .limit(1)
  return row ?? null
}

// ─── Create ─────────────────────────────────────────────────────────────────

// internal-adapter create + linkAccount (better-auth 1.6.20): createUser runs
// createWithHooks, so the existing `user.create.after` hook auto-creates the
// user_profiles row — this function must NOT insert its own profile row.
export async function createUserAdmin(input: CreateUserInput): Promise<AdminUser> {
  const [existing] = await db
    .select({ id: authUser.id })
    .from(authUser)
    .where(eq(authUser.email, input.email))
    .limit(1)
  if (existing) {
    throw new UniqueConstraintError('A user with that email already exists')
  }

  const ctx = await auth.$context
  const hash = await ctx.password.hash(input.password)

  let created: { id: string }
  try {
    created = await ctx.internalAdapter.createUser({
      email: input.email,
      name: input.name,
      emailVerified: false,
    })
  } catch (error) {
    mapPgError(error)
  }

  try {
    await ctx.internalAdapter.linkAccount({
      userId: created.id,
      providerId: 'credential',
      accountId: created.id,
      password: hash,
    })
  } catch (error) {
    // Best-effort rollback so we don't leave a passwordless user behind.
    await ctx.internalAdapter.deleteUser(created.id).catch(() => {})
    await db.delete(userProfiles).where(eq(userProfiles.userId, created.id)).catch(() => {})
    throw error
  }

  if (input.role === 'admin') {
    await db.update(userProfiles).set({ role: 'admin' }).where(eq(userProfiles.userId, created.id))
  }

  const row = await getUserAdmin(created.id)
  if (!row) {
    throw new Error('Failed to load newly created user')
  }
  return row
}

// ─── Update ─────────────────────────────────────────────────────────────────

export async function updateUserAdmin(
  id: string,
  input: UpdateUserInput,
): Promise<AdminUser | null> {
  const existing = await getUserAdmin(id)
  if (!existing) return null

  if (input.email && input.email !== existing.email) {
    const [dup] = await db
      .select({ id: authUser.id })
      .from(authUser)
      .where(eq(authUser.email, input.email))
      .limit(1)
    if (dup) {
      throw new UniqueConstraintError('A user with that email already exists')
    }
  }

  const userUpdates: Record<string, unknown> = {}
  if (input.name !== undefined) userUpdates.name = input.name
  if (input.email !== undefined) userUpdates.email = input.email

  if (Object.keys(userUpdates).length > 0) {
    try {
      await db.update(authUser).set(userUpdates).where(eq(authUser.id, id))
    } catch (error) {
      mapPgError(error)
    }
  }

  const profileUpdates: Record<string, unknown> = {}
  if (input.role !== undefined) profileUpdates.role = input.role
  if (input.status !== undefined) profileUpdates.status = input.status

  if (Object.keys(profileUpdates).length > 0) {
    await db.update(userProfiles).set(profileUpdates).where(eq(userProfiles.userId, id))
  }

  // Revoke live sessions on disable so the block takes effect immediately.
  if (input.status === 'disabled') {
    await db.delete(authSession).where(eq(authSession.userId, id))
  }

  return getUserAdmin(id)
}

// ─── Delete ─────────────────────────────────────────────────────────────────

// Hard delete: app rows keyed by userId + the profile row, then the auth user
// (session/account cascade via FK). generatedExampleSentences is content-keyed
// (sourceType/sourceId), not user data, so it is left untouched.
export async function deleteUserAdmin(id: string): Promise<{ id: string } | null> {
  const existing = await getUserAdmin(id)
  if (!existing) return null

  await db.transaction(async (tx) => {
    await tx.delete(studyProgress).where(eq(studyProgress.userId, id))
    await tx.delete(bookmarks).where(eq(bookmarks.userId, id))
    await tx.delete(mockExamAttempts).where(eq(mockExamAttempts.userId, id))
    await tx.delete(readerProgress).where(eq(readerProgress.userId, id))
    await tx.delete(userProfiles).where(eq(userProfiles.userId, id))
  })

  const ctx = await auth.$context
  await ctx.internalAdapter.deleteUser(id)

  return { id }
}

// ─── Reset password ─────────────────────────────────────────────────────────

const PASSWORD_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

function generatePassword(length = 16): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]
  }
  return out
}

export async function resetUserPasswordAdmin(
  id: string,
  input: ResetPasswordInput,
): Promise<{ id: string; password?: string } | null> {
  const existing = await getUserAdmin(id)
  if (!existing) return null

  const password = input.mode === 'generate' ? generatePassword() : input.password

  const ctx = await auth.$context
  const hash = await ctx.password.hash(password)
  await ctx.internalAdapter.updatePassword(id, hash)

  return input.mode === 'generate' ? { id, password } : { id }
}
