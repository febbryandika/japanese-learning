'use client'

import { useVocabularyList } from '@/hooks/use-vocabulary'
import { useListUrlState } from '@/hooks/use-list-url-state'
import {
  VOCAB_PARTS_OF_SPEECH,
  VOCAB_POS_LABELS,
  type StudyProgressState,
  type VocabPartOfSpeech,
} from '@/lib/validations'
import { VocabularyCard } from '@/components/VocabularyCard'
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

// Static dropdown options — `all` plus the fixed N2 part-of-speech set.
const posItems: Record<string, string> = {
  all: 'All parts of speech',
  ...Object.fromEntries(
    VOCAB_PARTS_OF_SPEECH.map((pos) => [pos, VOCAB_POS_LABELS[pos]]),
  ),
}

export function VocabularyBrowser() {
  const { q, searchInput, setSearchInput, page, setPage, getParam, setParam } =
    useListUrlState()

  const partOfSpeech = getParam('partOfSpeech') as VocabPartOfSpeech | undefined
  const progressState = getParam('progressState') as StudyProgressState | undefined
  const bookmarked = getParam('bookmarked') === 'true'

  const { data, isPending, isError, isPlaceholderData, refetch } =
    useVocabularyList({
      q: q || undefined,
      partOfSpeech,
      progressState,
      bookmarked: bookmarked || undefined,
      page,
      pageSize: PAGE_SIZE,
    })

  return (
    <div>
      <PageHeader title="Vocabulary" jpTitle="語彙">
        <Input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search word, reading, meaning…"
          aria-label="Search vocabulary"
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
            items={posItems}
            value={partOfSpeech ?? 'all'}
            onValueChange={(value) =>
              setParam(
                'partOfSpeech',
                value == null || value === 'all' ? undefined : value,
              )
            }
          >
            <SelectTrigger
              className="ml-auto rounded-full"
              aria-label="Filter by part of speech"
            >
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
    return <LoadingState count={9} itemClassName="h-36" />
  }

  if (isError || !data) {
    return <ErrorState message="Couldn't load vocabulary." onRetry={onRetry} />
  }

  if (data.data.length === 0) {
    return <EmptyState message="No vocabulary match your search." />
  }

  return (
    <div className="space-y-6">
      <ul
        className={`grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 ${
          isPlaceholderData ? 'opacity-60 transition-opacity' : ''
        }`}
      >
        {data.data.map((vocab) => (
          <li key={vocab.id}>
            <VocabularyCard vocab={vocab} />
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[12.5px] text-muted-foreground">
          Showing {data.data.length} of {data.pagination.total} words
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
