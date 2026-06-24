'use client'

import { useQuery } from '@tanstack/react-query'

import type { ProgressState } from '@/lib/validations'

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
