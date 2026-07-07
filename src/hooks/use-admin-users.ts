'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { adminFetch } from '@/hooks/admin-api'
import type { AdminUser } from '@/services/admin/user.service'
import type {
  CreateUserInput,
  ResetPasswordInput,
  UpdateUserInput,
  UserSortField,
} from '@/lib/validations'

export type { AdminUser }

export type AdminUsersFilters = {
  q?: string
  sortBy: UserSortField
  sortDir: 'asc' | 'desc'
  page: number
  pageSize: number
}

type ListResponse = {
  data: AdminUser[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

const LIST_KEY = ['admin', 'users', 'list']
const DETAIL_KEY = ['admin', 'users', 'detail']

function buildQuery(filters: AdminUsersFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  params.set('sortBy', filters.sortBy)
  params.set('sortDir', filters.sortDir)
  params.set('page', String(filters.page))
  params.set('pageSize', String(filters.pageSize))
  return params.toString()
}

export function useAdminUsers(filters: AdminUsersFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, filters],
    queryFn: () => adminFetch<ListResponse>(`/api/admin/users?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  })
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: [...DETAIL_KEY, id],
    queryFn: () => adminFetch<AdminUser>(`/api/admin/users/${id}`),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      adminFetch<AdminUser>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      adminFetch<AdminUser>(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY })
      queryClient.invalidateQueries({ queryKey: [...DETAIL_KEY, id] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch<{ id: string }>(`/api/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useResetPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ResetPasswordInput }) =>
      adminFetch<{ id: string; password?: string }>(
        `/api/admin/users/${id}/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
