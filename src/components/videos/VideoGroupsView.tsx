'use client'

import Link from 'next/link'

import { useLessonGroups } from '@/hooks/use-videos'
import { ErrorState } from '@/components/ErrorState'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function VideoGroupsView() {
  const { data: groups, isPending, isError, refetch } = useLessonGroups()

  if (isPending) {
    return <GroupGridSkeleton />
  }

  if (isError) {
    return <ErrorState message="Couldn't load lesson groups." onRetry={refetch} />
  }

  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground">No lesson groups are available yet.</p>
    )
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <li key={group.id}>
          <Link href={`/videos/${group.slug}`} className="block rounded-xl">
            <Card className="h-full transition-colors hover:border-ring">
              <CardHeader>
                <CardTitle>{group.title}</CardTitle>
                <CardDescription>
                  {group.lessonCount}{' '}
                  {group.lessonCount === 1 ? 'lesson' : 'lessons'}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function GroupGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  )
}
