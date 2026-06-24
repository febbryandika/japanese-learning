import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'
import type { DashboardProgressStat } from '@/lib/validations'

// A single Progress Summary card: percentage, mastered/total, and a bar.
// `mastered / total` per task 7. Links to the resource's browse page.
export function DashboardProgressCard({
  label,
  stat,
  href,
}: {
  label: string
  stat: DashboardProgressStat
  href: string
}) {
  return (
    <Link href={href} className="block rounded-xl">
      <Card className="h-full transition-colors hover:border-ring">
        <CardContent className="space-y-3 py-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
            <span className="text-2xl font-semibold tabular-nums">
              {stat.percentage}%
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={stat.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${label} mastered`}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width]"
              style={{ width: `${stat.percentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {stat.mastered} of {stat.total} mastered
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
