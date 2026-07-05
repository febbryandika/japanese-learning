'use client'

import Link from 'next/link'
import { ChevronRight, Play } from 'lucide-react'

import { useVideoLessons } from '@/hooks/use-videos'
import { ProgressBadge } from '@/components/ProgressBadge'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDuration } from '@/lib/utils'

export function GroupLessonsView({
  groupId,
  groupSlug,
}: {
  groupId: string
  groupSlug: string
}) {
  const { data: lessons, isPending, isError, refetch } = useVideoLessons(groupId)

  if (isPending) {
    return <ListSkeleton />
  }

  if (isError) {
    return <ErrorState message="Couldn't load lessons." onRetry={refetch} />
  }

  if (lessons.length === 0) {
    return <EmptyState message="No lessons in this group yet." />
  }

  return (
    <ul className="space-y-3">
      {lessons.map((lesson) => {
        const duration = formatDuration(lesson.durationSeconds)
        return (
          <li key={lesson.id}>
            <Link
              href={`/videos/${groupSlug}/${lesson.id}`}
              className="flex items-center gap-4 rounded-2xl border bg-card px-4.5 py-4 transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-primary"
            >
              <span className="grid size-[46px] shrink-0 place-items-center rounded-xl bg-secondary">
                <Play className="size-4 text-primary" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {lesson.title}
                </span>
                {duration ? (
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {duration}
                  </span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <ProgressBadge state={lesson.progressState} />
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  )
}
