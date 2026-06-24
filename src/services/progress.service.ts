import { and, desc, eq, inArray, type SQL } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  grammarItems,
  kanjiItems,
  lessonGroups,
  studyProgress,
  videoLessons,
  vocabularyItems,
} from '@/lib/db/schema'
import type {
  BookmarkTargetType,
  ProgressState,
  StudyProgressState,
} from '@/lib/validations'
import type { KanjiListItem } from './kanji.service'
import type { VocabularyListItem } from './vocabulary.service'
import type { GrammarListItem } from './grammar.service'
import type { VideoBookmarkItem } from './bookmark.service'

// The three study types kanji/vocab/grammar share a mastery flow; videos are
// updated through the existing video.service.updateVideoProgress.
type StudyTargetType = 'kanji' | 'vocabulary' | 'grammar'

// A progress row enriched with its resource's list-item summary, so the progress
// page can render the existing cards without a second round of fetches.
export type ProgressSummary =
  | {
      targetType: 'kanji'
      targetId: string
      progressState: ProgressState
      lastViewedAt: Date | null
      completedAt: Date | null
      item: KanjiListItem
    }
  | {
      targetType: 'vocabulary'
      targetId: string
      progressState: ProgressState
      lastViewedAt: Date | null
      completedAt: Date | null
      item: VocabularyListItem
    }
  | {
      targetType: 'grammar'
      targetId: string
      progressState: ProgressState
      lastViewedAt: Date | null
      completedAt: Date | null
      item: GrammarListItem
    }
  | {
      targetType: 'video_lesson'
      targetId: string
      progressState: ProgressState
      lastViewedAt: Date | null
      completedAt: Date | null
      item: VideoBookmarkItem
    }

// Upsert the caller's mastery state for a kanji/vocab/grammar item (keyed on the
// `uq_progress` unique constraint). `completedAt` is stamped only when the item
// reaches the terminal `mastered` state. Returns null when the target doesn't
// exist (→ 404; targetId has no FK). All writes are scoped to `userId`.
export async function updateStudyProgress(
  userId: string,
  targetType: StudyTargetType,
  targetId: string,
  progressState: StudyProgressState,
): Promise<{ progressState: ProgressState; completedAt: Date | null } | null> {
  if (!(await studyTargetExists(targetType, targetId))) {
    return null
  }

  const now = new Date()
  const completedAt = progressState === 'mastered' ? now : null

  const [row] = await db
    .insert(studyProgress)
    .values({ userId, targetType, targetId, progressState, lastViewedAt: now, completedAt })
    .onConflictDoUpdate({
      target: [studyProgress.userId, studyProgress.targetType, studyProgress.targetId],
      set: { progressState, lastViewedAt: now, completedAt },
    })
    .returning({
      progressState: studyProgress.progressState,
      completedAt: studyProgress.completedAt,
    })

  return row
}

// Record that the user opened a detail page: bumps `lastViewedAt` (inserting an
// `unseen` row the first time) without touching `progressState`/`completedAt`.
// Returns the current state so detail routes can seed it on the response.
// Callers (detail GET) have already confirmed the target exists.
export async function recordView(
  userId: string,
  targetType: BookmarkTargetType,
  targetId: string,
): Promise<ProgressState> {
  const now = new Date()
  const [row] = await db
    .insert(studyProgress)
    .values({ userId, targetType, targetId, progressState: 'unseen', lastViewedAt: now })
    .onConflictDoUpdate({
      target: [studyProgress.userId, studyProgress.targetType, studyProgress.targetId],
      set: { lastViewedAt: now },
    })
    .returning({ progressState: studyProgress.progressState })

  return row?.progressState ?? 'unseen'
}

// The user's tracked resources (optionally filtered by type/state), most recently
// viewed first, each enriched with its resource summary. Rows whose resource no
// longer exists (or is unpublished, for videos) are dropped. `counts` tallies the
// returned set by state for the page summary. Scoped to `userId`.
export async function getUserProgress(
  userId: string,
  filters: { type?: BookmarkTargetType; state?: ProgressState },
): Promise<{ data: ProgressSummary[]; counts: Record<ProgressState, number> }> {
  const conditions: SQL[] = [eq(studyProgress.userId, userId)]
  if (filters.type) conditions.push(eq(studyProgress.targetType, filters.type))
  if (filters.state) conditions.push(eq(studyProgress.progressState, filters.state))

  const rows = await db
    .select({
      targetType: studyProgress.targetType,
      targetId: studyProgress.targetId,
      progressState: studyProgress.progressState,
      lastViewedAt: studyProgress.lastViewedAt,
      completedAt: studyProgress.completedAt,
    })
    .from(studyProgress)
    .where(and(...conditions))
    .orderBy(desc(studyProgress.lastViewedAt))

  if (rows.length === 0) return { data: [], counts: emptyCounts() }

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

  const data: ProgressSummary[] = []
  for (const row of rows) {
    const base = {
      targetId: row.targetId,
      progressState: row.progressState,
      lastViewedAt: row.lastViewedAt,
      completedAt: row.completedAt,
    }
    if (row.targetType === 'kanji') {
      const item = kanjiMap.get(row.targetId)
      if (item) data.push({ targetType: 'kanji', ...base, item })
    } else if (row.targetType === 'vocabulary') {
      const item = vocabMap.get(row.targetId)
      if (item) data.push({ targetType: 'vocabulary', ...base, item })
    } else if (row.targetType === 'grammar') {
      const item = grammarMap.get(row.targetId)
      if (item) data.push({ targetType: 'grammar', ...base, item })
    } else {
      const item = videoMap.get(row.targetId)
      if (item) data.push({ targetType: 'video_lesson', ...base, item })
    }
  }

  const counts = emptyCounts()
  for (const item of data) counts[item.progressState]++

  return { data, counts }
}

function emptyCounts(): Record<ProgressState, number> {
  return { unseen: 0, in_progress: 0, reviewing: 0, mastered: 0, completed: 0 }
}

async function studyTargetExists(
  targetType: StudyTargetType,
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
  const [row] = await db
    .select({ id: grammarItems.id })
    .from(grammarItems)
    .where(eq(grammarItems.id, targetId))
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
