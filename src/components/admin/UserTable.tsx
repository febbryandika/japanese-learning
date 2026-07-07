'use client'

import Link from 'next/link'
import { ArrowDown, ArrowUp } from 'lucide-react'

import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable'
import { UserStatusBadge } from '@/components/admin/UserStatusBadge'
import { Button, buttonVariants } from '@/components/ui/button'
import { USER_ROLE_LABELS, USER_SORT_FIELDS, type UserSortField } from '@/lib/validations'
import type { AdminUser } from '@/services/admin/user.service'

const SORT_LABELS: Record<UserSortField, string> = {
  name: 'Name',
  email: 'Email',
  role: 'Role',
  status: 'Status',
  createdAt: 'Created',
}

function formatCreatedAt(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

// AdminTable's AdminColumn only accepts a plain string header (shared by seven
// other managers), so per-column sort controls live in a compact group above
// the table rather than extending that type just for this one consumer.
export function UserSortControls({
  sortBy,
  sortDir,
  onSortChange,
}: {
  sortBy: UserSortField
  sortDir: 'asc' | 'desc'
  onSortChange: (field: UserSortField) => void
}) {
  return (
    <div
      role="group"
      aria-label="Sort users"
      className="flex flex-wrap items-center gap-1.5"
    >
      <span className="text-sm text-muted-foreground">Sort by</span>
      {USER_SORT_FIELDS.map((field) => {
        const active = field === sortBy
        return (
          <Button
            key={field}
            type="button"
            variant={active ? 'secondary' : 'outline'}
            size="sm"
            aria-pressed={active}
            onClick={() => onSortChange(field)}
          >
            {SORT_LABELS[field]}
            {active ? (
              sortDir === 'asc' ? (
                <ArrowUp className="size-3.5" aria-hidden />
              ) : (
                <ArrowDown className="size-3.5" aria-hidden />
              )
            ) : null}
          </Button>
        )
      })}
    </div>
  )
}

export function UserTable({
  users,
  isLoading,
  onResetPassword,
  onDelete,
}: {
  users: AdminUser[]
  isLoading: boolean
  onResetPassword: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
}) {
  const columns: AdminColumn<AdminUser>[] = [
    {
      header: 'Name',
      cell: (u) => <span className="font-medium">{u.name}</span>,
    },
    {
      header: 'Email',
      cell: (u) => <span className="text-muted-foreground">{u.email}</span>,
    },
    {
      header: 'Role',
      className: 'w-28',
      cell: (u) => USER_ROLE_LABELS[u.role],
    },
    {
      header: 'Status',
      className: 'w-28',
      cell: (u) => <UserStatusBadge status={u.status} />,
    },
    {
      header: 'Created',
      className: 'w-44',
      cell: (u) => formatCreatedAt(u.createdAt),
    },
    {
      header: 'Actions',
      className: 'w-64 text-right',
      cell: (u) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/admin/users/${u.id}/edit`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Edit
          </Link>
          <Button variant="outline" size="sm" onClick={() => onResetPassword(u)}>
            Reset password
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(u)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AdminTable
      columns={columns}
      rows={users}
      getRowId={(u) => u.id}
      isLoading={isLoading}
      emptyMessage="No users yet."
    />
  )
}
