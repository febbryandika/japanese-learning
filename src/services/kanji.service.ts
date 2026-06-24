import { and, asc, count, eq, ilike, or, type SQL } from 'drizzle-orm'

import { db } from '@/lib/db'
import { kanjiItems } from '@/lib/db/schema'
import { kanjiCompoundSchema, type KanjiCompound } from '@/lib/validations'

// List/detail share the same public column set; `notes` is never exposed raw —
// it is parsed into `compounds` on the detail path only.
const listColumns = {
  id: kanjiItems.id,
  character: kanjiItems.character,
  onyomi: kanjiItems.onyomi,
  kunyomi: kanjiItems.kunyomi,
  meaning: kanjiItems.meaning,
  strokeCount: kanjiItems.strokeCount,
  jlptLevel: kanjiItems.jlptLevel,
}

export type KanjiListItem = {
  id: string
  character: string
  onyomi: string | null
  kunyomi: string | null
  meaning: string
  strokeCount: number | null
  jlptLevel: string
}

export type KanjiDetail = KanjiListItem & {
  compounds: KanjiCompound[]
}

type ListParams = {
  q?: string
  strokeCount?: number
  page: number
  pageSize: number
}

export async function listKanji({
  q,
  strokeCount,
  page,
  pageSize,
}: ListParams): Promise<{ items: KanjiListItem[]; total: number }> {
  const filters: SQL[] = []

  if (q) {
    const term = `%${q}%`
    // Single query box searches all reading/meaning fields (SPEC §5.4).
    const match = or(
      ilike(kanjiItems.character, term),
      ilike(kanjiItems.onyomi, term),
      ilike(kanjiItems.kunyomi, term),
      ilike(kanjiItems.meaning, term),
    )
    if (match) filters.push(match)
  }

  if (strokeCount != null) {
    filters.push(eq(kanjiItems.strokeCount, strokeCount))
  }

  const where = filters.length ? and(...filters) : undefined

  const [items, totalResult] = await Promise.all([
    db
      .select(listColumns)
      .from(kanjiItems)
      .where(where)
      // `character` is unique → stable ordering, so offset paging is deterministic.
      .orderBy(asc(kanjiItems.character))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(kanjiItems).where(where),
  ])

  return { items, total: totalResult[0]?.total ?? 0 }
}

// Distinct stroke counts present in the data, ascending — drives the filter
// dropdown so it only ever offers values that return results.
export async function getStrokeCountOptions(): Promise<number[]> {
  const rows = await db
    .selectDistinct({ strokeCount: kanjiItems.strokeCount })
    .from(kanjiItems)
    .orderBy(asc(kanjiItems.strokeCount))

  return rows
    .map((row) => row.strokeCount)
    .filter((value): value is number => value != null)
}

export async function getKanjiDetail(id: string): Promise<KanjiDetail | null> {
  const [row] = await db
    .select({ ...listColumns, notes: kanjiItems.notes })
    .from(kanjiItems)
    .where(eq(kanjiItems.id, id))
    .limit(1)

  if (!row) return null

  const { notes, ...rest } = row
  return { ...rest, compounds: parseCompounds(notes) }
}

// `notes` is a JSON-stringified array of compounds. Any malformed/legacy value
// degrades to an empty list rather than throwing (SPEC: parse notes safely).
function parseCompounds(notes: string | null): KanjiCompound[] {
  if (!notes) return []
  try {
    const parsed = kanjiCompoundSchema.safeParse(JSON.parse(notes))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}
