import { and, count, eq, inArray } from 'drizzle-orm'

import { db } from '@/lib/db'
import { grammarItems, kanjiItems, studyProgress, vocabularyItems } from '@/lib/db/schema'
import {
  dashboardProgressStatSchema,
  dashboardWeakAreaSchema,
  type DashboardProgressStat,
  type DashboardWeakArea,
} from '@/lib/validations'
import { getUserProgress, type ProgressSummary } from './progress.service'
import { z } from 'zod'

// The three study types whose mastery drives the dashboard percentages.
type StudyType = 'kanji' | 'vocabulary' | 'grammar'

export type DashboardData = {
  progress: Record<StudyType, DashboardProgressStat>
  // Both lists reuse the enriched, lastViewedAt-sorted rows from getUserProgress
  // (already validated/typed there) so the cards render with no extra fetches.
  recentActivity: ProgressSummary[]
  continueLearning: ProgressSummary[]
  weakAreas: DashboardWeakArea[]
}

const RECENT_LIMIT = 5
const CONTINUE_LIMIT = 6

// Aggregate one learner's dashboard. Percentages are `mastered / total` per
// resource type (SPEC §5.2 / task 7). Recent activity and continue-learning are
// derived from a single getUserProgress pass (no N+1). Weak areas stay empty
// until the Phase 3 exam module lands. Scoped to `userId` throughout.
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [kanjiTotal, vocabTotal, grammarTotal, masteredRows, progress] =
    await Promise.all([
      db.select({ total: count() }).from(kanjiItems),
      db.select({ total: count() }).from(vocabularyItems),
      db.select({ total: count() }).from(grammarItems),
      // One grouped query for mastered counts across all three study types.
      db
        .select({ targetType: studyProgress.targetType, value: count() })
        .from(studyProgress)
        .where(
          and(
            eq(studyProgress.userId, userId),
            eq(studyProgress.progressState, 'mastered'),
            inArray(studyProgress.targetType, ['kanji', 'vocabulary', 'grammar']),
          ),
        )
        .groupBy(studyProgress.targetType),
      getUserProgress(userId, {}),
    ])

  const masteredByType: Record<StudyType, number> = {
    kanji: 0,
    vocabulary: 0,
    grammar: 0,
  }
  for (const row of masteredRows) {
    if (row.targetType in masteredByType) {
      masteredByType[row.targetType as StudyType] = row.value
    }
  }

  const progressStat = (mastered: number, total: number): DashboardProgressStat =>
    dashboardProgressStatSchema.parse({
      mastered,
      total,
      percentage: total === 0 ? 0 : Math.round((mastered / total) * 100),
    })

  const recentActivity = progress.data.slice(0, RECENT_LIMIT)
  const continueLearning = progress.data
    .filter(
      (p) => p.progressState === 'reviewing' || p.progressState === 'in_progress',
    )
    .slice(0, CONTINUE_LIMIT)

  return {
    progress: {
      kanji: progressStat(masteredByType.kanji, kanjiTotal[0]?.total ?? 0),
      vocabulary: progressStat(masteredByType.vocabulary, vocabTotal[0]?.total ?? 0),
      grammar: progressStat(masteredByType.grammar, grammarTotal[0]?.total ?? 0),
    },
    recentActivity,
    continueLearning,
    weakAreas: z.array(dashboardWeakAreaSchema).parse([]),
  }
}
