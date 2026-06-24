import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { VideoBookmarkItem } from '@/hooks/use-bookmarks'

export function VideoLessonCard({ lesson }: { lesson: VideoBookmarkItem }) {
  return (
    <Link
      href={`/videos/${lesson.groupSlug}/${lesson.id}`}
      className="block rounded-xl"
    >
      <Card className="h-full transition-colors hover:border-ring">
        <CardContent className="space-y-2 py-4">
          <p className="line-clamp-2 pr-8 font-medium">{lesson.title}</p>
          <Badge variant="secondary" lang="ja">
            {lesson.groupTitle}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  )
}
