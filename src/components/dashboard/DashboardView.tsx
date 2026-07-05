'use client'

import { useDashboard } from '@/hooks/use-dashboard'
import { ErrorState } from '@/components/ErrorState'
import { DashboardProgressCard } from './DashboardProgressCard'
import { RecentActivityList } from './RecentActivityList'
import { ContinueLearningList } from './ContinueLearningList'
import { MockExamQuickAccess } from './MockExamQuickAccess'
import { WeakAreasCard } from './WeakAreasCard'
import { DashboardSkeleton } from './DashboardSkeleton'

// Client orchestrator for the dashboard: fetches via useDashboard and lays out
// the five sections, with loading and error states.
export function DashboardView() {
  const { data, isPending, isError, refetch } = useDashboard()

  if (isPending) {
    return <DashboardSkeleton />
  }

  if (isError || !data) {
    return (
      <ErrorState message="Couldn't load your dashboard." onRetry={refetch} />
    )
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardProgressCard
          label="Kanji"
          jpLabel="漢字"
          ringColor="oklch(0.72 0.14 255)"
          stat={data.progress.kanji}
          href="/kanji"
        />
        <DashboardProgressCard
          label="Vocabulary"
          jpLabel="語彙"
          ringColor="oklch(0.78 0.14 70)"
          stat={data.progress.vocabulary}
          href="/vocabulary"
        />
        <DashboardProgressCard
          label="Grammar"
          jpLabel="文法"
          ringColor="oklch(0.74 0.15 158)"
          stat={data.progress.grammar}
          href="/grammar"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentActivityList items={data.recentActivity} />
        <ContinueLearningList items={data.continueLearning} />
        <MockExamQuickAccess />
        <WeakAreasCard weakAreas={data.weakAreas} />
      </div>
    </div>
  )
}
