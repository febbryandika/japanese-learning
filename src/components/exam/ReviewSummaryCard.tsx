import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ExamReviewResponse } from '@/lib/validations'

function formatSubmittedAt(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
}

export function ReviewSummaryCard({
  attempt,
  examTitle,
}: {
  attempt: ExamReviewResponse['attempt']
  examTitle: string
}) {
  const submittedAt = formatSubmittedAt(attempt.submittedAt)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review — {examTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-3xl font-semibold tabular-nums">
          {attempt.scoreTotal} / {attempt.scoreMax}
        </p>
        <p className="text-muted-foreground">{attempt.percentage}% correct</p>
        {submittedAt && (
          <p className="text-sm text-muted-foreground">
            Submitted {submittedAt}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function ReviewSummarySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-40" />
      </CardContent>
    </Card>
  )
}
