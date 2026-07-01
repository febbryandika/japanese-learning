'use client'

import { useGrammarList } from '@/hooks/use-grammar'
import { useListUrlState } from '@/hooks/use-list-url-state'
import type { JlptLevel, StudyProgressState } from '@/lib/validations'
import { GrammarCard } from '@/components/GrammarCard'
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

export function GrammarBrowser() {
  const { q, searchInput, setSearchInput, page, setPage, getParam, setParam } =
    useListUrlState()

  const jlptLevel = getParam('jlptLevel') as JlptLevel | undefined
  const progressState = getParam('progressState') as StudyProgressState | undefined
  const bookmarked = getParam('bookmarked') === 'true'

  const { data, isPending, isError, isPlaceholderData, refetch } =
    useGrammarList({
      q: q || undefined,
      jlptLevel,
      progressState,
      bookmarked: bookmarked || undefined,
      page,
      pageSize: PAGE_SIZE,
    })

  const jlptLevels = data?.jlptLevels ?? []
  const levelItems: Record<string, string> = {
    all: 'All levels',
    ...Object.fromEntries(jlptLevels.map((level) => [level, level])),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by pattern or meaning"
          aria-label="Search grammar"
          className="sm:max-w-xs"
        />
        <Select
          items={levelItems}
          value={jlptLevel ?? 'all'}
          onValueChange={(value) =>
            setParam(
              'jlptLevel',
              value == null || value === 'all' ? undefined : value,
            )
          }
        >
          <SelectTrigger className="w-48" aria-label="Filter by JLPT level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(levelItems).map(([value, label]) => (
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

      <GrammarResults
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

function GrammarResults({
  data,
  isPending,
  isError,
  isPlaceholderData,
  onRetry,
  onPageChange,
}: {
  data: ReturnType<typeof useGrammarList>['data']
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
    return <ErrorState message="Couldn't load grammar." onRetry={onRetry} />
  }

  if (data.data.length === 0) {
    return <EmptyState message="No grammar matches your search." />
  }

  return (
    <div className="space-y-6">
      <ul
        className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
          isPlaceholderData ? 'opacity-60 transition-opacity' : ''
        }`}
      >
        {data.data.map((grammar) => (
          <li key={grammar.id}>
            <GrammarCard grammar={grammar} />
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
