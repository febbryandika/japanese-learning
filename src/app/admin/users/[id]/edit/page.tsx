import Link from 'next/link'

import { requireAdminPage } from '@/lib/auth'
import { EditUserForm } from '@/components/admin/EditUserForm'

export default async function AdminEditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminPage()
  const { id } = await params

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Back to users
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit user</h1>
        <p className="text-sm text-muted-foreground">
          Update account details, role, and status.
        </p>
      </div>
      <EditUserForm userId={id} />
    </div>
  )
}
