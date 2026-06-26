import { and, asc, count, eq, ilike, or, type SQL } from 'drizzle-orm'

import { db } from '@/lib/db'
import { kanjiItems } from '@/lib/db/schema'
import type {
  AdminListQuery,
  CreateKanjiInput,
  UpdateKanjiInput,
} from '@/lib/validations'
import { mapPgError } from '@/services/admin/errors'

export type AdminKanji = {
  id: string
  character: string
  onyomi: string | null
  kunyomi: string | null
  meaning: string
  strokeCount: number | null
  jlptLevel: string
  notes: string | null
}

const columns = {
  id: kanjiItems.id,
  character: kanjiItems.character,
  onyomi: kanjiItems.onyomi,
  kunyomi: kanjiItems.kunyomi,
  meaning: kanjiItems.meaning,
  strokeCount: kanjiItems.strokeCount,
  jlptLevel: kanjiItems.jlptLevel,
  notes: kanjiItems.notes,
}

export async function listKanjiAdmin({
  q,
  page,
  pageSize,
}: AdminListQuery): Promise<{ items: AdminKanji[]; total: number }> {
  const filters: SQL[] = []
  if (q) {
    const term = `%${q}%`
    const match = or(
      ilike(kanjiItems.character, term),
      ilike(kanjiItems.onyomi, term),
      ilike(kanjiItems.kunyomi, term),
      ilike(kanjiItems.meaning, term),
    )
    if (match) filters.push(match)
  }
  const where = filters.length ? and(...filters) : undefined

  const [items, totalResult] = await Promise.all([
    db
      .select(columns)
      .from(kanjiItems)
      .where(where)
      // `character` is unique → stable ordering for deterministic offset paging.
      .orderBy(asc(kanjiItems.character))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(kanjiItems).where(where),
  ])

  return { items, total: totalResult[0]?.total ?? 0 }
}

export async function createKanji(input: CreateKanjiInput): Promise<AdminKanji> {
  try {
    const [row] = await db.insert(kanjiItems).values(input).returning(columns)
    return row
  } catch (error) {
    mapPgError(error)
  }
}

export async function updateKanji(
  id: string,
  input: UpdateKanjiInput,
): Promise<AdminKanji | null> {
  if (Object.keys(input).length === 0) {
    const [row] = await db
      .select(columns)
      .from(kanjiItems)
      .where(eq(kanjiItems.id, id))
      .limit(1)
    return row ?? null
  }

  try {
    const [row] = await db
      .update(kanjiItems)
      .set(input)
      .where(eq(kanjiItems.id, id))
      .returning(columns)
    return row ?? null
  } catch (error) {
    mapPgError(error)
  }
}

export async function deleteKanji(id: string): Promise<{ id: string } | null> {
  const [row] = await db
    .delete(kanjiItems)
    .where(eq(kanjiItems.id, id))
    .returning({ id: kanjiItems.id })
  return row ?? null
}
