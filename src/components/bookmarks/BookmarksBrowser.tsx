'use client'

import { useState } from 'react'

import { useBookmarks, type BookmarkSummary } from '@/hooks/use-bookmarks'
import { BookmarkButton } from '@/components/BookmarkButton'
import { KanjiCard } from '@/components/KanjiCard'
import { VocabularyCard } from '@/components/VocabularyCard'
import { GrammarCard } from '@/components/GrammarCard'
import { VideoLessonCard } from '@/components/VideoLessonCard'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BookmarkTargetType } from '@/lib/validations'

type FilterValue = 'all' | BookmarkTargetType

const FILTER_ITEMS: Record<string, string> = {
  all: 'All bookmarks',
  kanji: 'Kanji',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  video_lesson: 'Video lessons',
}

// Fixed section order so the grouped view is stable regardless of bookmark age.
const GROUP_ORDER: BookmarkTargetType[] = [
  'kanji',
  'vocabulary',
  'grammar',
  'video_lesson',
]

export function BookmarksBrowser() {
  const [filter, setFilter] = useState<FilterValue>('all')
  const { data, isPending, isError, refetch } = useBookmarks(
    filter === 'all' ? undefined : filter,
  )

  return (
    <div className="space-y-6">
      <Select
        items={FILTER_ITEMS}
        value={filter}
        onValueChange={(value) => setFilter(value as FilterValue)}
      >
        <SelectTrigger className="w-52" aria-label="Filter bookmarks by type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(FILTER_ITEMS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <BookmarkResults
        data={data}
        filter={filter}
        isPending={isPending}
        isError={isError}
        onRetry={refetch}
      />
    </div>
  )
}

function BookmarkResults({
  data,
  filter,
  isPending,
  isError,
  onRetry,
}: {
  data: BookmarkSummary[] | undefined
  filter: FilterValue
  isPending: boolean
  isError: boolean
  onRetry: () => void
}) {
  if (isPending) {
    return <CardGridSkeleton />
  }

  if (isError || !data) {
    return (
      <ErrorState message="Couldn't load your bookmarks." onRetry={onRetry} />
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        message={
          filter === 'all'
            ? 'No bookmarks yet. Open a kanji, vocabulary, grammar, or video lesson and tap the bookmark icon.'
            : `No ${(FILTER_ITEMS[filter] ?? 'items').toLowerCase()} bookmarked yet.`
        }
      />
    )
  }

  // The list arrives newest-first; grouping preserves that order within a type.
  const groups = GROUP_ORDER.map((type) => ({
    type,
    items: data.filter((bookmark) => bookmark.targetType === type),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.type} className="space-y-3">
          <h2 className="text-lg font-semibold">
            {FILTER_ITEMS[group.type] ?? group.type}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((bookmark) => (
              <li
                key={`${bookmark.targetType}-${bookmark.targetId}`}
                className="relative"
              >
                <BookmarkCard bookmark={bookmark} />
                <BookmarkButton
                  targetType={bookmark.targetType}
                  targetId={bookmark.targetId}
                  bookmarked
                  className="absolute top-2 right-2 z-10 bg-background"
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function BookmarkCard({ bookmark }: { bookmark: BookmarkSummary }) {
  switch (bookmark.targetType) {
    case 'kanji':
      return <KanjiCard kanji={bookmark.item} />
    case 'vocabulary':
      return <VocabularyCard vocab={bookmark.item} />
    case 'grammar':
      return <GrammarCard grammar={bookmark.item} />
    case 'video_lesson':
      return <VideoLessonCard lesson={bookmark.item} />
  }
}

function CardGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  )
}
