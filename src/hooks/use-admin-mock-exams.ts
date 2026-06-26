'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { adminFetch } from '@/hooks/admin-api'
import type {
  AdminExamQuestion,
  AdminMockExam,
  AdminMockExamDetail,
} from '@/services/admin/mock-exam.service'
import type {
  CreateMockExamInput,
  ExamQuestionInput,
  UpdateExamQuestionInput,
  UpdateMockExamInput,
} from '@/lib/validations'

export type { AdminExamQuestion, AdminMockExam, AdminMockExamDetail }

export type AdminMockExamFilters = {
  q?: string
  page: number
  pageSize: number
}

type ListResponse = {
  data: AdminMockExam[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

const LIST_KEY = ['admin', 'mock-exams', 'list']
const detailKey = (id: string) => ['admin', 'mock-exams', id]

function buildQuery(filters: AdminMockExamFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  params.set('page', String(filters.page))
  params.set('pageSize', String(filters.pageSize))
  return params.toString()
}

export function useAdminMockExams(filters: AdminMockExamFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, filters],
    queryFn: () =>
      adminFetch<ListResponse>(`/api/admin/mock-exams?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  })
}

export function useAdminMockExam(id: string) {
  return useQuery({
    queryKey: detailKey(id),
    queryFn: () => adminFetch<AdminMockExamDetail>(`/api/admin/mock-exams/${id}`),
    enabled: Boolean(id),
  })
}

export function useCreateMockExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateMockExamInput) =>
      adminFetch<AdminMockExam>('/api/admin/mock-exams', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateMockExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMockExamInput }) =>
      adminFetch<AdminMockExam>(`/api/admin/mock-exams/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY })
      queryClient.invalidateQueries({ queryKey: detailKey(id) })
    },
  })
}

export function useDeleteMockExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch<{ id: string }>(`/api/admin/mock-exams/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

// ─── Questions (scoped to one exam) ───────────────────────────────────────────

export function useAddExamQuestion(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ExamQuestionInput) =>
      adminFetch<AdminExamQuestion>(`/api/admin/mock-exams/${examId}/questions`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detailKey(examId) })
      queryClient.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function useUpdateExamQuestion(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      questionId,
      input,
    }: {
      questionId: string
      input: UpdateExamQuestionInput
    }) =>
      adminFetch<AdminExamQuestion>(
        `/api/admin/mock-exams/${examId}/questions/${questionId}`,
        { method: 'PATCH', body: JSON.stringify(input) },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: detailKey(examId) }),
  })
}

export function useDeleteExamQuestion(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (questionId: string) =>
      adminFetch<{ id: string }>(
        `/api/admin/mock-exams/${examId}/questions/${questionId}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detailKey(examId) })
      queryClient.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}
