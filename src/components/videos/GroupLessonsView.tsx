'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { useVideoLessons } from '@/hooks/use-videos'
import { ProgressBadge } from '@/components/ProgressBadge'
import { ErrorState } from '@/components/ErrorState'
import { Card, CardContent } from '@/components/ui/card'
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
    return <p className="text-muted-foreground">No lessons in this group yet.</p>
  }

  return (
    <ul className="space-y-3">
      {lessons.map((lesson) => {
        const duration = formatDuration(lesson.durationSeconds)
        return (
          <li key={lesson.id}>
            <Link href={`/videos/${groupSlug}/${lesson.id}`} className="block rounded-xl">
              <Card className="transition-colors hover:border-ring">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{lesson.title}</p>
                    {duration ? (
                      <p className="text-sm text-muted-foreground">{duration}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <ProgressBadge state={lesson.progressState} />
                    <ChevronRight
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                </CardContent>
              </Card>
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
