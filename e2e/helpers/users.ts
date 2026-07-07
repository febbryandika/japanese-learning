import { config } from 'dotenv'

// Load .env.local first (takes precedence), then fall back to .env — mirrors
// scripts/seed-videos.ts and scripts/create-admin.ts. Must run before the
// dynamic import below, since @/lib/db / @/lib/auth read DATABASE_URL (and
// other env vars) at import time. Playwright does not load .env* files on its
// own, so this has to happen here rather than relying on config inheritance.
config({ path: '.env.local' })
config({ path: '.env' })

import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

type Role = 'admin' | 'learner'

// Public registration is removed (Phase 16) — e2e specs provision users
// directly against the DB via the same internal-adapter path the admin UI
// uses, instead of going through a UI /register flow that no longer exists.
//
// This runs in the Playwright Node process (not the browser), so it has
// access to DATABASE_URL etc. The service must be loaded lazily (after the
// dotenv calls above) and via `require`, not native `import()`: Playwright
// transpiles TS through its CJS require hook, while a native dynamic import
// bypasses it and Node then rejects the raw .ts module.
export async function createUserViaDb({
  name,
  email,
  password,
  role = 'learner',
}: {
  name: string
  email: string
  password: string
  role?: Role
}) {
  const { createUserAdmin } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../../src/services/admin/user.service') as typeof import('../../src/services/admin/user.service')
  return createUserAdmin({ name, email, password, role })
}

export async function loginViaUi(
  page: Page,
  { email, password }: { email: string; password: string },
) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}
