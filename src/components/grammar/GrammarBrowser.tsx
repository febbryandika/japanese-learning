'use client'

import { useEffect, useState } from 'react'

import { useGrammarList } from '@/hooks/use-grammar'
import type { JlptLevel } from '@/lib/validations'
import { GrammarCard } from '@/components/GrammarCard'
import { PaginationControls } from '@/components/PaginationControls'
import { ErrorState } from '@/components/ErrorState'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PAGE_SIZE = 24

export function GrammarBrowser() {
  const [search, setSearch] = useState('')
  const [jlptLevel, setJlptLevel] = useState<JlptLevel | undefined>(undefined)
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const { data, isPending, isError, isPlaceholderData, refetch } =
    useGrammarList({
      q: debouncedSearch || undefined,
      jlptLevel,
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Search by pattern or meaning"
          aria-label="Search grammar"
          className="sm:max-w-xs"
        />
        <Select
          items={levelItems}
          value={jlptLevel == null ? 'all' : jlptLevel}
          onValueChange={(value) => {
            setJlptLevel(
              value == null || value === 'all'
                ? undefined
                : (value as JlptLevel),
            )
            setPage(1)
          }}
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
    return <CardGridSkeleton />
  }

  if (isError || !data) {
    return <ErrorState message="Couldn't load grammar." onRetry={onRetry} />
  }

  if (data.data.length === 0) {
    return (
      <p className="text-muted-foreground">No grammar matches your search.</p>
    )
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

function CardGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  )
}

// Debounce the search box so typing doesn't fire a request per keystroke.
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}
