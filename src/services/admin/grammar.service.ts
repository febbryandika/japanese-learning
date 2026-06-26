import { and, asc, count, eq, ilike, or, type SQL } from 'drizzle-orm'

import { db } from '@/lib/db'
import { grammarItems } from '@/lib/db/schema'
import type {
  AdminListQuery,
  CreateGrammarInput,
  UpdateGrammarInput,
} from '@/lib/validations'

export type AdminGrammar = {
  id: string
  pattern: string
  meaning: string
  formation: string | null
  usageNotes: string | null
  commonMistakes: string | null
  jlptLevel: string
}

const columns = {
  id: grammarItems.id,
  pattern: grammarItems.pattern,
  meaning: grammarItems.meaning,
  formation: grammarItems.formation,
  usageNotes: grammarItems.usageNotes,
  commonMistakes: grammarItems.commonMistakes,
  jlptLevel: grammarItems.jlptLevel,
}

export async function listGrammarAdmin({
  q,
  page,
  pageSize,
}: AdminListQuery): Promise<{ items: AdminGrammar[]; total: number }> {
  const filters: SQL[] = []
  if (q) {
    const term = `%${q}%`
    const match = or(
      ilike(grammarItems.pattern, term),
      ilike(grammarItems.meaning, term),
    )
    if (match) filters.push(match)
  }
  const where = filters.length ? and(...filters) : undefined

  const [items, totalResult] = await Promise.all([
    db
      .select(columns)
      .from(grammarItems)
      .where(where)
      // `pattern` is not unique → id tiebreaker keeps offset paging deterministic.
      .orderBy(asc(grammarItems.pattern), asc(grammarItems.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(grammarItems).where(where),
  ])

  return { items, total: totalResult[0]?.total ?? 0 }
}

export async function createGrammar(
  input: CreateGrammarInput,
): Promise<AdminGrammar> {
  const [row] = await db.insert(grammarItems).values(input).returning(columns)
  return row
}

export async function updateGrammar(
  id: string,
  input: UpdateGrammarInput,
): Promise<AdminGrammar | null> {
  if (Object.keys(input).length === 0) {
    const [row] = await db
      .select(columns)
      .from(grammarItems)
      .where(eq(grammarItems.id, id))
      .limit(1)
    return row ?? null
  }

  const [row] = await db
    .update(grammarItems)
    .set(input)
    .where(eq(grammarItems.id, id))
    .returning(columns)
  return row ?? null
}

// Deleting a grammar item cascades its grammar_examples (schema FK onDelete
// cascade), so there is no dependent-row conflict to handle.
export async function deleteGrammar(
  id: string,
): Promise<{ id: string } | null> {
  const [row] = await db
    .delete(grammarItems)
    .where(eq(grammarItems.id, id))
    .returning({ id: grammarItems.id })
  return row ?? null
}
