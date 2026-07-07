'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { useCreateUser } from '@/hooks/use-admin-users'
import { AdminApiError } from '@/hooks/admin-api'
import type { CreateUserInput } from '@/lib/validations'
import { UserForm } from '@/components/admin/UserForm'

export function NewUserForm() {
  const router = useRouter()
  const createMutation = useCreateUser()

  function handleSubmit(values: CreateUserInput) {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('User created')
        router.push('/admin/users')
      },
      onError: (error) => {
        toast.error(
          error instanceof AdminApiError ? error.message : 'Could not create user',
        )
      },
    })
  }

  return (
    <UserForm
      mode="create"
      onSubmit={handleSubmit}
      submitting={createMutation.isPending}
    />
  )
}
