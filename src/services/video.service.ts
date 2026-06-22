import { and, count, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { lessonGroups, studyProgress, videoLessons } from '@/lib/db/schema'
import type { VideoProgressState } from '@/lib/validations'

// All reads filter to published content. `studyProgress` is left-joined per user
// so each lesson carries the caller's progress; a missing row means `unseen`.

export async function getPublishedLessonGroups() {
  return db
    .select({
      id: lessonGroups.id,
      slug: lessonGroups.slug,
      title: lessonGroups.title,
      sortOrder: lessonGroups.sortOrder,
      lessonCount: count(videoLessons.id),
    })
    .from(lessonGroups)
    .leftJoin(
      videoLessons,
      and(
        eq(videoLessons.lessonGroupId, lessonGroups.id),
        eq(videoLessons.isPublished, true),
      ),
    )
    .where(eq(lessonGroups.isPublished, true))
    .groupBy(lessonGroups.id)
    .orderBy(lessonGroups.sortOrder)
}

export async function getPublishedGroupBySlug(slug: string) {
  const [group] = await db
    .select({
      id: lessonGroups.id,
      slug: lessonGroups.slug,
      title: lessonGroups.title,
      sortOrder: lessonGroups.sortOrder,
    })
    .from(lessonGroups)
    .where(and(eq(lessonGroups.slug, slug), eq(lessonGroups.isPublished, true)))
    .limit(1)

  return group ?? null
}

export async function getPublishedLessonsByGroup(groupId: string, userId: string) {
  const rows = await db
    .select({
      id: videoLessons.id,
      title: videoLessons.title,
      description: videoLessons.description,
      durationSeconds: videoLessons.durationSeconds,
      sortOrder: videoLessons.sortOrder,
      progressState: studyProgress.progressState,
    })
    .from(videoLessons)
    .leftJoin(
      studyProgress,
      and(
        eq(studyProgress.targetId, videoLessons.id),
        eq(studyProgress.targetType, 'video_lesson'),
        eq(studyProgress.userId, userId),
      ),
    )
    .where(
      and(eq(videoLessons.lessonGroupId, groupId), eq(videoLessons.isPublished, true)),
    )
    .orderBy(videoLessons.sortOrder)

  return rows.map((row) => ({
    ...row,
    progressState: row.progressState ?? ('unseen' as const),
  }))
}

export async function getLessonDetail(lessonId: string, userId: string) {
  const [row] = await db
    .select({
      id: videoLessons.id,
      lessonGroupId: videoLessons.lessonGroupId,
      title: videoLessons.title,
      description: videoLessons.description,
      embedUrl: videoLessons.embedUrl,
      durationSeconds: videoLessons.durationSeconds,
      progressState: studyProgress.progressState,
      groupSlug: lessonGroups.slug,
      groupTitle: lessonGroups.title,
    })
    .from(videoLessons)
    .innerJoin(lessonGroups, eq(lessonGroups.id, videoLessons.lessonGroupId))
    .leftJoin(
      studyProgress,
      and(
        eq(studyProgress.targetId, videoLessons.id),
        eq(studyProgress.targetType, 'video_lesson'),
        eq(studyProgress.userId, userId),
      ),
    )
    .where(
      and(
        eq(videoLessons.id, lessonId),
        eq(videoLessons.isPublished, true),
        eq(lessonGroups.isPublished, true),
      ),
    )
    .limit(1)

  if (!row) return null

  const { groupSlug, groupTitle, progressState, ...lesson } = row
  return {
    ...lesson,
    progressState: progressState ?? ('unseen' as const),
    group: { slug: groupSlug, title: groupTitle },
  }
}

export async function updateVideoProgress(
  userId: string,
  lessonId: string,
  progressState: VideoProgressState,
) {
  // Confirm the lesson is real and published before writing progress, so a
  // bogus id can't create an orphan progress row (targetId has no FK).
  const [lesson] = await db
    .select({ id: videoLessons.id })
    .from(videoLessons)
    .where(and(eq(videoLessons.id, lessonId), eq(videoLessons.isPublished, true)))
    .limit(1)

  if (!lesson) return null

  const now = new Date()
  const completedAt = progressState === 'completed' ? now : null

  const [row] = await db
    .insert(studyProgress)
    .values({
      userId,
      targetType: 'video_lesson',
      targetId: lessonId,
      progressState,
      lastViewedAt: now,
      completedAt,
    })
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
