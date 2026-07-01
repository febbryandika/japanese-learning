'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import type { SearchGroup, SearchResponse, SearchVideoItem } from '@/hooks/use-search'
import type { SearchType } from '@/lib/validations'
import { ErrorState } from '@/components/ErrorState'
import { GrammarCard } from '@/components/GrammarCard'
import { KanjiCard } from '@/components/KanjiCard'
import { PaginationControls } from '@/components/PaginationControls'
import { ProgressBadge } from '@/components/ProgressBadge'
import { VocabularyCard } from '@/components/VocabularyCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const TYPE_LABELS: Record<SearchType, string> = {
  kanji: 'Kanji',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  video: 'Videos',
}

export function SearchResults({
  data,
  hasCriteria,
  isPending,
  isError,
  isPlaceholderData,
  onRetry,
  onPageChange,
  onSelectType,
}: {
  data: SearchResponse | undefined
  hasCriteria: boolean
  isPending: boolean
  isError: boolean
  isPlaceholderData: boolean
  onRetry: () => void
  onPageChange: (page: number) => void
  onSelectType: (type: SearchType) => void
}) {
  // The query is disabled until there's something to search for.
  if (!hasCriteria) {
    return (
      <p className="text-muted-foreground">
        Enter a search term or pick a filter to search across kanji, vocabulary,
        grammar, and videos.
      </p>
    )
  }

  if (isPending) {
    return <ResultsSkeleton />
  }

  if (isError || !data) {
    return <ErrorState message="Couldn't run the search." onRetry={onRetry} />
  }

  const totalHits = data.groups.reduce((sum, group) => sum + group.items.length, 0)
  if (totalHits === 0) {
    return <p className="text-muted-foreground">No results match your search.</p>
  }

  const dim = isPlaceholderData ? 'opacity-60 transition-opacity' : ''

  // Single-type mode: one group with pagination.
  if (data.type && data.pagination) {
    const group = data.groups[0]
    return (
      <div className="space-y-6">
        <div className={dim}>
          <GroupGrid group={group} />
        </div>
        <PaginationControls
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={onPageChange}
        />
      </div>
    )
  }

  // Grouped mode: a preview section per type that has matches.
  return (
    <div className={`space-y-8 ${dim}`}>
      {data.groups
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section key={group.type} className="space-y-3" aria-label={TYPE_LABELS[group.type]}>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">{TYPE_LABELS[group.type]}</h2>
              <span className="text-sm text-muted-foreground">
                {group.total} {group.total === 1 ? 'result' : 'results'}
              </span>
            </div>
            <GroupGrid group={group} />
            {group.total > group.items.length ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectType(group.type)}
              >
                View all {group.total} {TYPE_LABELS[group.type].toLowerCase()}
              </Button>
            ) : null}
          </section>
        ))}
    </div>
  )
}

function GroupGrid({ group }: { group: SearchGroup }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {group.type === 'kanji' &&
        group.items.map((item) => (
          <li key={item.id}>
            <KanjiCard kanji={item} />
          </li>
        ))}
      {group.type === 'vocabulary' &&
        group.items.map((item) => (
          <li key={item.id}>
            <VocabularyCard vocab={item} />
          </li>
        ))}
      {group.type === 'grammar' &&
        group.items.map((item) => (
          <li key={item.id}>
            <GrammarCard grammar={item} />
          </li>
        ))}
      {group.type === 'video' &&
        group.items.map((item) => (
          <li key={item.id}>
            <SearchVideoCard video={item} />
          </li>
        ))}
    </ul>
  )
}

function SearchVideoCard({ video }: { video: SearchVideoItem }) {
  return (
    <Link
      href={`/videos/${video.groupSlug}/${video.id}`}
      className="block rounded-xl"
    >
      <Card className="h-full transition-colors hover:border-ring">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">{video.title}</p>
            <p className="text-xs text-muted-foreground">{video.groupTitle}</p>
            <ProgressBadge state={video.progressState} />
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </CardContent>
      </Card>
    </Link>
  )
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  )
}
