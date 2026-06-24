'use client'

import { useEffect, useState } from 'react'

import { useKanjiList } from '@/hooks/use-kanji'
import { KanjiCard } from '@/components/KanjiCard'
import { PaginationControls } from '@/components/kanji/PaginationControls'
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

export function KanjiBrowser() {
  const [search, setSearch] = useState('')
  const [strokeCount, setStrokeCount] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const { data, isPending, isError, isPlaceholderData, refetch } = useKanjiList({
    q: debouncedSearch || undefined,
    strokeCount,
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Search by character, reading, or meaning"
          aria-label="Search kanji"
          className="sm:max-w-xs"
        />
        <Select
          items={strokeItems}
          value={strokeCount == null ? 'all' : String(strokeCount)}
          onValueChange={(value) => {
            setStrokeCount(
              value == null || value === 'all' ? undefined : Number(value),
            )
            setPage(1)
          }}
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
    return <CardGridSkeleton />
  }

  if (isError || !data) {
    return <ErrorState message="Couldn't load kanji." onRetry={onRetry} />
  }

  if (data.data.length === 0) {
    return (
      <p className="text-muted-foreground">No kanji match your search.</p>
    )
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
