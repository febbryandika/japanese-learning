import { headers } from 'next/headers'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'

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
