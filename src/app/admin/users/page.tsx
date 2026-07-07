import { requireAdminPage } from '@/lib/auth'
import { UsersManager } from '@/components/admin/UsersManager'

export default async function AdminUsersPage() {
  await requireAdminPage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage learner and admin accounts, roles, and access.
        </p>
      </div>
      <UsersManager />
    </div>
  )
}
