import { config } from 'dotenv'

// Load .env.local first (takes precedence), then fall back to .env — mirrors
// drizzle.config.ts. Must run before anything that imports @/lib/db or
// @/lib/auth (done dynamically in main), since both read DATABASE_URL at
// import time.
config({ path: '.env.local' })
config({ path: '.env' })

// Bootstraps the first administrator account. Public self-registration is
// removed (Phase 16) — this is the only way to create an admin outside the
// admin UI itself (which needs an existing admin to sign in).
//
// Usage:
//   NAME="Admin" EMAIL="admin@example.com" PASSWORD="..." pnpm db:create-admin
// Falls back to argv: pnpm db:create-admin -- "Admin" admin@example.com "password"

function readArgs(): { name: string; email: string; password: string } {
  const [argName, argEmail, argPassword] = process.argv.slice(2)
  const name = process.env.NAME ?? argName
  const email = process.env.EMAIL ?? argEmail
  const password = process.env.PASSWORD ?? argPassword

  if (!name || !email || !password) {
    throw new Error(
      'Missing NAME/EMAIL/PASSWORD. Set them as env vars, or pass ' +
        '"name" "email" "password" as arguments.',
    )
  }
  return { name, email, password }
}

async function main() {
  const { name, email, password } = readArgs()

  const { createUserAdmin } = await import('../src/services/admin/user.service')
  const { UniqueConstraintError } = await import('../src/services/admin/errors')

  try {
    const admin = await createUserAdmin({ name, email, password, role: 'admin' })
    console.log(`Created admin ${admin.email} (id: ${admin.id}).`)
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new Error(`A user with email "${email}" already exists.`)
    }
    throw error
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
