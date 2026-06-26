'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  createMockExamSchema,
  type CreateMockExamFormValues,
  type CreateMockExamInput,
} from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

export function MockExamForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = 'Save',
}: {
  defaultValues?: Partial<CreateMockExamInput>
  onSubmit: (values: CreateMockExamInput) => void
  submitting: boolean
  submitLabel?: string
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateMockExamFormValues, unknown, CreateMockExamInput>({
    resolver: zodResolver(createMockExamSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? undefined,
      timeLimitMinutes: defaultValues?.timeLimitMinutes ?? 90,
      isPublished: defaultValues?.isPublished ?? false,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="me-title">Title</Label>
        <Input
          id="me-title"
          aria-invalid={Boolean(errors.title)}
          {...register('title')}
        />
        {errors.title ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="me-desc">Description</Label>
        <Textarea
          id="me-desc"
          rows={2}
          {...register('description', {
            setValueAs: (v) => (v === '' ? null : v),
          })}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="space-y-2">
          <Label htmlFor="me-time">Time limit (minutes)</Label>
          <Input
            id="me-time"
            type="number"
            inputMode="numeric"
            className="w-32"
            aria-invalid={Boolean(errors.timeLimitMinutes)}
            {...register('timeLimitMinutes', {
              setValueAs: (v) => (v === '' || v == null ? 90 : Number(v)),
            })}
          />
          {errors.timeLimitMinutes ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.timeLimitMinutes.message}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Controller
            name="isPublished"
            control={control}
            render={({ field }) => (
              <Switch
                id="me-pub"
                checked={field.value ?? false}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
            )}
          />
          <Label htmlFor="me-pub">Published</Label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
