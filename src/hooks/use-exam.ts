'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  AttemptState,
  MockExamDetail,
  MockExamListItem,
  SubmitResult,
} from '@/services/exam.service'
import type { ExamAnswerInput, ExamReviewResponse } from '@/lib/validations'

// Timestamps arrive JSON-serialized (Date → ISO string).
export type AttemptStateResponse = Omit<AttemptState, 'startedAt'> & {
  startedAt: string
}

// Sentinel for a review fetch hitting a not-yet-submitted attempt (HTTP 409) so
// the view can render the "continue the exam" state instead of a generic error.
export class NotSubmittedError extends Error {
  constructor() {
    super('Attempt not submitted')
    this.name = 'NotSubmittedError'
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function useMockExams() {
  return useQuery({
    queryKey: ['exams'],
    queryFn: () =>
      fetchJson<{ data: MockExamListItem[] }>('/api/mock-exams').then(
        (r) => r.data,
      ),
  })
}

export function useMockExam(id: string) {
  return useQuery({
    queryKey: ['exam', id],
    queryFn: () => fetchJson<MockExamDetail>(`/api/mock-exams/${id}`),
    enabled: Boolean(id),
  })
}

export function useExamAttempt(attemptId: string) {
  return useQuery({
    queryKey: ['exam-attempt', attemptId],
    queryFn: () =>
      fetchJson<AttemptStateResponse>(`/api/mock-exam-attempts/${attemptId}`),
    enabled: Boolean(attemptId),
  })
}

export function useExamReview(attemptId: string) {
  return useQuery({
    queryKey: ['exam-review', attemptId],
    queryFn: async () => {
      const res = await fetch(`/api/mock-exam-attempts/${attemptId}/review`)
      if (res.status === 409) throw new NotSubmittedError()
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      return res.json() as Promise<ExamReviewResponse>
    },
    enabled: Boolean(attemptId),
    retry: false,
  })
}

export function useStartAttempt() {
  return useMutation({
    mutationFn: async (examId: string) => {
      const res = await fetch(`/api/mock-exams/${examId}/attempts`, {
        method: 'POST',
      })
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      return res.json() as Promise<{ attemptId: string; resumed: boolean }>
    },
  })
}

export function useSaveExamAnswers() {
  return useMutation({
    mutationFn: async ({
      attemptId,
      answers,
    }: {
      attemptId: string
      answers: ExamAnswerInput[]
    }) => {
      const res = await fetch(`/api/mock-exam-attempts/${attemptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      return res.json() as Promise<{ saved: number }>
    },
  })
}

export function useSubmitExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      attemptId,
      answers,
    }: {
      attemptId: string
      answers: ExamAnswerInput[]
    }) => {
      const res = await fetch(`/api/mock-exam-attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      // 409 = already submitted; the body still carries the stored score, so
      // surface it as a result rather than an error (auto-submit can race).
      if (res.status === 409 || res.ok) {
        return res.json() as Promise<SubmitResult>
      }
      throw new Error(`Request failed with status ${res.status}`)
    },
    onSuccess: (data, { attemptId }) => {
      // Flip the cached attempt to submitted immediately so the result renders
      // without waiting on a refetch, then reconcile with the server.
      queryClient.setQueryData<AttemptStateResponse>(
        ['exam-attempt', attemptId],
        (old) =>
          old
            ? {
                ...old,
                status: 'submitted',
                scoreTotal: data.scoreTotal,
                scoreMax: data.scoreMax,
              }
            : old,
      )
      queryClient.invalidateQueries({ queryKey: ['exam-attempt', attemptId] })
    },
  })
}
