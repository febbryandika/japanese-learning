'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ProgressState, VideoProgressState } from '@/lib/validations'

export type VideoGroup = {
  id: string
  slug: string
  title: string
  sortOrder: number
  lessonCount: number
}

export type VideoLessonListItem = {
  id: string
  title: string
  description: string | null
  durationSeconds: number | null
  sortOrder: number
  progressState: ProgressState
}

export type VideoLessonDetail = {
  id: string
  lessonGroupId: string
  title: string
  description: string | null
  embedUrl: string | null
  durationSeconds: number | null
  progressState: ProgressState
  group: { slug: string; title: string }
  // The detail route includes the caller's bookmark state.
  isBookmarked: boolean
}

type UpdateProgressResponse = {
  progressState: VideoProgressState
  completedAt: string | null
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function useLessonGroups() {
  return useQuery({
    queryKey: ['lesson-groups'],
    queryFn: () => fetchJson<{ groups: VideoGroup[] }>('/api/lesson-groups'),
    select: (data) => data.groups,
  })
}

export function useVideoLessons(groupId: string) {
  return useQuery({
    queryKey: ['videos', groupId],
    queryFn: () =>
      fetchJson<{ lessons: VideoLessonListItem[] }>(
        `/api/videos?groupId=${encodeURIComponent(groupId)}`,
      ),
    select: (data) => data.lessons,
    enabled: Boolean(groupId),
  })
}

export function useVideoLesson(lessonId: string) {
  return useQuery({
    queryKey: ['video', lessonId],
    queryFn: () => fetchJson<VideoLessonDetail>(`/api/videos/${lessonId}`),
    enabled: Boolean(lessonId),
  })
}

export function useUpdateVideoProgress(lessonId: string, groupId?: string) {
  const queryClient = useQueryClient()
  const lessonKey = ['video', lessonId] as const

  return useMutation({
    mutationFn: async (progressState: VideoProgressState) => {
      const res = await fetch(`/api/videos/${lessonId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressState }),
      })
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      return res.json() as Promise<UpdateProgressResponse>
    },
    // Optimistically reflect the new state in the cached lesson detail.
    onMutate: async (progressState) => {
      await queryClient.cancelQueries({ queryKey: lessonKey })
      const previous = queryClient.getQueryData<VideoLessonDetail>(lessonKey)
      if (previous) {
        queryClient.setQueryData<VideoLessonDetail>(lessonKey, {
          ...previous,
          progressState,
        })
      }
      return { previous }
    },
    onError: (_error, _progressState, context) => {
      if (context?.previous) {
        queryClient.setQueryData(lessonKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: lessonKey })
      queryClient.invalidateQueries({ queryKey: ['lesson-groups'] })
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['videos', groupId] })
      }
    },
  })
}
