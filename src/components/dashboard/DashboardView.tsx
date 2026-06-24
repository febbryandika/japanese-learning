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
      <section className="grid gap-4 sm:grid-cols-3">
        <DashboardProgressCard
          label="Kanji"
          stat={data.progress.kanji}
          href="/kanji"
        />
        <DashboardProgressCard
          label="Vocabulary"
          stat={data.progress.vocabulary}
          href="/vocabulary"
        />
        <DashboardProgressCard
          label="Grammar"
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
