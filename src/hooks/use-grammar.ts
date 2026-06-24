'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type {
  GrammarDetail,
  GrammarExample,
  GrammarListItem,
} from '@/services/grammar.service'
import type { JlptLevel } from '@/lib/validations'

export type { GrammarDetail, GrammarExample, GrammarListItem }

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
    queryFn: () => fetchJson<GrammarDetail>(`/api/grammar/${id}`),
    enabled: Boolean(id),
  })
}
