import { and, desc, eq, inArray } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  bookmarks,
  grammarItems,
  kanjiItems,
  lessonGroups,
  videoLessons,
  vocabularyItems,
} from '@/lib/db/schema'
import type { BookmarkTargetType } from '@/lib/validations'
import type { KanjiListItem } from './kanji.service'
import type { VocabularyListItem } from './vocabulary.service'
import type { GrammarListItem } from './grammar.service'

// Video bookmarks need the group slug to build the detail link
// (/videos/{groupSlug}/{lessonId}); there is no video list-item type to reuse.
export type VideoBookmarkItem = {
  id: string
  title: string
  groupSlug: string
  groupTitle: string
}

// A bookmark enriched with its resource's list-item summary, so the bookmarks
// page can render the existing cards without a second round of fetches.
export type BookmarkSummary =
  | { targetType: 'kanji'; targetId: string; createdAt: Date; item: KanjiListItem }
  | {
      targetType: 'vocabulary'
      targetId: string
      createdAt: Date
      item: VocabularyListItem
    }
  | {
      targetType: 'grammar'
      targetId: string
      createdAt: Date
      item: GrammarListItem
    }
  | {
      targetType: 'video_lesson'
      targetId: string
      createdAt: Date
      item: VideoBookmarkItem
    }

// Insert-or-delete: with the `uq_bookmark` constraint a bookmark is set
// membership. Returns the new state, or null when the target doesn't exist
// (so the route can answer 404 rather than create an orphan row — targetId has
// no FK). All writes are scoped to `userId`.
export async function toggleBookmark(
  userId: string,
  targetType: BookmarkTargetType,
  targetId: string,
): Promise<{ bookmarked: boolean } | null> {
  if (!(await targetExists(targetType, targetId))) {
    return null
  }

  const [existing] = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.targetType, targetType),
        eq(bookmarks.targetId, targetId),
      ),
    )
    .limit(1)

  if (existing) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing.id))
    return { bookmarked: false }
  }

  // onConflictDoNothing guards against a double-click race on the unique key.
  await db
    .insert(bookmarks)
    .values({ userId, targetType, targetId })
    .onConflictDoNothing()
  return { bookmarked: true }
}

// Whether the user has this target bookmarked — used by the detail routes to
// seed `isBookmarked` on the detail response.
export async function isBookmarked(
  userId: string,
  targetType: BookmarkTargetType,
  targetId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.targetType, targetType),
        eq(bookmarks.targetId, targetId),
      ),
    )
    .limit(1)

  return Boolean(row)
}

// The user's bookmarks, newest first, each enriched with its resource summary.
// Bookmarks whose resource no longer exists (or is unpublished, for videos) are
// dropped rather than surfaced as broken cards.
export async function listBookmarks(
  userId: string,
  type?: BookmarkTargetType,
): Promise<BookmarkSummary[]> {
  const rows = await db
    .select({
      targetType: bookmarks.targetType,
      targetId: bookmarks.targetId,
      createdAt: bookmarks.createdAt,
    })
    .from(bookmarks)
    .where(
      type
        ? and(eq(bookmarks.userId, userId), eq(bookmarks.targetType, type))
        : eq(bookmarks.userId, userId),
    )
    .orderBy(desc(bookmarks.createdAt))

  if (rows.length === 0) return []

  const idsByType: Record<BookmarkTargetType, string[]> = {
    kanji: [],
    vocabulary: [],
    grammar: [],
    video_lesson: [],
  }
  for (const row of rows) idsByType[row.targetType].push(row.targetId)

  const [kanjiMap, vocabMap, grammarMap, videoMap] = await Promise.all([
    fetchKanjiSummaries(idsByType.kanji),
    fetchVocabularySummaries(idsByType.vocabulary),
    fetchGrammarSummaries(idsByType.grammar),
    fetchVideoSummaries(idsByType.video_lesson),
  ])

  const result: BookmarkSummary[] = []
  for (const row of rows) {
    const base = { targetId: row.targetId, createdAt: row.createdAt }
    if (row.targetType === 'kanji') {
      const item = kanjiMap.get(row.targetId)
      if (item) result.push({ targetType: 'kanji', ...base, item })
    } else if (row.targetType === 'vocabulary') {
      const item = vocabMap.get(row.targetId)
      if (item) result.push({ targetType: 'vocabulary', ...base, item })
    } else if (row.targetType === 'grammar') {
      const item = grammarMap.get(row.targetId)
      if (item) result.push({ targetType: 'grammar', ...base, item })
    } else {
      const item = videoMap.get(row.targetId)
      if (item) result.push({ targetType: 'video_lesson', ...base, item })
    }
  }
  return result
}

