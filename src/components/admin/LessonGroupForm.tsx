'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  createLessonGroupSchema,
  type CreateLessonGroupFormValues,
  type CreateLessonGroupInput,
} from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function LessonGroupForm({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: Partial<CreateLessonGroupInput>
  onSubmit: (values: CreateLessonGroupInput) => void
  submitting: boolean
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateLessonGroupFormValues, unknown, CreateLessonGroupInput>({
    resolver: zodResolver(createLessonGroupSchema),
    defaultValues: {
      slug: defaultValues?.slug ?? '',
      title: defaultValues?.title ?? '',
      sortOrder: defaultValues?.sortOrder ?? 0,
      isPublished: defaultValues?.isPublished ?? false,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lg-title">Title</Label>
        <Input
          id="lg-title"
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
        <Label htmlFor="lg-slug">Slug</Label>
        <Input
          id="lg-slug"
          placeholder="e.g. grammar"
          aria-invalid={Boolean(errors.slug)}
          {...register('slug')}
        />
        {errors.slug ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.slug.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lg-sort">Sort order</Label>
        <Input
          id="lg-sort"
          type="number"
          inputMode="numeric"
          aria-invalid={Boolean(errors.sortOrder)}
          {...register('sortOrder', {
            setValueAs: (v) => (v === '' || v == null ? 0 : Number(v)),
          })}
        />
        {errors.sortOrder ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.sortOrder.message}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <Controller
          name="isPublished"
          control={control}
          render={({ field }) => (
            <Switch
              id="lg-pub"
              checked={field.value ?? false}
              onCheckedChange={(checked) => field.onChange(checked)}
            />
          )}
        />
        <Label htmlFor="lg-pub">Published</Label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
