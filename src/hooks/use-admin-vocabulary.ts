'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { adminFetch } from '@/hooks/admin-api'
import type { AdminVocabulary } from '@/services/admin/vocabulary.service'
import type {
  CreateVocabularyInput,
  UpdateVocabularyInput,
} from '@/lib/validations'

export type { AdminVocabulary }

export type AdminVocabularyFilters = {
  q?: string
  page: number
  pageSize: number
}

type ListResponse = {
  data: AdminVocabulary[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

const LIST_KEY = ['admin', 'vocabulary', 'list']

function buildQuery(filters: AdminVocabularyFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  params.set('page', String(filters.page))
  params.set('pageSize', String(filters.pageSize))
  return params.toString()
}

export function useAdminVocabulary(filters: AdminVocabularyFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, filters],
    queryFn: () =>
      adminFetch<ListResponse>(`/api/admin/vocabulary?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  })
}

export function useCreateVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateVocabularyInput) =>
      adminFetch<AdminVocabulary>('/api/admin/vocabulary', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVocabularyInput }) =>
      adminFetch<AdminVocabulary>(`/api/admin/vocabulary/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useDeleteVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch<{ id: string }>(`/api/admin/vocabulary/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