async function targetExists(
  targetType: BookmarkTargetType,
  targetId: string,
): Promise<boolean> {
  if (targetType === 'kanji') {
    const [row] = await db
      .select({ id: kanjiItems.id })
      .from(kanjiItems)
      .where(eq(kanjiItems.id, targetId))
      .limit(1)
    return Boolean(row)
  }
  if (targetType === 'vocabulary') {
    const [row] = await db
      .select({ id: vocabularyItems.id })
      .from(vocabularyItems)
      .where(eq(vocabularyItems.id, targetId))
      .limit(1)
    return Boolean(row)
  }
  if (targetType === 'grammar') {
    const [row] = await db
      .select({ id: grammarItems.id })
      .from(grammarItems)
      .where(eq(grammarItems.id, targetId))
      .limit(1)
    return Boolean(row)
  }
  // Only published lessons are bookmarkable (matches updateVideoProgress).
  const [row] = await db
    .select({ id: videoLessons.id })
    .from(videoLessons)
    .where(and(eq(videoLessons.id, targetId), eq(videoLessons.isPublished, true)))
    .limit(1)
  return Boolean(row)
}

async function fetchKanjiSummaries(
  ids: string[],
): Promise<Map<string, KanjiListItem>> {
  if (ids.length === 0) return new Map()
  const rows = await db
    .select({
      id: kanjiItems.id,
      character: kanjiItems.character,
      onyomi: kanjiItems.onyomi,
      kunyomi: kanjiItems.kunyomi,
      meaning: kanjiItems.meaning,
      strokeCount: kanjiItems.strokeCount,
      jlptLevel: kanjiItems.jlptLevel,
    })
    .from(kanjiItems)
    .where(inArray(kanjiItems.id, ids))
  return new Map(rows.map((row) => [row.id, row]))
}

async function fetchVocabularySummaries(
  ids: string[],
): Promise<Map<string, VocabularyListItem>> {
  if (ids.length === 0) return new Map()
  const rows = await db
    .select({
      id: vocabularyItems.id,
      word: vocabularyItems.word,
      reading: vocabularyItems.reading,
      meaning: vocabularyItems.meaning,
      partOfSpeech: vocabularyItems.partOfSpeech,
      jlptLevel: vocabularyItems.jlptLevel,
    })
    .from(vocabularyItems)
    .where(inArray(vocabularyItems.id, ids))
  return new Map(rows.map((row) => [row.id, row]))
}

async function fetchGrammarSummaries(
  ids: string[],
): Promise<Map<string, GrammarListItem>> {
  if (ids.length === 0) return new Map()
  const rows = await db
    .select({
      id: grammarItems.id,
      pattern: grammarItems.pattern,
      meaning: grammarItems.meaning,
      jlptLevel: grammarItems.jlptLevel,
    })
    .from(grammarItems)
    .where(inArray(grammarItems.id, ids))
  return new Map(rows.map((row) => [row.id, row]))
}

async function fetchVideoSummaries(
  ids: string[],
): Promise<Map<string, VideoBookmarkItem>> {
  if (ids.length === 0) return new Map()
  const rows = await db
    .select({
      id: videoLessons.id,
      title: videoLessons.title,
      groupSlug: lessonGroups.slug,
      groupTitle: lessonGroups.title,
    })
    .from(videoLessons)
    .innerJoin(lessonGroups, eq(lessonGroups.id, videoLessons.lessonGroupId))
    .where(
      and(
        inArray(videoLessons.id, ids),
        eq(videoLessons.isPublished, true),
        eq(lessonGroups.isPublished, true),
      ),
    )
  return new Map(rows.map((row) => [row.id, row]))
}
