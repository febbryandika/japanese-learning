import { and, asc, count, desc, eq, ilike, type SQL } from 'drizzle-orm'

import { db } from '@/lib/db'
import { lessonGroups, videoLessons } from '@/lib/db/schema'
import type {
  AdminListQuery,
  CreateVideoInput,
  UpdateVideoInput,
} from '@/lib/validations'
import { mapPgError } from '@/services/admin/errors'

export type AdminVideo = {
  id: string
  lessonGroupId: string
  title: string
  description: string | null
  embedUrl: string | null
  durationSeconds: number | null
  sortOrder: number
  isPublished: boolean
  // Group title for the admin table; null only if the FK ever dangles.
  groupTitle: string | null
}

const columns = {
  id: videoLessons.id,
  lessonGroupId: videoLessons.lessonGroupId,
  title: videoLessons.title,
  description: videoLessons.description,
  embedUrl: videoLessons.embedUrl,
  durationSeconds: videoLessons.durationSeconds,
  sortOrder: videoLessons.sortOrder,
  isPublished: videoLessons.isPublished,
}

export async function listVideosAdmin({
  q,
  page,
  pageSize,
}: AdminListQuery): Promise<{ items: AdminVideo[]; total: number }> {
  const filters: SQL[] = []
  if (q) {
    filters.push(ilike(videoLessons.title, `%${q}%`))
  }
  const where = filters.length ? and(...filters) : undefined

  const [items, totalResult] = await Promise.all([
    db
      .select({ ...columns, groupTitle: lessonGroups.title })
      .from(videoLessons)
      .leftJoin(lessonGroups, eq(lessonGroups.id, videoLessons.lessonGroupId))
      .where(where)
      // Newest first; id tiebreaker keeps offset paging deterministic.
      .orderBy(desc(videoLessons.createdAt), asc(videoLessons.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(videoLessons).where(where),
  ])

  return { items, total: totalResult[0]?.total ?? 0 }
}

export async function createVideo(
  input: CreateVideoInput,
): Promise<AdminVideo> {
  try {
    const [row] = await db.insert(videoLessons).values(input).returning(columns)
    // groupTitle isn't returned by the insert; the manager refetches the list.
    return { ...row, groupTitle: null }
  } catch (error) {
    mapPgError(error)
  }
}

export async function updateVideo(
  id: string,
  input: UpdateVideoInput,
): Promise<AdminVideo | null> {
  if (Object.keys(input).length === 0) {
    const [row] = await db
      .select({ ...columns, groupTitle: lessonGroups.title })
      .from(videoLessons)
      .leftJoin(lessonGroups, eq(lessonGroups.id, videoLessons.lessonGroupId))
      .where(eq(videoLessons.id, id))
      .limit(1)
    return row ?? null
  }

  try {
    const [row] = await db
      .update(videoLessons)
      .set(input)
      .where(eq(videoLessons.id, id))
      .returning(columns)
    return row ? { ...row, groupTitle: null } : null
  } catch (error) {
    mapPgError(error)
  }
}

export async function deleteVideo(id: string): Promise<{ id: string } | null> {
  const [row] = await db
    .delete(videoLessons)
    .where(eq(videoLessons.id, id))
    .returning({ id: videoLessons.id })
  return row ?? null
}
