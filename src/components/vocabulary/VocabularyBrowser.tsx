'use client'

import { useEffect, useState } from 'react'

import { useVocabularyList } from '@/hooks/use-vocabulary'
import { VocabularyCard } from '@/components/VocabularyCard'
import { PaginationControls } from '@/components/PaginationControls'
import { ErrorState } from '@/components/ErrorState'
import {
  VOCAB_PARTS_OF_SPEECH,
  VOCAB_POS_LABELS,
  type VocabPartOfSpeech,
} from '@/lib/validations'
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

// Static dropdown options — `all` plus the fixed N2 part-of-speech set.
const posItems: Record<string, string> = {
  all: 'All parts of speech',
  ...Object.fromEntries(
    VOCAB_PARTS_OF_SPEECH.map((pos) => [pos, VOCAB_POS_LABELS[pos]]),
  ),
}

export function VocabularyBrowser() {
  const [search, setSearch] = useState('')
  const [partOfSpeech, setPartOfSpeech] = useState<VocabPartOfSpeech | undefined>(
    undefined,
  )
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const { data, isPending, isError, isPlaceholderData, refetch } =
    useVocabularyList({
      q: debouncedSearch || undefined,
      partOfSpeech,
      page,
      pageSize: PAGE_SIZE,
    })

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
          placeholder="Search by word, reading, or meaning"
          aria-label="Search vocabulary"
          className="sm:max-w-xs"
        />
        <Select
          items={posItems}
          value={partOfSpeech ?? 'all'}
          onValueChange={(value) => {
            setPartOfSpeech(
              value == null || value === 'all'
                ? undefined
                : (value as VocabPartOfSpeech),
            )
            setPage(1)
          }}
        >
          <SelectTrigger className="w-56" aria-label="Filter by part of speech">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(posItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <VocabularyResults
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

function VocabularyResults({
  data,
  isPending,
  isError,
  isPlaceholderData,
  onRetry,
  onPageChange,
}: {
  data: ReturnType<typeof useVocabularyList>['data']
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
    return <ErrorState message="Couldn't load vocabulary." onRetry={onRetry} />
  }

  if (data.data.length === 0) {
    return <p className="text-muted-foreground">No vocabulary match your search.</p>
  }

  return (
    <div className="space-y-6">
      <ul
        className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
          isPlaceholderData ? 'opacity-60 transition-opacity' : ''
        }`}
      >
        {data.data.map((vocab) => (
          <li key={vocab.id}>
            <VocabularyCard vocab={vocab} />
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
