import Link from 'next/link'
import { Play } from 'lucide-react'

import type { VideoBookmarkItem } from '@/hooks/use-bookmarks'

// Sumi Night video row (used on the bookmarks page): play square, lesson title,
// group tag.
export function VideoLessonCard({ lesson }: { lesson: VideoBookmarkItem }) {
  return (
    <Link
      href={`/videos/${lesson.groupSlug}/${lesson.id}`}
      className="flex items-center gap-4 rounded-2xl border bg-card px-4.5 py-3.5 transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-primary"
    >
      <span className="grid size-[46px] shrink-0 place-items-center rounded-xl bg-secondary">
        <Play className="size-4 text-primary" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate pr-8 text-sm font-semibold">
          {lesson.title}
        </span>
        <span className="jp mt-0.5 block text-xs text-muted-foreground" lang="ja">
          {lesson.groupTitle}
        </span>
      </span>
    </Link>
  )
}
