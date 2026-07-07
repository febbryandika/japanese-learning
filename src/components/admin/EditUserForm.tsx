'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { useAdminUser, useUpdateUser } from '@/hooks/use-admin-users'
import { AdminApiError } from '@/hooks/admin-api'
import type { UpdateUserInput } from '@/lib/validations'
import { UserForm } from '@/components/admin/UserForm'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ErrorState'

export function EditUserForm({ userId }: { userId: string }) {
  const router = useRouter()
  const { data: user, isPending, isError, error, refetch } = useAdminUser(userId)
  const updateMutation = useUpdateUser()

  function handleSubmit(values: UpdateUserInput) {
    updateMutation.mutate(
      { id: userId, input: values },
      {
        onSuccess: () => {
          toast.success('User updated')
          router.push('/admin/users')
        },
        onError: (error) => {
          toast.error(
            error instanceof AdminApiError ? error.message : 'Could not update user',
          )
        },
      },
    )
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full max-w-sm" />
        <Skeleton className="h-8 w-full max-w-sm" />
        <Skeleton className="h-8 w-full max-w-xs" />
      </div>
    )
  }

  if (isError) {
    if (error instanceof AdminApiError && error.status === 404) {
      return <p className="text-sm text-muted-foreground">User not found.</p>
    }
    return <ErrorState message="Couldn’t load user." onRetry={refetch} />
  }

  return (
    <UserForm
      mode="edit"
      defaultValues={{
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      }}
      onSubmit={handleSubmit}
      submitting={updateMutation.isPending}
    />
  )
}
