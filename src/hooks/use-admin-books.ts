'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { adminFetch } from '@/hooks/admin-api'
import type { AdminBook } from '@/services/admin/book.service'
import type { CreateBookInput, UpdateBookInput } from '@/lib/validations'

export type { AdminBook }

export type AdminBookFilters = { q?: string; page: number; pageSize: number }

type ListResponse = {
  data: AdminBook[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

const LIST_KEY = ['admin', 'books', 'list']

function buildQuery(filters: AdminBookFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  params.set('page', String(filters.page))
  params.set('pageSize', String(filters.pageSize))
  return params.toString()
}

export function useAdminBooks(filters: AdminBookFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, filters],
    queryFn: () => adminFetch<ListResponse>(`/api/admin/reader/books?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  })
}

// Persists the book row after the client-direct upload has produced a fileUrl.
export function useCreateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBookInput) =>
      adminFetch<AdminBook>('/api/admin/reader/books', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBookInput }) =>
      adminFetch<AdminBook>(`/api/admin/reader/books/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch<{ id: string }>(`/api/admin/reader/books/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
