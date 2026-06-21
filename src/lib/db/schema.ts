import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

// Better Auth manages its own tables (user / session / account / verification).
// They are generated into ./auth-schema.ts and re-exported here so a single
// migration covers the whole foundation.
export * from './auth-schema'

// App-level extension of the Better Auth user. Holds the role used for RBAC.
// `userId` references the Better Auth user id as plain text (no FK), matching
// the user-scoped table pattern used elsewhere in the spec.
export const userProfiles = pgTable('user_profiles', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id').notNull().unique(),
  displayName: text('display_name'),
  role: text('role', { enum: ['admin', 'learner'] })
    .notNull()
    .default('learner'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
