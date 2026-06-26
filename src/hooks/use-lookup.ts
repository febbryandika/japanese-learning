'use client'

import { useQuery } from '@tanstack/react-query'

import type {
  KanjiLookupResult,
  LookupResponse,
  VocabularyLookupResult,
} from '@/services/lookup.service'

export type { KanjiLookupResult, LookupResponse, VocabularyLookupResult }

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return res.json() as Promise<T>
}

// Look up the selected reader text against the vocabulary + kanji tables. Cached
// per query (staleTime) so re-selecting the same word is instant and fires no new
// request; `enabled` skips empty queries.
export function useLookup(query: string) {
  return useQuery({
    queryKey: ['lookup', query],
    queryFn: () =>
      fetchJson<LookupResponse>(`/api/lookup?q=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
    staleTime: 5 * 60_000,
  })
}
