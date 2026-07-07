'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  createUserSchema,
  updateUserSchema,
  USER_ROLE_LABELS,
  USER_ROLES,
  USER_STATUS_LABELS,
  USER_STATUSES,
  type CreateUserFormValues,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const roleItems = USER_ROLE_LABELS
const statusItems = USER_STATUS_LABELS

type CreateDefaults = { name?: string; email?: string; role?: CreateUserInput['role'] }
type EditDefaults = {
  name?: string
  email?: string
  role?: UpdateUserInput['role']
  status?: UpdateUserInput['status']
}

type UserFormProps =
  | {
      mode: 'create'
      defaultValues?: CreateDefaults
      onSubmit: (values: CreateUserInput) => void
      submitting: boolean
    }
  | {
      mode: 'edit'
      defaultValues?: EditDefaults
      onSubmit: (values: UpdateUserInput) => void
      submitting: boolean
    }

export function UserForm(props: UserFormProps) {
  if (props.mode === 'create') {
    return <CreateUserFormFields {...props} />
  }
  return <EditUserFormFields {...props} />
}

function CreateUserFormFields({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: CreateDefaults
  onSubmit: (values: CreateUserInput) => void
  submitting: boolean
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateUserFormValues, unknown, CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      password: '',
      role: defaultValues?.role ?? 'learner',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="u-name">Name</Label>
        <Input
          id="u-name"
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
        {errors.name ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="u-email">Email</Label>
        <Input
          id="u-email"
          type="email"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="u-password">Password</Label>
        <Input
          id="u-password"
          type="password"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="u-role">Role</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select
              items={roleItems}
              value={field.value ?? 'learner'}
              onValueChange={field.onChange}
            >
              <SelectTrigger id="u-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {USER_ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Create user'}
        </Button>
      </div>
    </form>
  )
}

function EditUserFormFields({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: EditDefaults
  onSubmit: (values: UpdateUserInput) => void
  submitting: boolean
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      role: defaultValues?.role ?? 'learner',
      status: defaultValues?.status ?? 'active',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="u-name">Name</Label>
        <Input
          id="u-name"
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
        {errors.name ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="u-email">Email</Label>
        <Input
          id="u-email"
          type="email"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="u-role">Role</Label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                items={roleItems}
                value={field.value ?? 'learner'}
                onValueChange={field.onChange}
              >
                <SelectTrigger id="u-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {USER_ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="u-status">Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                items={statusItems}
                value={field.value ?? 'active'}
                onValueChange={field.onChange}
              >
                <SelectTrigger id="u-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {USER_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
