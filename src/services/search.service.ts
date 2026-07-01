import {
  and,
  asc,
  count,
  eq,
  exists,
  ilike,
  isNull,
  or,
  sql,
  type SQL,
  type SQLWrapper,
} from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  bookmarks,
  grammarItems,
  kanjiItems,
  lessonGroups,
  studyProgress,
  vocabularyItems,
  videoLessons,
} from '@/lib/db/schema'
import type {
  BookmarkTargetType,
  JlptLevel,
  ProgressState,
  SearchType,
} from '@/lib/validations'
import type { GrammarListItem } from '@/services/grammar.service'
import type { KanjiListItem } from '@/services/kanji.service'
import type { VocabularyListItem } from '@/services/vocabulary.service'

// A video hit needs its group slug to build the detail link
// (/videos/[groupSlug]/[lessonId]).
export type SearchVideoItem = {
  id: string
  title: string
  groupSlug: string
  groupTitle: string
  progressState: ProgressState
}

// One resource type's slice of the results. `total` is the full match count (so
// grouped previews can show "View all N"); `items` is capped per mode.
export type SearchGroup =
  | { type: 'kanji'; items: KanjiListItem[]; total: number }
  | { type: 'vocabulary'; items: VocabularyListItem[]; total: number }
  | { type: 'grammar'; items: GrammarListItem[]; total: number }
  | { type: 'video'; items: SearchVideoItem[]; total: number }

export type SearchResponse = {
  // null → grouped mode (a preview per applicable type); otherwise the single
  // type that was searched.
  type: SearchType | null
  groups: SearchGroup[]
  // Present only in single-type mode.
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  } | null
}

export type SearchParams = {
  q?: string
  type?: SearchType
  jlptLevel?: JlptLevel
  progressState?: ProgressState
  bookmarked?: boolean
  page: number
  pageSize: number
}

// Grouped mode shows a small preview of each type; single-type mode pages through
// pageSize results.
const PREVIEW_LIMIT = 6

// Shared filter for the per-user studyProgress left join. `unseen` includes rows
// with no progress row at all (a missing row means unseen).
function progressFilter(state: ProgressState | undefined): SQL | undefined {
  if (!state) return undefined
  if (state === 'unseen') {
    return or(
      isNull(studyProgress.progressState),
      eq(studyProgress.progressState, 'unseen'),
    )
  }
  return eq(studyProgress.progressState, state)
}

// Correlated EXISTS against the caller's bookmarks — index-eligible on
// uq_bookmark (userId, targetType, targetId), no join-type juggling / row fan-out.
function bookmarkedFilter(
  targetType: BookmarkTargetType,
  targetId: SQLWrapper,
  userId: string,
): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.targetType, targetType),
          eq(bookmarks.targetId, targetId),
        ),
      ),
  )
}

async function searchKanji(
  p: SearchParams,
  userId: string,
): Promise<Extract<SearchGroup, { type: 'kanji' }>> {
  const filters: SQL[] = []
  if (p.q) {
    const term = `%${p.q}%`
    const match = or(
      ilike(kanjiItems.character, term),
      ilike(kanjiItems.onyomi, term),
      ilike(kanjiItems.kunyomi, term),
      ilike(kanjiItems.meaning, term),
    )
    if (match) filters.push(match)
  }
  if (p.jlptLevel) filters.push(eq(kanjiItems.jlptLevel, p.jlptLevel))
  const prog = progressFilter(p.progressState)
  if (prog) filters.push(prog)
  if (p.bookmarked) {
    filters.push(bookmarkedFilter('kanji', kanjiItems.id, userId))
  }
  const where = filters.length ? and(...filters) : undefined
  const progressJoin = and(
    eq(studyProgress.targetId, kanjiItems.id),
    eq(studyProgress.targetType, 'kanji'),
    eq(studyProgress.userId, userId),
  )

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: kanjiItems.id,
        character: kanjiItems.character,
        onyomi: kanjiItems.onyomi,
        kunyomi: kanjiItems.kunyomi,
        meaning: kanjiItems.meaning,
        strokeCount: kanjiItems.strokeCount,
        jlptLevel: kanjiItems.jlptLevel,
        progressState: studyProgress.progressState,
      })
      .from(kanjiItems)
      .leftJoin(studyProgress, progressJoin)
      .where(where)
      .orderBy(asc(kanjiItems.character))
      .limit(p.type ? p.pageSize : PREVIEW_LIMIT)
      .offset(p.type ? (p.page - 1) * p.pageSize : 0),
    db
      .select({ total: count() })
      .from(kanjiItems)
      .leftJoin(studyProgress, progressJoin)
      .where(where),
  ])

  const items = rows.map((row) => ({
    ...row,
    progressState: row.progressState ?? ('unseen' as const),
  }))
  return { type: 'kanji', items, total: totalResult[0]?.total ?? 0 }
}

