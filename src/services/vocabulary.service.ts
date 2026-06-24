import { and, asc, count, eq, ilike, or, type SQL } from 'drizzle-orm'

import { db } from '@/lib/db'
import { vocabularyItems } from '@/lib/db/schema'
import type { VocabPartOfSpeech } from '@/lib/validations'

// List/detail share the same core column set; the detail path additionally
// exposes `notes` and the curated example sentence fields.
const listColumns = {
  id: vocabularyItems.id,
  word: vocabularyItems.word,
  reading: vocabularyItems.reading,
  meaning: vocabularyItems.meaning,
  partOfSpeech: vocabularyItems.partOfSpeech,
  jlptLevel: vocabularyItems.jlptLevel,
}

export type VocabularyListItem = {
  id: string
  word: string
  reading: string
  meaning: string
  partOfSpeech: string | null
  jlptLevel: string
}

export type VocabularyDetail = VocabularyListItem & {
  notes: string | null
  exampleSentenceOriginal: string | null
  exampleSentenceTranslation: string | null
}

type ListParams = {
  q?: string
  partOfSpeech?: VocabPartOfSpeech
  page: number
  pageSize: number
}

export async function listVocabulary({
  q,
  partOfSpeech,
  page,
  pageSize,
}: ListParams): Promise<{ items: VocabularyListItem[]; total: number }> {
  const filters: SQL[] = []

  if (q) {
    const term = `%${q}%`
    // Single query box searches word / reading / meaning (SPEC §5.5).
    const match = or(
      ilike(vocabularyItems.word, term),
      ilike(vocabularyItems.reading, term),
      ilike(vocabularyItems.meaning, term),
    )
    if (match) filters.push(match)
  }

  if (partOfSpeech) {
    filters.push(eq(vocabularyItems.partOfSpeech, partOfSpeech))
  }

  const where = filters.length ? and(...filters) : undefined

  const [items, totalResult] = await Promise.all([
    db
      .select(listColumns)
      .from(vocabularyItems)
      .where(where)
      // `word` is not unique → add `id` as a tiebreaker so offset paging is
      // deterministic (no duplicate/skipped rows across pages).
      .orderBy(asc(vocabularyItems.word), asc(vocabularyItems.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(vocabularyItems).where(where),
  ])

  return { items, total: totalResult[0]?.total ?? 0 }
}

export async function getVocabularyDetail(
  id: string,
): Promise<VocabularyDetail | null> {
  const [row] = await db
    .select({
      ...listColumns,
      notes: vocabularyItems.notes,
      exampleSentenceOriginal: vocabularyItems.exampleSentenceOriginal,
      exampleSentenceTranslation: vocabularyItems.exampleSentenceTranslation,
    })
    .from(vocabularyItems)
    .where(eq(vocabularyItems.id, id))
    .limit(1)

  return row ?? null
}
