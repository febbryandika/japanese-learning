'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { SearchResponse } from '@/services/search.service'
import type {
  JlptLevel,
  ProgressState,
  SearchType,
} from '@/lib/validations'

export type {
  SearchGroup,
  SearchResponse,
  SearchVideoItem,
} from '@/services/search.service'

export type SearchFilters = {
  q?: string
  type?: SearchType
  jlptLevel?: JlptLevel
  progressState?: ProgressState
  bookmarked?: boolean
  page: number
  pageSize: number
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return res.json() as Promise<T>
}

function buildSearchQuery(filters: SearchFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.type) params.set('type', filters.type)
  if (filters.jlptLevel) params.set('jlptLevel', filters.jlptLevel)
  if (filters.progressState) params.set('progressState', filters.progressState)
  if (filters.bookmarked) params.set('bookmarked', 'true')
  params.set('page', String(filters.page))
  params.set('pageSize', String(filters.pageSize))
  return params.toString()
}

// The search page only queries once there's something to search for — a query
// term or any active filter — so an idle page doesn't fire a broad request.
export function searchHasCriteria(filters: SearchFilters): boolean {
  return Boolean(
    filters.q ||
      filters.type ||
      filters.jlptLevel ||
      filters.progressState ||
      filters.bookmarked,
  )
}

export function useSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ['search', filters],
    queryFn: () =>
      fetchJson<SearchResponse>(`/api/search?${buildSearchQuery(filters)}`),
    enabled: searchHasCriteria(filters),
    // Keep prior results visible while the next query/page loads (no flicker).
    placeholderData: keepPreviousData,
  })
}
