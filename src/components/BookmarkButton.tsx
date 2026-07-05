'use client'

import { Bookmark, BookmarkCheck } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useBookmarkStatus, useToggleBookmark } from '@/hooks/use-bookmarks'
import type { BookmarkTargetType } from '@/lib/validations'

export function BookmarkButton({
  targetType,
  targetId,
  bookmarked,
  showLabel = false,
  className,
}: {
  targetType: BookmarkTargetType
  targetId: string
  // When provided (e.g. the bookmarks page), it's the source of truth and the
  // detail cache is ignored. On detail pages it's omitted and read from cache.
  bookmarked?: boolean
  // Detail pages show the labeled design button; list rows stay icon-only.
  showLabel?: boolean
  className?: string
}) {
  const statusFromCache = useBookmarkStatus(targetType, targetId)
  const isBookmarked = bookmarked ?? statusFromCache
  const toggle = useToggleBookmark()

  return (
    <Button
      type="button"
      variant="outline"
      size={showLabel ? 'default' : 'icon'}
      aria-pressed={isBookmarked}
      aria-label={showLabel ? undefined : isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      disabled={toggle.isPending}
      className={cn(
        'rounded-[11px]',
        // Bookmarked state: warm amber fill (the design's .btn.on).
        isBookmarked &&
          'border-transparent bg-[var(--mp-progress-bg)] text-[var(--mp-progress-fg)] hover:bg-[var(--mp-progress-bg)] hover:text-[var(--mp-progress-fg)]',
        className,
      )}
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
      {showLabel ? (isBookmarked ? 'Bookmarked' : 'Bookmark') : null}
    </Button>
  )
}
