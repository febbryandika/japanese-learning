'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { useUpdateVideoProgress, useVideoLesson } from '@/hooks/use-videos'
import { VideoPlayer } from '@/components/VideoPlayer'
import { BookmarkButton } from '@/components/BookmarkButton'
import { ProgressBadge } from '@/components/ProgressBadge'
import { ErrorState } from '@/components/videos/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDuration } from '@/lib/utils'

export function LessonDetailView({
  lessonId,
  groupSlug,
}: {
  lessonId: string
  groupSlug: string
}) {
  const { data: lesson, isPending, isError, refetch } = useVideoLesson(lessonId)
  const updateProgress = useUpdateVideoProgress(lessonId, lesson?.lessonGroupId)

  if (isPending) {
    return <DetailSkeleton />
  }

  if (isError || !lesson) {
    return <ErrorState message="Couldn't load this lesson." onRetry={refetch} />
  }

  const duration = formatDuration(lesson.durationSeconds)

  function handleMarkInProgress() {
    updateProgress.mutate('in_progress')
  }

  function handleMarkCompleted() {
    updateProgress.mutate('completed')
  }

  return (
    <article className="space-y-6">
      <Link
        href={`/videos/${groupSlug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to {lesson.group.title}
      </Link>

      <VideoPlayer embedUrl={lesson.embedUrl} title={lesson.title} />

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{lesson.title}</h1>
          <ProgressBadge state={lesson.progressState} />
        </div>
        {duration ? (
          <p className="text-sm text-muted-foreground">{duration}</p>
        ) : null}
        {lesson.description ? (
          <p className="text-muted-foreground">{lesson.description}</p>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={handleMarkInProgress}
          disabled={
            updateProgress.isPending || lesson.progressState === 'in_progress'
          }
        >
          Mark in progress
        </Button>
        <Button
          onClick={handleMarkCompleted}
          disabled={
            updateProgress.isPending || lesson.progressState === 'completed'
          }
        >
          Mark completed
        </Button>
        <BookmarkButton
          targetType="video_lesson"
          targetId={lesson.id}
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
