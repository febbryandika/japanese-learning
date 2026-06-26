'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { adminFetch } from '@/hooks/admin-api'
import type { AdminGrammar } from '@/services/admin/grammar.service'
import type { CreateGrammarInput, UpdateGrammarInput } from '@/lib/validations'

export type { AdminGrammar }

export type AdminGrammarFilters = { q?: string; page: number; pageSize: number }

type ListResponse = {
  data: AdminGrammar[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

const LIST_KEY = ['admin', 'grammar', 'list']

function buildQuery(filters: AdminGrammarFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  params.set('page', String(filters.page))
  params.set('pageSize', String(filters.pageSize))
  return params.toString()
}

export function useAdminGrammar(filters: AdminGrammarFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, filters],
    queryFn: () =>
      adminFetch<ListResponse>(`/api/admin/grammar?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  })
}

export function useCreateGrammar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateGrammarInput) =>
      adminFetch<AdminGrammar>('/api/admin/grammar', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateGrammar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGrammarInput }) =>
      adminFetch<AdminGrammar>(`/api/admin/grammar/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useDeleteGrammar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch<{ id: string }>(`/api/admin/grammar/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
