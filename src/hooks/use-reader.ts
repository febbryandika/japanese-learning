'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { BookDetail, BookListItem } from '@/services/reader.service'

type BooksResponse = { data: BookListItem[] }
type ReaderProgressResponse = { cfi: string | null }
type SaveProgressResponse = { cfi: string | null; updatedAt: string }

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

// A single book's metadata + file URL (the reader needs both before mounting).
export function useBook(bookId: string) {
  return useQuery({
    queryKey: ['reader', 'book', bookId],
    queryFn: () => fetchJson<BookDetail>(`/api/reader/books/${bookId}`),
    enabled: Boolean(bookId),
  })
}

// The caller's stored reading position, fetched once so the reader can restore
// it on open. Not refetched while reading — the client owns the live CFI.
export function useReaderProgress(bookId: string) {
  return useQuery({
    queryKey: ['reader', 'progress', bookId],
    queryFn: () =>
      fetchJson<ReaderProgressResponse>(
        `/api/reader/books/${bookId}/progress`,
      ),
    enabled: Boolean(bookId),
    staleTime: Infinity,
  })
}

// Persist the current CFI. Callers debounce this. On success we seed the
// progress cache so a remount restores the latest position without a refetch.
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
      queryClient.setQueryData<ReaderProgressResponse>(
        ['reader', 'progress', bookId],
        { cfi: data.cfi },
      )
    },
  })
}
