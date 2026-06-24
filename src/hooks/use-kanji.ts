'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { KanjiDetail, KanjiListItem } from '@/services/kanji.service'
import type { KanjiCompound } from '@/lib/validations'

export type { KanjiCompound, KanjiDetail, KanjiListItem }

// The detail route augments the kanji with the caller's bookmark state.
export type KanjiDetailResponse = KanjiDetail & { isBookmarked: boolean }

export type KanjiListResponse = {
  data: KanjiListItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  strokeCounts: number[]
}

export type KanjiListFilters = {
  q?: string
  strokeCount?: number
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

function buildKanjiListQuery(filters: KanjiListFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.strokeCount != null) {
    params.set('strokeCount', String(filters.strokeCount))
  }
  params.set('page', String(filters.page))
  params.set('pageSize', String(filters.pageSize))
  return params.toString()
}

export function useKanjiList(filters: KanjiListFilters) {
  return useQuery({
    queryKey: ['kanji', 'list', filters],
    queryFn: () =>
      fetchJson<KanjiListResponse>(`/api/kanji?${buildKanjiListQuery(filters)}`),
    // Keep the previous page visible while the next one loads (no flicker).
    placeholderData: keepPreviousData,
  })
}

export function useKanjiDetail(id: string) {
  return useQuery({
    queryKey: ['kanji', id],
    queryFn: () => fetchJson<KanjiDetailResponse>(`/api/kanji/${id}`),
    enabled: Boolean(id),
  })
}
