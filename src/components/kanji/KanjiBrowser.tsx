'use client'

import { useKanjiList } from '@/hooks/use-kanji'
import { useListUrlState } from '@/hooks/use-list-url-state'
import type { StudyProgressState } from '@/lib/validations'
import { KanjiCard } from '@/components/KanjiCard'
import { PageHeader } from '@/components/PageHeader'
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
    <div>
      <PageHeader title="Kanji" jpTitle="漢字">
        <Input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search kanji, meaning, reading…"
          aria-label="Search kanji"
          className="w-56 rounded-full sm:w-64"
        />
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl px-6 py-6 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
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
            <SelectTrigger
              className="ml-auto rounded-full"
              aria-label="Filter by stroke count"
            >
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
    return <LoadingState count={12} className="sm:grid-cols-3 lg:grid-cols-4" itemClassName="h-48" />
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
        className={`grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 ${
          isPlaceholderData ? 'opacity-60 transition-opacity' : ''
        }`}
      >
        {data.data.map((kanji) => (
          <li key={kanji.id}>
            <KanjiCard kanji={kanji} />
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[12.5px] text-muted-foreground">
          Showing {data.data.length} of {data.pagination.total} kanji
        </span>
        <PaginationControls
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  )
}
