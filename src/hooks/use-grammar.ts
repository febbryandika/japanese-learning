'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { GeneratedExample } from '@/services/ai.service'
import type {
  GrammarDetail,
  GrammarExample,
  GrammarListItem,
} from '@/services/grammar.service'
import type {
  JlptLevel,
  ProgressState,
  StudyProgressState,
} from '@/lib/validations'

export type { GrammarDetail, GrammarExample, GrammarListItem }
export { useGenerateExample } from '@/hooks/use-generate-example'

// The detail route augments the grammar item with the caller's bookmark and
// progress state plus any AI-generated example sentences.
export type GrammarDetailResponse = GrammarDetail & {
  isBookmarked: boolean
  progressState: ProgressState
  generatedExamples: GeneratedExample[]
}

export type GrammarListResponse = {
  data: GrammarListItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  jlptLevels: string[]
}

export type GrammarListFilters = {
  q?: string
  jlptLevel?: JlptLevel
  progressState?: StudyProgressState
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

function buildGrammarListQuery(filters: GrammarListFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.jlptLevel) params.set('jlptLevel', filters.jlptLevel)
  if (filters.progressState) params.set('progressState', filters.progressState)
  if (filters.bookmarked) params.set('bookmarked', 'true')
  params.set('page', String(filters.page))
  params.set('pageSize', String(filters.pageSize))
  return params.toString()
}

export function useGrammarList(filters: GrammarListFilters) {
  return useQuery({
    queryKey: ['grammar', 'list', filters],
    queryFn: () =>
      fetchJson<GrammarListResponse>(
        `/api/grammar?${buildGrammarListQuery(filters)}`,
      ),
    // Keep the previous page visible while the next one loads (no flicker).
    placeholderData: keepPreviousData,
  })
}

export function useGrammarDetail(id: string) {
  return useQuery({
    queryKey: ['grammar', id],
    queryFn: () => fetchJson<GrammarDetailResponse>(`/api/grammar/${id}`),
    enabled: Boolean(id),
  })
}