async function searchVocabulary(
  p: SearchParams,
  userId: string,
): Promise<Extract<SearchGroup, { type: 'vocabulary' }>> {
  const filters: SQL[] = []
  if (p.q) {
    const term = `%${p.q}%`
    const match = or(
      ilike(vocabularyItems.word, term),
      ilike(vocabularyItems.reading, term),
      ilike(vocabularyItems.meaning, term),
    )
    if (match) filters.push(match)
  }
  if (p.jlptLevel) filters.push(eq(vocabularyItems.jlptLevel, p.jlptLevel))
  const prog = progressFilter(p.progressState)
  if (prog) filters.push(prog)
  if (p.bookmarked) {
    filters.push(bookmarkedFilter('vocabulary', vocabularyItems.id, userId))
  }
  const where = filters.length ? and(...filters) : undefined
  const progressJoin = and(
    eq(studyProgress.targetId, vocabularyItems.id),
    eq(studyProgress.targetType, 'vocabulary'),
    eq(studyProgress.userId, userId),
  )

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: vocabularyItems.id,
        word: vocabularyItems.word,
        reading: vocabularyItems.reading,
        meaning: vocabularyItems.meaning,
        partOfSpeech: vocabularyItems.partOfSpeech,
        jlptLevel: vocabularyItems.jlptLevel,
        progressState: studyProgress.progressState,
      })
      .from(vocabularyItems)
      .leftJoin(studyProgress, progressJoin)
      .where(where)
      .orderBy(asc(vocabularyItems.word), asc(vocabularyItems.id))
      .limit(p.type ? p.pageSize : PREVIEW_LIMIT)
      .offset(p.type ? (p.page - 1) * p.pageSize : 0),
    db
      .select({ total: count() })
      .from(vocabularyItems)
      .leftJoin(studyProgress, progressJoin)
      .where(where),
  ])

  const items = rows.map((row) => ({
    ...row,
    progressState: row.progressState ?? ('unseen' as const),
  }))
  return { type: 'vocabulary', items, total: totalResult[0]?.total ?? 0 }
}

async function searchGrammar(
  p: SearchParams,
  userId: string,
): Promise<Extract<SearchGroup, { type: 'grammar' }>> {
  const filters: SQL[] = []
  if (p.q) {
    const term = `%${p.q}%`
    const match = or(
      ilike(grammarItems.pattern, term),
      ilike(grammarItems.meaning, term),
    )
    if (match) filters.push(match)
  }
  if (p.jlptLevel) filters.push(eq(grammarItems.jlptLevel, p.jlptLevel))
  const prog = progressFilter(p.progressState)
  if (prog) filters.push(prog)
  if (p.bookmarked) {
    filters.push(bookmarkedFilter('grammar', grammarItems.id, userId))
  }
  const where = filters.length ? and(...filters) : undefined
  const progressJoin = and(
    eq(studyProgress.targetId, grammarItems.id),
    eq(studyProgress.targetType, 'grammar'),
    eq(studyProgress.userId, userId),
  )

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: grammarItems.id,
        pattern: grammarItems.pattern,
        meaning: grammarItems.meaning,
        jlptLevel: grammarItems.jlptLevel,
        progressState: studyProgress.progressState,
      })
      .from(grammarItems)
      .leftJoin(studyProgress, progressJoin)
      .where(where)
      .orderBy(asc(grammarItems.pattern), asc(grammarItems.id))
      .limit(p.type ? p.pageSize : PREVIEW_LIMIT)
      .offset(p.type ? (p.page - 1) * p.pageSize : 0),
    db
      .select({ total: count() })
      .from(grammarItems)
      .leftJoin(studyProgress, progressJoin)
      .where(where),
  ])

  const items = rows.map((row) => ({
    ...row,
    progressState: row.progressState ?? ('unseen' as const),
  }))
  return { type: 'grammar', items, total: totalResult[0]?.total ?? 0 }
}

