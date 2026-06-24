'use client'

import { Bookmark, BookmarkCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useBookmarkStatus, useToggleBookmark } from '@/hooks/use-bookmarks'
import type { BookmarkTargetType } from '@/lib/validations'

export function BookmarkButton({
  targetType,
  targetId,
  bookmarked,
  className,
}: {
  targetType: BookmarkTargetType
  targetId: string
  // When provided (e.g. the bookmarks page), it's the source of truth and the
  // detail cache is ignored. On detail pages it's omitted and read from cache.
  bookmarked?: boolean
  className?: string
}) {
  const statusFromCache = useBookmarkStatus(targetType, targetId)
  const isBookmarked = bookmarked ?? statusFromCache
  const toggle = useToggleBookmark()

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      disabled={toggle.isPending}
      className={className}
      onClick={() => {
        toggle.mutate(
          { targetType, targetId, bookmarked: isBookmarked },
          {
            onError: () =>
              toast.error('Could not update bookmark. Please try again.'),
          },
        )
      }}
    >
      {isBookmarked ? (
        <BookmarkCheck className="size-4 fill-current" aria-hidden />
      ) : (
        <Bookmark className="size-4" aria-hidden />
      )}
    </Button>
  )
}
