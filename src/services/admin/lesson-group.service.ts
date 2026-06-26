import { and, asc, count, eq, ilike, or, type SQL } from 'drizzle-orm'

import { db } from '@/lib/db'
import { lessonGroups } from '@/lib/db/schema'
import type {
  AdminListQuery,
  CreateLessonGroupInput,
  UpdateLessonGroupInput,
} from '@/lib/validations'
import { mapPgError } from '@/services/admin/errors'

export type AdminLessonGroup = {
  id: string
  slug: string
  title: string
  sortOrder: number
  isPublished: boolean
}

const columns = {
  id: lessonGroups.id,
  slug: lessonGroups.slug,
  title: lessonGroups.title,
  sortOrder: lessonGroups.sortOrder,
  isPublished: lessonGroups.isPublished,
}

export async function listLessonGroupsAdmin({
  q,
  page,
  pageSize,
}: AdminListQuery): Promise<{ items: AdminLessonGroup[]; total: number }> {
  const filters: SQL[] = []
  if (q) {
    const term = `%${q}%`
    const match = or(
      ilike(lessonGroups.title, term),
      ilike(lessonGroups.slug, term),
    )
    if (match) filters.push(match)
  }
  const where = filters.length ? and(...filters) : undefined

  const [items, totalResult] = await Promise.all([
    db
      .select(columns)
      .from(lessonGroups)
      .where(where)
      .orderBy(asc(lessonGroups.sortOrder), asc(lessonGroups.title))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(lessonGroups).where(where),
  ])

  return { items, total: totalResult[0]?.total ?? 0 }
}

export async function createLessonGroup(
  input: CreateLessonGroupInput,
): Promise<AdminLessonGroup> {
  try {
    const [row] = await db.insert(lessonGroups).values(input).returning(columns)
    return row
  } catch (error) {
    mapPgError(error)
  }
}

export async function updateLessonGroup(
  id: string,
  input: UpdateLessonGroupInput,
): Promise<AdminLessonGroup | null> {
  // A PATCH with no fields is a no-op; drizzle rejects an empty `.set()`, so just
  // return the current row (or null if it doesn't exist).
  if (Object.keys(input).length === 0) {
    const [row] = await db
      .select(columns)
      .from(lessonGroups)
      .where(eq(lessonGroups.id, id))
      .limit(1)
    return row ?? null
  }

  try {
    const [row] = await db
      .update(lessonGroups)
      .set(input)
      .where(eq(lessonGroups.id, id))
      .returning(columns)
    return row ?? null
  } catch (error) {
    mapPgError(error)
  }
}

export async function deleteLessonGroup(
  id: string,
): Promise<{ id: string } | null> {
  try {
    const [row] = await db
      .delete(lessonGroups)
      .where(eq(lessonGroups.id, id))
      .returning({ id: lessonGroups.id })
    return row ?? null
  } catch (error) {
    mapPgError(error)
  }
}
