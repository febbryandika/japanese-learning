'use client'

import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog'
import type { AdminUser } from '@/services/admin/user.service'

export function DeleteUserDialog({
  user,
  onOpenChange,
  onConfirm,
  pending,
}: {
  user: AdminUser | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  pending: boolean
}) {
  return (
    <AdminDeleteDialog
      open={user !== null}
      onOpenChange={onOpenChange}
      resourceLabel={user ? `user “${user.name}” (${user.email})` : 'user'}
      description="This permanently removes the account and all of their study data — progress, bookmarks, and exam attempts. This action cannot be undone."
      onConfirm={onConfirm}
      pending={pending}
    />
  )
}
