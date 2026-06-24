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
  resourceHref,
  resourceTitle,
} from './resource-display'

// Resources mid-flight (reviewing / in_progress), each with a resume link.
export function ContinueLearningList({ items }: { items: ProgressSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Continue learning</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing in progress. Mark a resource as reviewing or start a video
            lesson to pick it back up here.
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
                    </p>
                  </div>
                  <ProgressBadge state={item.progressState} />
                  <span className="shrink-0 text-sm font-medium text-foreground">
                    Resume
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
