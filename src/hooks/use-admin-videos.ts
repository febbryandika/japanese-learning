'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { adminFetch } from '@/hooks/admin-api'
import type { AdminVideo } from '@/services/admin/video.service'
import type { CreateVideoInput, UpdateVideoInput } from '@/lib/validations'

export type { AdminVideo }

export type AdminVideoFilters = {
  q?: string
  page: number
  pageSize: number
}

type ListResponse = {
  data: AdminVideo[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

const LIST_KEY = ['admin', 'videos', 'list']

function buildQuery(filters: AdminVideoFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  params.set('page', String(filters.page))
  params.set('pageSize', String(filters.pageSize))
  return params.toString()
}

export function useAdminVideos(filters: AdminVideoFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, filters],
    queryFn: () =>
      adminFetch<ListResponse>(`/api/admin/videos?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  })
}

export function useCreateVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateVideoInput) =>
      adminFetch<AdminVideo>('/api/admin/videos', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVideoInput }) =>
      adminFetch<AdminVideo>(`/api/admin/videos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useDeleteVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch<{ id: string }>(`/api/admin/videos/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
