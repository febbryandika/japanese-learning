'use client'

import { useGrammarList } from '@/hooks/use-grammar'
import { useListUrlState } from '@/hooks/use-list-url-state'
import type { JlptLevel, StudyProgressState } from '@/lib/validations'
import { GrammarCard } from '@/components/GrammarCard'
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
    <div>
      <PageHeader title="Grammar" jpTitle="文法">
        <Input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search pattern, meaning…"
          aria-label="Search grammar"
          className="w-56 rounded-full sm:w-64"
        />
      </PageHeader>

      <div className="mx-auto w-full max-w-5xl px-6 py-6 sm:px-8">
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
            items={levelItems}
            value={jlptLevel ?? 'all'}
            onValueChange={(value) =>
              setParam(
                'jlptLevel',
                value == null || value === 'all' ? undefined : value,
              )
            }
          >
            <SelectTrigger
              className="ml-auto rounded-full"
              aria-label="Filter by JLPT level"
            >
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
    return (
      <LoadingState count={6} className="sm:grid-cols-1 lg:grid-cols-1" itemClassName="h-20" />
    )
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
        className={`flex flex-col gap-3 ${
          isPlaceholderData ? 'opacity-60 transition-opacity' : ''
        }`}
      >
        {data.data.map((grammar) => (
          <li key={grammar.id}>
            <GrammarCard grammar={grammar} />
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[12.5px] text-muted-foreground">
          Showing {data.data.length} of {data.pagination.total} patterns
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
