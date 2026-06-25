'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { BookDetail, BookListItem } from '@/services/reader.service'

type BooksResponse = { data: BookListItem[] }
type SaveProgressResponse = { cfi: string | null; updatedAt: string }

function bookKey(bookId: string) {
  return ['reader', 'book', bookId] as const
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return res.json() as Promise<T>
}

// The published library, each book carrying the caller's saved CFI.
export function useBooks() {
  return useQuery({
    queryKey: ['reader', 'books'],
    queryFn: () =>
      fetchJson<BooksResponse>('/api/reader/books').then((r) => r.data),
  })
}

// A single book's metadata + file URL + the caller's saved CFI (per SPEC: the
// book-detail response carries everything needed to open and restore).
export function useBook(bookId: string) {
  return useQuery({
    queryKey: bookKey(bookId),
    queryFn: () => fetchJson<BookDetail>(`/api/reader/books/${bookId}`),
    enabled: Boolean(bookId),
  })
}

// The caller's stored reading position, read straight from the book-detail cache
// (no extra request). `enabled: false` → this observer never fetches; it returns
// the cfi loaded by useBook and updated by useSaveReaderProgress.
export function useReaderProgress(bookId: string): string | null {
  const { data } = useQuery({
    queryKey: bookKey(bookId),
    queryFn: () => fetchJson<BookDetail>(`/api/reader/books/${bookId}`),
    enabled: false,
  })
  return data?.cfi ?? null
}

// Persist the current CFI. Callers debounce this. On success we update the cfi
// in the book-detail cache so a remount restores the latest position.
export function useSaveReaderProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookId, cfi }: { bookId: string; cfi: string }) => {
      const res = await fetch(`/api/reader/books/${bookId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cfi }),
      })
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      return res.json() as Promise<SaveProgressResponse>
    },
    onSuccess: (data, { bookId }) => {
      queryClient.setQueryData<BookDetail>(bookKey(bookId), (old) =>
        old ? { ...old, cfi: data.cfi } : old,
      )
    },
  })
}
