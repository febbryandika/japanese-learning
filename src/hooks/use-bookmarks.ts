'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query'

import type { BookmarkTargetType } from '@/lib/validations'
import type { KanjiListItem } from '@/services/kanji.service'
import type { VocabularyListItem } from '@/services/vocabulary.service'
import type { GrammarListItem } from '@/services/grammar.service'
import type { VideoBookmarkItem } from '@/services/bookmark.service'

export type { VideoBookmarkItem }

// A bookmark plus the resource summary the bookmarks page renders. `createdAt`
// is a string here (JSON-serialized from the server's Date).
export type BookmarkSummary =
  | {
      targetType: 'kanji'
      targetId: string
      createdAt: string
      item: KanjiListItem
    }
  | {
      targetType: 'vocabulary'
      targetId: string
      createdAt: string
      item: VocabularyListItem
    }
  | {
      targetType: 'grammar'
      targetId: string
      createdAt: string
      item: GrammarListItem
    }
  | {
      targetType: 'video_lesson'
      targetId: string
      createdAt: string
      item: VideoBookmarkItem
    }

type BookmarksResponse = { data: BookmarkSummary[] }

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return res.json() as Promise<T>
}

// The POST toggle route base differs only for videos (/api/videos/...). Also
// used to build the detail URL the status query points at.
function bookmarkPath(targetType: BookmarkTargetType): string {
  return targetType === 'video_lesson' ? 'videos' : targetType
}

// The detail query key each resource view populates. The bookmark flag lives in
// that cache entry, so the button reads it with no extra request.
function detailKey(targetType: BookmarkTargetType, targetId: string): QueryKey {
  return targetType === 'video_lesson'
    ? ['video', targetId]
    : [targetType, targetId]
}

export function useBookmarks(type?: BookmarkTargetType) {
  return useQuery({
    queryKey: ['bookmarks', type ?? 'all'],
    queryFn: () =>
      fetchJson<BookmarksResponse>(
        `/api/bookmarks${type ? `?type=${type}` : ''}`,
      ),
    select: (data) => data.data,
  })
}

// Reads the caller's bookmark state straight from the resource detail cache.
// `enabled: false` → this observer never fetches; it only subscribes so the
// button re-renders when the detail view loads or the toggle flips the flag.
export function useBookmarkStatus(
  targetType: BookmarkTargetType,
  targetId: string,
): boolean {
  const { data } = useQuery({
    queryKey: detailKey(targetType, targetId),
    queryFn: () =>
      fetchJson<{ isBookmarked: boolean }>(
        `/api/${bookmarkPath(targetType)}/${targetId}`,
      ),
    enabled: false,
  })
  return Boolean((data as { isBookmarked?: boolean } | undefined)?.isBookmarked)
}

type ToggleVariables = {
  targetType: BookmarkTargetType
  targetId: string
  bookmarked: boolean
}

export function useToggleBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ targetType, targetId }: ToggleVariables) => {
      const res = await fetch(
        `/api/${bookmarkPath(targetType)}/${targetId}/bookmark`,
        { method: 'POST' },
      )
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      return res.json() as Promise<{ bookmarked: boolean }>
    },
    onMutate: async ({ targetType, targetId, bookmarked }) => {
      const next = !bookmarked
      const dKey = detailKey(targetType, targetId)

      await queryClient.cancelQueries({ queryKey: dKey })
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] })

      // Flip the flag in the detail cache so the button reflects it instantly.
      const previousDetail = queryClient.getQueryData(dKey)
      if (previousDetail) {
        queryClient.setQueryData(dKey, {
          ...(previousDetail as Record<string, unknown>),
          isBookmarked: next,
        })
      }

      // When un-bookmarking, drop the item from any cached bookmarks list.
      const previousLists = queryClient.getQueriesData<BookmarksResponse>({
        queryKey: ['bookmarks'],
      })
      if (!next) {
        queryClient.setQueriesData<BookmarksResponse>(
          { queryKey: ['bookmarks'] },
          (old) =>
            old
              ? { data: old.data.filter((b) => b.targetId !== targetId) }
              : old,
        )
      }

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
    // Server response is authoritative — reconcile detail + lists once settled.
    onSettled: (_data, _error, { targetType, targetId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      queryClient.invalidateQueries({
        queryKey: detailKey(targetType, targetId),
      })
    },
  })
}
