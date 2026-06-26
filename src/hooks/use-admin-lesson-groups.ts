'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { adminFetch } from '@/hooks/admin-api'
import type { AdminLessonGroup } from '@/services/admin/lesson-group.service'
import type {
  CreateLessonGroupInput,
  UpdateLessonGroupInput,
} from '@/lib/validations'

export type { AdminLessonGroup }

export type AdminLessonGroupFilters = {
  q?: string
  page: number
  pageSize: number
}

type ListResponse = {
  data: AdminLessonGroup[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

const LIST_KEY = ['admin', 'lesson-groups', 'list']

function buildQuery(filters: AdminLessonGroupFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  params.set('page', String(filters.page))
  params.set('pageSize', String(filters.pageSize))
  return params.toString()
}

export function useAdminLessonGroups(filters: AdminLessonGroupFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, filters],
    queryFn: () =>
      adminFetch<ListResponse>(`/api/admin/lesson-groups?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  })
}

export function useCreateLessonGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLessonGroupInput) =>
      adminFetch<AdminLessonGroup>('/api/admin/lesson-groups', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateLessonGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLessonGroupInput }) =>
      adminFetch<AdminLessonGroup>(`/api/admin/lesson-groups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useDeleteLessonGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch<{ id: string }>(`/api/admin/lesson-groups/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
