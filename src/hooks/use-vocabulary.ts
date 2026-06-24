'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type {
  VocabularyDetail,
  VocabularyListItem,
} from '@/services/vocabulary.service'
import type { ProgressState, VocabPartOfSpeech } from '@/lib/validations'

export type { VocabularyDetail, VocabularyListItem }

// The detail route augments the vocabulary with the caller's bookmark and progress state.
export type VocabularyDetailResponse = VocabularyDetail & {
  isBookmarked: boolean
  progressState: ProgressState
}

export type VocabularyListResponse = {
  data: VocabularyListItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type VocabularyListFilters = {
  q?: string
  partOfSpeech?: VocabPartOfSpeech
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

function buildVocabularyListQuery(filters: VocabularyListFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.partOfSpeech) params.set('partOfSpeech', filters.partOfSpeech)
  params.set('page', String(filters.page))
  params.set('pageSize', String(filters.pageSize))
  return params.toString()
}

export function useVocabularyList(filters: VocabularyListFilters) {
  return useQuery({
    queryKey: ['vocabulary', 'list', filters],
    queryFn: () =>
      fetchJson<VocabularyListResponse>(
        `/api/vocabulary?${buildVocabularyListQuery(filters)}`,
      ),
    // Keep the previous page visible while the next one loads (no flicker).
    placeholderData: keepPreviousData,
  })
}

export function useVocabularyDetail(id: string) {
  return useQuery({
    queryKey: ['vocabulary', id],
    queryFn: () => fetchJson<VocabularyDetailResponse>(`/api/vocabulary/${id}`),
    enabled: Boolean(id),
  })
}
