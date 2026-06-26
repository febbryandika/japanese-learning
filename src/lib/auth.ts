import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        // Every registered user gets a profile row holding their role.
        after: async (user) => {
          await db.insert(schema.userProfiles).values({
            userId: user.id,
            displayName: user.name,
          })
        },
      },
    },
  },
  // nextCookies must be the last plugin so it can set cookies on responses.
  plugins: [nextCookies()],
})

export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() })
}

// ─── RBAC ─────────────────────────────────────────────────────────────────────
// Role lives in `user_profiles.role` (SPEC §6), not in Better Auth's session.
// These helpers are the single authorization gate for every admin route/page.

type Session = NonNullable<Awaited<ReturnType<typeof getServerSession>>>

// Returns the caller's role, or null if they have no profile row yet.
export async function getUserRole(
  userId: string,
): Promise<'admin' | 'learner' | null> {
  const [profile] = await db
    .select({ role: schema.userProfiles.role })
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId))
    .limit(1)
  return profile?.role ?? null
}

// Route-handler guard. Discriminated result so callers branch inline (matching
// the existing `if (!session) return 401` idiom): no session → 401, logged-in
// non-admin (or no profile) → 403.
export type AdminGuardResult =
  | { ok: true; session: Session }
  | { ok: false; status: 401 | 403 }

export async function requireAdmin(): Promise<AdminGuardResult> {
  const session = await getServerSession()
  if (!session) {
    return { ok: false, status: 401 }
  }
  const role = await getUserRole(session.user.id)
  if (role !== 'admin') {
    return { ok: false, status: 403 }
  }
  return { ok: true, session }
}

// Server-Component guard. Redirects rather than returning a status: no session →
// /login (matches every page's existing guard), non-admin → /dashboard. Returns
// the session for admins so the page can read session.user.
export async function requireAdminPage(): Promise<Session> {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }
  const role = await getUserRole(session.user.id)
  if (role !== 'admin') {
    redirect('/dashboard')
  }
  return session
}
