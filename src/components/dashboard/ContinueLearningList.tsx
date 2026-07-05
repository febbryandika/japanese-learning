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
  resourceGlyph,
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
            {items.map((item) => {
              const glyph = resourceGlyph(item)
              return (
                <li key={`${item.targetType}-${item.targetId}`}>
                  <Link
                    href={resourceHref(item)}
                    className="group flex items-center gap-3.5 py-3"
                  >
                    <span
                      className={`jp grid size-[46px] shrink-0 place-items-center rounded-xl border border-transparent bg-secondary transition-colors group-hover:border-primary ${
                        glyph.length > 1 ? 'text-base' : 'text-2xl'
                      }`}
                      lang="ja"
                      aria-hidden
                    >
                      {glyph}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold" lang="ja">
                        {resourceTitle(item)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {RESOURCE_TYPE_LABELS[item.targetType]}
                      </span>
                    </span>
                    <ProgressBadge state={item.progressState} className="shrink-0" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
