'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

import {
  useAdminUsers,
  useDeleteUser,
  type AdminUser,
} from '@/hooks/use-admin-users'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { AdminApiError } from '@/hooks/admin-api'
import type { UserSortField } from '@/lib/validations'
import { UserTable, UserSortControls } from '@/components/admin/UserTable'
import { ResetPasswordDialog } from '@/components/admin/ResetPasswordDialog'
import { DeleteUserDialog } from '@/components/admin/DeleteUserDialog'
import { PaginationControls } from '@/components/PaginationControls'
import { ErrorState } from '@/components/ErrorState'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PAGE_SIZE = 20

export function UsersManager() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<UserSortField>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const { data, isPending, isError, isPlaceholderData, refetch } = useAdminUsers({
    q: debouncedSearch || undefined,
    sortBy,
    sortDir,
    page,
    pageSize: PAGE_SIZE,
  })

  const deleteMutation = useDeleteUser()

  function showError(error: unknown, fallback: string) {
    toast.error(error instanceof AdminApiError ? error.message : fallback)
  }

  function handleSortChange(field: UserSortField) {
    if (field === sortBy) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  function handleDelete() {
    if (!pendingDelete) return
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('User deleted')
        setPendingDelete(null)
      },
      onError: (error) => {
        showError(error, 'Could not delete user')
        setPendingDelete(null)
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Search by name or email"
          aria-label="Search users"
          className="sm:max-w-xs"
        />
        <Link href="/admin/users/new" className={buttonVariants()}>
          New user
        </Link>
      </div>

      <UserSortControls sortBy={sortBy} sortDir={sortDir} onSortChange={handleSortChange} />

      {isError ? (
        <ErrorState message="Couldn’t load users." onRetry={refetch} />
      ) : (
        <>
          <div
            className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}
          >
            <UserTable
              users={data?.data ?? []}
              isLoading={isPending}
              onResetPassword={setResetPasswordUser}
              onDelete={setPendingDelete}
            />
          </div>
          {data && data.pagination.totalPages > 1 ? (
            <PaginationControls
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      <ResetPasswordDialog
        user={resetPasswordUser}
        onOpenChange={(open) => {
          if (!open) setResetPasswordUser(null)
        }}
      />

      <DeleteUserDialog
        user={pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={handleDelete}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}
