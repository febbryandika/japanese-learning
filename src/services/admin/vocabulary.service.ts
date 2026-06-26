import { and, asc, count, eq, ilike, or, type SQL } from 'drizzle-orm'

import { db } from '@/lib/db'
import { vocabularyItems } from '@/lib/db/schema'
import type {
  AdminListQuery,
  CreateVocabularyInput,
  UpdateVocabularyInput,
} from '@/lib/validations'

export type AdminVocabulary = {
  id: string
  word: string
  reading: string
  meaning: string
  partOfSpeech: string | null
  jlptLevel: string
  notes: string | null
  exampleSentenceOriginal: string | null
  exampleSentenceTranslation: string | null
}

const columns = {
  id: vocabularyItems.id,
  word: vocabularyItems.word,
  reading: vocabularyItems.reading,
  meaning: vocabularyItems.meaning,
  partOfSpeech: vocabularyItems.partOfSpeech,
  jlptLevel: vocabularyItems.jlptLevel,
  notes: vocabularyItems.notes,
  exampleSentenceOriginal: vocabularyItems.exampleSentenceOriginal,
  exampleSentenceTranslation: vocabularyItems.exampleSentenceTranslation,
}

export async function listVocabularyAdmin({
  q,
  page,
  pageSize,
}: AdminListQuery): Promise<{ items: AdminVocabulary[]; total: number }> {
  const filters: SQL[] = []
  if (q) {
    const term = `%${q}%`
    const match = or(
      ilike(vocabularyItems.word, term),
      ilike(vocabularyItems.reading, term),
      ilike(vocabularyItems.meaning, term),
    )
    if (match) filters.push(match)
  }
  const where = filters.length ? and(...filters) : undefined

  const [items, totalResult] = await Promise.all([
    db
      .select(columns)
      .from(vocabularyItems)
      .where(where)
      // `word` is not unique → id tiebreaker keeps offset paging deterministic.
      .orderBy(asc(vocabularyItems.word), asc(vocabularyItems.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(vocabularyItems).where(where),
  ])

  return { items, total: totalResult[0]?.total ?? 0 }
}

export async function createVocabulary(
  input: CreateVocabularyInput,
): Promise<AdminVocabulary> {
  const [row] = await db.insert(vocabularyItems).values(input).returning(columns)
  return row
}

export async function updateVocabulary(
  id: string,
  input: UpdateVocabularyInput,
): Promise<AdminVocabulary | null> {
  if (Object.keys(input).length === 0) {
    const [row] = await db
      .select(columns)
      .from(vocabularyItems)
      .where(eq(vocabularyItems.id, id))
      .limit(1)
    return row ?? null
  }

  const [row] = await db
    .update(vocabularyItems)
    .set(input)
    .where(eq(vocabularyItems.id, id))
    .returning(columns)
  return row ?? null
}

export async function deleteVocabulary(
  id: string,
): Promise<{ id: string } | null> {
  const [row] = await db
    .delete(vocabularyItems)
    .where(eq(vocabularyItems.id, id))
    .returning({ id: vocabularyItems.id })
  return row ?? null
}
