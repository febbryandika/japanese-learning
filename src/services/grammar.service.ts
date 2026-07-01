import { and, asc, count, eq, ilike, or, type SQL } from 'drizzle-orm'

import { db } from '@/lib/db'
import { grammarExamples, grammarItems, studyProgress } from '@/lib/db/schema'
import type {
  JlptLevel,
  ProgressState,
  StudyProgressState,
} from '@/lib/validations'
import {
  bookmarkedFilter,
  progressStateFilter,
} from '@/services/study-filters'

// List/detail share the same base column set; detail adds the optional prose
// fields plus the joined curated examples.
const listColumns = {
  id: grammarItems.id,
  pattern: grammarItems.pattern,
  meaning: grammarItems.meaning,
  jlptLevel: grammarItems.jlptLevel,
}

export type GrammarListItem = {
  id: string
  pattern: string
  meaning: string
  jlptLevel: string
  // The caller's mastery state, joined per user on the list path. Optional so the
  // detail/bookmark/progress paths (which don't join it here) stay type-clean.
  progressState?: ProgressState
}

export type GrammarExample = {
  id: string
  sentenceJa: string
  sentenceEn: string
  orderIndex: number
}

export type GrammarDetail = GrammarListItem & {
  formation: string | null
  usageNotes: string | null
  commonMistakes: string | null
  examples: GrammarExample[]
}

type ListParams = {
  q?: string
  jlptLevel?: JlptLevel
  progressState?: StudyProgressState
  bookmarked?: boolean
  page: number
  pageSize: number
}

export async function listGrammar(
  { q, jlptLevel, progressState, bookmarked, page, pageSize }: ListParams,
  userId: string,
): Promise<{ items: GrammarListItem[]; total: number }> {
  const filters: SQL[] = []

  if (q) {
    const term = `%${q}%`
    // Single query box searches pattern / meaning (SPEC §5.6).
    const match = or(
      ilike(grammarItems.pattern, term),
      ilike(grammarItems.meaning, term),
    )
    if (match) filters.push(match)
  }

  if (jlptLevel) {
    filters.push(eq(grammarItems.jlptLevel, jlptLevel))
  }

  const prog = progressStateFilter(progressState)
  if (prog) filters.push(prog)
  if (bookmarked) {
    filters.push(bookmarkedFilter('grammar', grammarItems.id, userId))
  }

  const where = filters.length ? and(...filters) : undefined

  // Per-user progress so each card shows the caller's mastery badge and the state
  // filter can match; a missing row means `unseen`. The join is 1:1 (uq_progress),
  // so it's safe in the count query too.
  const progressJoin = and(
    eq(studyProgress.targetId, grammarItems.id),
    eq(studyProgress.targetType, 'grammar'),
    eq(studyProgress.userId, userId),
  )

  const [rows, totalResult] = await Promise.all([
    db
      .select({ ...listColumns, progressState: studyProgress.progressState })
      .from(grammarItems)
      .leftJoin(studyProgress, progressJoin)
      .where(where)
      // `pattern` is not unique → add `id` as a tiebreaker so offset paging is
      // deterministic (no duplicate/skipped rows across pages).
      .orderBy(asc(grammarItems.pattern), asc(grammarItems.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
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

  return { items, total: totalResult[0]?.total ?? 0 }
}

// Distinct JLPT levels present in the data, ascending — drives the filter
// dropdown so it only ever offers values that return results.
export async function getJlptLevelOptions(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ jlptLevel: grammarItems.jlptLevel })
    .from(grammarItems)
    .orderBy(asc(grammarItems.jlptLevel))

  return rows.map((row) => row.jlptLevel)
}

export async function getGrammarDetail(
  id: string,
): Promise<GrammarDetail | null> {
  const [item] = await db
    .select({
      ...listColumns,
      formation: grammarItems.formation,
      usageNotes: grammarItems.usageNotes,
      commonMistakes: grammarItems.commonMistakes,
    })
    .from(grammarItems)
    .where(eq(grammarItems.id, id))
    .limit(1)

  if (!item) return null

  // Curated examples, ordered by orderIndex (id tiebreaker for stable output).
  const examples = await db
    .select({
      id: grammarExamples.id,
      sentenceJa: grammarExamples.sentenceJa,
      sentenceEn: grammarExamples.sentenceEn,
      orderIndex: grammarExamples.orderIndex,
    })
    .from(grammarExamples)
    .where(eq(grammarExamples.grammarId, id))
    .orderBy(asc(grammarExamples.orderIndex), asc(grammarExamples.id))

  return { ...item, examples }
}