async function searchVideo(
  p: SearchParams,
  userId: string,
): Promise<Extract<SearchGroup, { type: 'video' }>> {
  // Videos have no JLPT level; a JLPT-filtered search can't match any, so skip
  // the query entirely.
  if (p.jlptLevel) return { type: 'video', items: [], total: 0 }

  const filters: SQL[] = [
    eq(videoLessons.isPublished, true),
    eq(lessonGroups.isPublished, true),
  ]
  if (p.q) {
    const term = `%${p.q}%`
    const match = or(
      ilike(videoLessons.title, term),
      ilike(videoLessons.description, term),
    )
    if (match) filters.push(match)
  }
  const prog = progressFilter(p.progressState)
  if (prog) filters.push(prog)
  if (p.bookmarked) {
    filters.push(bookmarkedFilter('video_lesson', videoLessons.id, userId))
  }
  const where = and(...filters)
  const progressJoin = and(
    eq(studyProgress.targetId, videoLessons.id),
    eq(studyProgress.targetType, 'video_lesson'),
    eq(studyProgress.userId, userId),
  )

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: videoLessons.id,
        title: videoLessons.title,
        groupSlug: lessonGroups.slug,
        groupTitle: lessonGroups.title,
        progressState: studyProgress.progressState,
      })
      .from(videoLessons)
      .innerJoin(lessonGroups, eq(lessonGroups.id, videoLessons.lessonGroupId))
      .leftJoin(studyProgress, progressJoin)
      .where(where)
      .orderBy(asc(videoLessons.title), asc(videoLessons.id))
      .limit(p.type ? p.pageSize : PREVIEW_LIMIT)
      .offset(p.type ? (p.page - 1) * p.pageSize : 0),
    db
      .select({ total: count() })
      .from(videoLessons)
      .innerJoin(lessonGroups, eq(lessonGroups.id, videoLessons.lessonGroupId))
      .leftJoin(studyProgress, progressJoin)
      .where(where),
  ])

  const items = rows.map((row) => ({
    ...row,
    progressState: row.progressState ?? ('unseen' as const),
  }))
  return { type: 'video', items, total: totalResult[0]?.total ?? 0 }
}

function searchOne(
  type: SearchType,
  p: SearchParams,
  userId: string,
): Promise<SearchGroup> {
  switch (type) {
    case 'kanji':
      return searchKanji(p, userId)
    case 'vocabulary':
      return searchVocabulary(p, userId)
    case 'grammar':
      return searchGrammar(p, userId)
    case 'video':
      return searchVideo(p, userId)
  }
}

// Cross-resource search (SPEC §5.10). Grouped mode previews every applicable type
// in parallel; single-type mode pages through one resource.
export async function search(
  p: SearchParams,
  userId: string,
): Promise<SearchResponse> {
  if (p.type) {
    const group = await searchOne(p.type, p, userId)
    return {
      type: p.type,
      groups: [group],
      pagination: {
        page: p.page,
        pageSize: p.pageSize,
        total: group.total,
        totalPages: Math.max(1, Math.ceil(group.total / p.pageSize)),
      },
    }
  }

  // Grouped: a JLPT filter can never match videos, so drop that group up front.
  const types: SearchType[] = p.jlptLevel
    ? ['kanji', 'vocabulary', 'grammar']
    : ['kanji', 'vocabulary', 'grammar', 'video']
  const groups = await Promise.all(types.map((type) => searchOne(type, p, userId)))
  return { type: null, groups, pagination: null }
}
