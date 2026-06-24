import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { DashboardWeakArea } from '@/lib/validations'

// Lowest-scoring exam sections. Empty until the Phase 3 mock-exam module exists,
// so this renders an empty state today; the populated branch is ready for then.
export function WeakAreasCard({ weakAreas }: { weakAreas: DashboardWeakArea[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weak areas</CardTitle>
      </CardHeader>
      <CardContent>
        {weakAreas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Take a mock exam to see your weakest sections here.
          </p>
        ) : (
          <ul className="space-y-3">
            {weakAreas.map((area) => (
              <li key={area.sectionName} className="space-y-1">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium" lang="ja">
                    {area.sectionName}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {area.correct}/{area.total} · {area.percentage}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${area.percentage}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
