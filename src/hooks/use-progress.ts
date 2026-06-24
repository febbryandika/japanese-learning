'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query'

import type { BookmarkTargetType, ProgressState } from '@/lib/validations'
import type { KanjiListItem } from '@/services/kanji.service'
import type { VocabularyListItem } from '@/services/vocabulary.service'
import type { GrammarListItem } from '@/services/grammar.service'
import type { VideoBookmarkItem } from '@/hooks/use-bookmarks'

// A progress row plus the resource summary the progress page renders. Timestamps
// arrive as strings (JSON-serialized from the server's Date).
export type ProgressSummary =
  | {
      targetType: 'kanji'
      targetId: string
      progressState: ProgressState
      lastViewedAt: string | null
      completedAt: string | null
      item: KanjiListItem
    }
  | {
      targetType: 'vocabulary'
      targetId: string
      progressState: ProgressState
      lastViewedAt: string | null
      completedAt: string | null
      item: VocabularyListItem
    }
  | {
      targetType: 'grammar'
      targetId: string
      progressState: ProgressState
      lastViewedAt: string | null
      completedAt: string | null
      item: GrammarListItem
    }
  | {
      targetType: 'video_lesson'
      targetId: string
      progressState: ProgressState
      lastViewedAt: string | null
      completedAt: string | null
      item: VideoBookmarkItem
    }

export type ProgressCounts = Record<ProgressState, number>
type ProgressResponse = { data: ProgressSummary[]; counts: ProgressCounts }

export type ProgressFilters = {
  type?: BookmarkTargetType
  state?: ProgressState
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return res.json() as Promise<T>
}

// The progress PATCH base differs only for videos (/api/videos/...). Also used to
// build the detail URL the cache-read query points at.
function progressPath(targetType: BookmarkTargetType): string {
  return targetType === 'video_lesson' ? 'videos' : targetType
}

// The resource detail query key each view populates. The progress flag lives in
// that cache entry, so reads/optimistic writes need no extra request.
function detailKey(targetType: BookmarkTargetType, targetId: string): QueryKey {
  return targetType === 'video_lesson'
    ? ['video', targetId]
    : [targetType, targetId]
}

export function useProgress(filters: ProgressFilters) {
  return useQuery({
    queryKey: ['progress', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.type) params.set('type', filters.type)
      if (filters.state) params.set('state', filters.state)
      const qs = params.toString()
      return fetchJson<ProgressResponse>(`/api/progress${qs ? `?${qs}` : ''}`)
    },
  })
}

// Reads the caller's progress state straight from the resource detail cache.
// `enabled: false` → this observer never fetches; it only subscribes so a
// consumer re-renders when the detail view loads or a mutation updates the state.
export function useResourceProgress(
  targetType: BookmarkTargetType,
  targetId: string,
): ProgressState {
  const { data } = useQuery({
    queryKey: detailKey(targetType, targetId),
    queryFn: () =>
      fetchJson<{ progressState: ProgressState }>(
        `/api/${progressPath(targetType)}/${targetId}`,
      ),
    enabled: false,
  })
  return (
    (data as { progressState?: ProgressState } | undefined)?.progressState ??
    'unseen'
  )
}

type UpdateVariables = {
  targetType: BookmarkTargetType
  targetId: string
  progressState: ProgressState
}

export function useUpdateProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      targetType,
      targetId,
      progressState,
    }: UpdateVariables) => {
      const res = await fetch(
        `/api/${progressPath(targetType)}/${targetId}/progress`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progressState }),
        },
      )
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      return res.json() as Promise<{
        progressState: ProgressState
        completedAt: string | null
      }>
    },
    onMutate: async ({ targetType, targetId, progressState }) => {
      const dKey = detailKey(targetType, targetId)

      await queryClient.cancelQueries({ queryKey: dKey })
      await queryClient.cancelQueries({ queryKey: ['progress'] })

      // Reflect the new state in the detail cache so the selector updates instantly.
      const previousDetail = queryClient.getQueryData(dKey)
      if (previousDetail) {
        queryClient.setQueryData(dKey, {
          ...(previousDetail as Record<string, unknown>),
          progressState,
        })
      }

      // And in any cached progress list (the /progress page rows).
      const previousLists = queryClient.getQueriesData<ProgressResponse>({
        queryKey: ['progress'],
      })
      queryClient.setQueriesData<ProgressResponse>(
        { queryKey: ['progress'] },
        (old) =>
          old
            ? {
                ...old,
                data: old.data.map((entry) =>
                  entry.targetType === targetType &&
                  entry.targetId === targetId
                    ? ({ ...entry, progressState } as ProgressSummary)
                    : entry,
                ),
              }
            : old,
      )

      return { dKey, previousDetail, previousLists }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      if (context.previousDetail) {
        queryClient.setQueryData(context.dKey, context.previousDetail)
      }
      for (const [key, data] of context.previousLists) {
        queryClient.setQueryData(key, data)
      }
    },
    // Server response is authoritative — reconcile detail, progress, and the
    // relevant browse list once settled (covers the list-card mastery badges).
    onSettled: (_data, _error, { targetType, targetId }) => {
      queryClient.invalidateQueries({ queryKey: detailKey(targetType, targetId) })
      queryClient.invalidateQueries({ queryKey: ['progress'] })
      if (targetType === 'video_lesson') {
        queryClient.invalidateQueries({ queryKey: ['videos'] })
        queryClient.invalidateQueries({ queryKey: ['lesson-groups'] })
      } else {
        queryClient.invalidateQueries({ queryKey: [targetType] })
      }
    },
  })
}
