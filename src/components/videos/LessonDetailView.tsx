'use client'

import { toast } from 'sonner'

import { useVideoLesson } from '@/hooks/use-videos'
import { useUpdateProgress } from '@/hooks/use-progress'
import { VideoPlayer } from '@/components/VideoPlayer'
import { BookmarkButton } from '@/components/BookmarkButton'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ProgressSelector } from '@/components/ProgressSelector'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { VIDEO_PROGRESS_STATES } from '@/lib/validations'
import { formatDuration } from '@/lib/utils'

export function LessonDetailView({
  lessonId,
  groupSlug,
}: {
  lessonId: string
  groupSlug: string
}) {
  const { data: lesson, isPending, isError, refetch } = useVideoLesson(lessonId)
  const updateProgress = useUpdateProgress()

  if (isPending) {
    return <DetailSkeleton />
  }

  if (isError || !lesson) {
    return <ErrorState message="Couldn't load this lesson." onRetry={refetch} />
  }

  const duration = formatDuration(lesson.durationSeconds)

  return (
    <article className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Videos', href: '/videos' },
          { label: lesson.group.title, href: `/videos/${groupSlug}` },
          { label: lesson.title },
        ]}
      />

      <div className="overflow-hidden rounded-2xl border">
        <VideoPlayer embedUrl={lesson.embedUrl} title={lesson.title} />
      </div>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{lesson.title}</h1>
        {duration ? (
          <p className="text-sm text-muted-foreground tabular-nums">{duration}</p>
        ) : null}
        {lesson.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {lesson.description}
          </p>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <ProgressSelector
          value={lesson.progressState}
          options={VIDEO_PROGRESS_STATES}
          disabled={updateProgress.isPending}
          onChange={(progressState) =>
            updateProgress.mutate(
              {
                targetType: 'video_lesson',
                targetId: lesson.id,
                progressState,
              },
              {
                onError: () =>
                  toast.error('Could not update progress. Please try again.'),
              },
            )
          }
        />
        <BookmarkButton
          targetType="video_lesson"
          targetId={lesson.id}
          showLabel
          className="ml-auto"
        />
      </div>
    </article>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="aspect-video w-full rounded-lg" />
      <Skeleton className="h-8 w-2/3" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  )
}
