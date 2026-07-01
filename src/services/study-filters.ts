import {
  and,
  eq,
  exists,
  isNull,
  or,
  sql,
  type SQL,
  type SQLWrapper,
} from 'drizzle-orm'

import { db } from '@/lib/db'
import { bookmarks, studyProgress } from '@/lib/db/schema'
import type { BookmarkTargetType, ProgressState } from '@/lib/validations'

// Filter on the per-user studyProgress left join. `unseen` also matches rows with
// no progress row at all (a missing row means unseen). The consuming query MUST
// left-join studyProgress for this to reference a real column.
export function progressStateFilter(
  state: ProgressState | undefined,
): SQL | undefined {
  if (!state) return undefined
  if (state === 'unseen') {
    return or(
      isNull(studyProgress.progressState),
      eq(studyProgress.progressState, 'unseen'),
    )
  }
  return eq(studyProgress.progressState, state)
}

// Correlated EXISTS against the caller's bookmarks — index-eligible on uq_bookmark
// (userId, targetType, targetId), with no join-type juggling or row fan-out.
export function bookmarkedFilter(
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
