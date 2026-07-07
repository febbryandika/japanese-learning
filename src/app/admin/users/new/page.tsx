import Link from 'next/link'

import { requireAdminPage } from '@/lib/auth'
import { NewUserForm } from '@/components/admin/NewUserForm'

export default async function AdminNewUserPage() {
  await requireAdminPage()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Back to users
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New user</h1>
        <p className="text-sm text-muted-foreground">
          Create a learner or admin account with a starting password.
        </p>
      </div>
      <NewUserForm />
    </div>
  )
}
