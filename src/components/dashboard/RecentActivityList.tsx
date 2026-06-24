import Link from 'next/link'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ProgressBadge } from '@/components/ProgressBadge'
import type { ProgressSummary } from '@/hooks/use-progress'
import {
  RESOURCE_TYPE_LABELS,
  formatRelativeTime,
  resourceHref,
  resourceTitle,
} from './resource-display'

// Last viewed resources (newest first), each a quick link to its detail page.
export function RecentActivityList({ items }: { items: ProgressSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing viewed yet. Open a kanji, vocabulary, grammar, or video lesson
            to see it here.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={`${item.targetType}-${item.targetId}`}>
                <Link
                  href={resourceHref(item)}
                  className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium" lang="ja">
                      {resourceTitle(item)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {RESOURCE_TYPE_LABELS[item.targetType]}
                      {item.lastViewedAt
                        ? ` · ${formatRelativeTime(item.lastViewedAt)}`
                        : ''}
                    </p>
                  </div>
                  <ProgressBadge state={item.progressState} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
