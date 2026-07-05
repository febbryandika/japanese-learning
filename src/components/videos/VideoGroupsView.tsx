'use client'

import Link from 'next/link'

import { useLessonGroups } from '@/hooks/use-videos'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { LoadingState } from '@/components/LoadingState'

// One gradient per tile header, cycled by index (Sumi Night video palette).
const GRADIENTS = [
  'linear-gradient(135deg, oklch(0.42 0.13 265), oklch(0.3 0.09 290))',
  'linear-gradient(135deg, oklch(0.4 0.13 200), oklch(0.3 0.1 250))',
  'linear-gradient(135deg, oklch(0.44 0.13 60), oklch(0.34 0.11 40))',
  'linear-gradient(135deg, oklch(0.42 0.13 158), oklch(0.3 0.1 190))',
  'linear-gradient(135deg, oklch(0.42 0.14 330), oklch(0.32 0.11 300))',
  'linear-gradient(135deg, oklch(0.4 0.12 25), oklch(0.32 0.1 350))',
  'linear-gradient(135deg, oklch(0.38 0.1 230), oklch(0.28 0.08 270))',
]

export function VideoGroupsView() {
  const { data: groups, isPending, isError, refetch } = useLessonGroups()

  if (isPending) {
    return <LoadingState count={6} itemClassName="h-44" />
  }

  if (isError) {
    return <ErrorState message="Couldn't load lesson groups." onRetry={refetch} />
  }

  if (groups.length === 0) {
    return <EmptyState message="No lesson groups are available yet." />
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group, index) => (
        <li key={group.id}>
          <Link
            href={`/videos/${group.slug}`}
            className="block overflow-hidden rounded-2xl border bg-card transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_30px_-14px_var(--ring)]"
          >
            <div
              className="grid aspect-video place-items-center"
              style={{ background: GRADIENTS[index % GRADIENTS.length] }}
            >
              <span
                className="jp text-6xl leading-none font-semibold text-white/20"
                lang="ja"
                aria-hidden
              >
                {group.title.charAt(0)}
              </span>
            </div>
            <div className="px-4 py-3.5">
              <p className="jp truncate text-sm font-semibold" lang="ja">
                {group.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {group.lessonCount} {group.lessonCount === 1 ? 'lesson' : 'lessons'}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
