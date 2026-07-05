'use client'

import { useState } from 'react'

import { searchHasCriteria, useSearch } from '@/hooks/use-search'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { JlptLevel, ProgressState, SearchType } from '@/lib/validations'
import { PageHeader } from '@/components/PageHeader'
import { SearchFilters } from '@/components/search/SearchFilters'
import { SearchInput } from '@/components/search/SearchInput'
import { SearchResults } from '@/components/search/SearchResults'

const PAGE_SIZE = 24

export function SearchView() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<SearchType | undefined>(undefined)
  const [jlptLevel, setJlptLevel] = useState<JlptLevel | undefined>(undefined)
  const [progressState, setProgressState] = useState<ProgressState | undefined>(
    undefined,
  )
  const [bookmarked, setBookmarked] = useState(false)
  const [page, setPage] = useState(1)

  const debouncedQuery = useDebouncedValue(query.trim(), 300)

  const filters = {
    q: debouncedQuery || undefined,
    type,
    jlptLevel,
    progressState,
    bookmarked: bookmarked || undefined,
    page,
    pageSize: PAGE_SIZE,
  }

  const { data, isPending, isError, isPlaceholderData, refetch } =
    useSearch(filters)

  // Any change other than paging resets to the first page.
  function resetPage() {
    setPage(1)
  }

  return (
    <div>
      <PageHeader title="Search" jpTitle="検索" />

      <div className="mx-auto w-full max-w-3xl space-y-5 px-6 py-6 sm:px-8">
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value)
            resetPage()
          }}
        />
        <SearchFilters
          type={type}
          jlptLevel={jlptLevel}
          progressState={progressState}
          bookmarked={bookmarked}
          onTypeChange={(value) => {
            setType(value)
            resetPage()
          }}
          onJlptLevelChange={(value) => {
            setJlptLevel(value)
            resetPage()
          }}
          onProgressStateChange={(value) => {
            setProgressState(value)
            resetPage()
          }}
          onBookmarkedChange={(value) => {
            setBookmarked(value)
            resetPage()
          }}
        />

        <SearchResults
          data={data}
          hasCriteria={searchHasCriteria(filters)}
          isPending={isPending}
          isError={isError}
          isPlaceholderData={isPlaceholderData}
          onRetry={refetch}
          onPageChange={setPage}
          onSelectType={(nextType) => {
            setType(nextType)
            resetPage()
          }}
        />
      </div>
    </div>
  )
}
