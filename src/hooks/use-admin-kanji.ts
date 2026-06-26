'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { adminFetch } from '@/hooks/admin-api'
import type { AdminKanji } from '@/services/admin/kanji.service'
import type { CreateKanjiInput, UpdateKanjiInput } from '@/lib/validations'

export type { AdminKanji }

export type AdminKanjiFilters = { q?: string; page: number; pageSize: number }

type ListResponse = {
  data: AdminKanji[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

const LIST_KEY = ['admin', 'kanji', 'list']

function buildQuery(filters: AdminKanjiFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  params.set('page', String(filters.page))
  params.set('pageSize', String(filters.pageSize))
  return params.toString()
}

export function useAdminKanji(filters: AdminKanjiFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, filters],
    queryFn: () => adminFetch<ListResponse>(`/api/admin/kanji?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  })
}

export function useCreateKanji() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateKanjiInput) =>
      adminFetch<AdminKanji>('/api/admin/kanji', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateKanji() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateKanjiInput }) =>
      adminFetch<AdminKanji>(`/api/admin/kanji/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useDeleteKanji() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch<{ id: string }>(`/api/admin/kanji/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
