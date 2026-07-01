'use client'

import { useKanjiList } from '@/hooks/use-kanji'
import { useListUrlState } from '@/hooks/use-list-url-state'
import type { StudyProgressState } from '@/lib/validations'
import { KanjiCard } from '@/components/KanjiCard'
import { PaginationControls } from '@/components/PaginationControls'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { LoadingState } from '@/components/LoadingState'
import { MasteryFilter } from '@/components/MasteryFilter'
import { BookmarkedToggle } from '@/components/BookmarkedToggle'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PAGE_SIZE = 24

export function KanjiBrowser() {
  const { q, searchInput, setSearchInput, page, setPage, getParam, setParam } =
    useListUrlState()

  const strokeParam = getParam('strokeCount')
  const strokeCount = strokeParam ? Number(strokeParam) : undefined
  const progressState = getParam('progressState') as StudyProgressState | undefined
  const bookmarked = getParam('bookmarked') === 'true'

  const { data, isPending, isError, isPlaceholderData, refetch } = useKanjiList({
    q: q || undefined,
    strokeCount,
    progressState,
    bookmarked: bookmarked || undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const strokeCounts = data?.strokeCounts ?? []
  const strokeItems: Record<string, string> = {
    all: 'All stroke counts',
    ...Object.fromEntries(strokeCounts.map((n) => [String(n), `${n} strokes`])),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by character, reading, or meaning"
          aria-label="Search kanji"
          className="sm:max-w-xs"
        />
        <Select
          items={strokeItems}
          value={strokeCount == null ? 'all' : String(strokeCount)}
          onValueChange={(value) =>
            setParam(
              'strokeCount',
              value == null || value === 'all' ? undefined : value,
            )
          }
        >
          <SelectTrigger className="w-48" aria-label="Filter by stroke count">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(strokeItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <MasteryFilter
          value={progressState}
          onChange={(value) => setParam('progressState', value)}
        />
        <BookmarkedToggle
          active={bookmarked}
          onToggle={(active) =>
            setParam('bookmarked', active ? 'true' : undefined)
          }
        />
      </div>

      <KanjiResults
        data={data}
        isPending={isPending}
        isError={isError}
        isPlaceholderData={isPlaceholderData}
        onRetry={refetch}
        onPageChange={setPage}
      />
    </div>
  )
}

function KanjiResults({
  data,
  isPending,
  isError,
  isPlaceholderData,
  onRetry,
  onPageChange,
}: {
  data: ReturnType<typeof useKanjiList>['data']
  isPending: boolean
  isError: boolean
  isPlaceholderData: boolean
  onRetry: () => void
  onPageChange: (page: number) => void
}) {
  if (isPending) {
    return <LoadingState count={9} />
  }

  if (isError || !data) {
    return <ErrorState message="Couldn't load kanji." onRetry={onRetry} />
  }

  if (data.data.length === 0) {
    return <EmptyState message="No kanji match your search." />
  }

  return (
    <div className="space-y-6">
      <ul
        className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
          isPlaceholderData ? 'opacity-60 transition-opacity' : ''
        }`}
      >
        {data.data.map((kanji) => (
          <li key={kanji.id}>
            <KanjiCard kanji={kanji} />
          </li>
        ))}
      </ul>
      <PaginationControls
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        onPageChange={onPageChange}
      />
    </div>
  )
}
