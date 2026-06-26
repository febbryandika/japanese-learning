'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  createVideoSchema,
  type CreateVideoFormValues,
  type CreateVideoInput,
} from '@/lib/validations'
import {
  useAdminLessonGroups,
  type AdminLessonGroup,
} from '@/hooks/use-admin-lesson-groups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type VideoFormProps = {
  defaultValues?: Partial<CreateVideoInput>
  onSubmit: (values: CreateVideoInput) => void
  submitting: boolean
}

export function VideoForm(props: VideoFormProps) {
  // Groups are needed for the picker; mount the real form only once they load so
  // useForm's defaults can include a valid lessonGroupId (no post-mount effect).
  const { data, isPending, isError } = useAdminLessonGroups({
    page: 1,
    pageSize: 100,
  })

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading lesson groups…</p>
  }
  if (isError || !data) {
    return <p className="text-sm text-destructive">Couldn’t load lesson groups.</p>
  }
  if (data.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Create a lesson group first, then add videos to it.
      </p>
    )
  }

  return <VideoFormInner {...props} groups={data.data} />
}

function VideoFormInner({
  groups,
  defaultValues,
  onSubmit,
  submitting,
}: VideoFormProps & { groups: AdminLessonGroup[] }) {
  // base-ui Select renders the label for the current value from this map; without
  // it, SelectValue would show the raw group id.
  const groupItems = Object.fromEntries(
    groups.map((group) => [group.id, group.title]),
  )

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateVideoFormValues, unknown, CreateVideoInput>({
    resolver: zodResolver(createVideoSchema),
    defaultValues: {
      lessonGroupId: defaultValues?.lessonGroupId ?? groups[0].id,
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? undefined,
      embedUrl: defaultValues?.embedUrl ?? undefined,
      durationSeconds: defaultValues?.durationSeconds ?? undefined,
      sortOrder: defaultValues?.sortOrder ?? 0,
      isPublished: defaultValues?.isPublished ?? false,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="v-title">Title</Label>
        <Input
          id="v-title"
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
        <Label htmlFor="v-group">Lesson group</Label>
        <Controller
          name="lessonGroupId"
          control={control}
          render={({ field }) => (
            <Select
              items={groupItems}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="v-group"
                className="w-full"
                aria-invalid={Boolean(errors.lessonGroupId)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="v-embed">Embed URL</Label>
        <Input
          id="v-embed"
          placeholder="https://drive.google.com/…"
          aria-invalid={Boolean(errors.embedUrl)}
          {...register('embedUrl', {
            setValueAs: (v) => (v === '' || v == null ? undefined : v),
          })}
        />
        {errors.embedUrl ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.embedUrl.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="v-desc">Description</Label>
        <Textarea
          id="v-desc"
          rows={3}
          {...register('description', {
            setValueAs: (v) => (v === '' || v == null ? undefined : v),
          })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="v-duration">Duration (seconds)</Label>
          <Input
            id="v-duration"
            type="number"
            inputMode="numeric"
            aria-invalid={Boolean(errors.durationSeconds)}
            {...register('durationSeconds', {
              setValueAs: (v) => (v === '' || v == null ? undefined : Number(v)),
            })}
          />
          {errors.durationSeconds ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.durationSeconds.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="v-sort">Sort order</Label>
          <Input
            id="v-sort"
            type="number"
            inputMode="numeric"
            {...register('sortOrder', {
              setValueAs: (v) => (v === '' || v == null ? 0 : Number(v)),
            })}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Controller
          name="isPublished"
          control={control}
          render={({ field }) => (
            <Switch
              id="v-pub"
              checked={field.value ?? false}
              onCheckedChange={(checked) => field.onChange(checked)}
            />
          )}
        />
        <Label htmlFor="v-pub">Published</Label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
