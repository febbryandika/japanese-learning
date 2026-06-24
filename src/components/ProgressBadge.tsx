import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProgressState } from '@/lib/validations'

const PROGRESS_CONFIG: Record<ProgressState, { label: string; className: string }> = {
  unseen: {
    label: 'Not started',
    className: 'bg-muted text-muted-foreground',
  },
  in_progress: {
    label: 'In progress',
    className:
      'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  },
  reviewing: {
    label: 'Reviewing',
    className: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200',
  },
  mastered: {
    label: 'Mastered',
    className:
      'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  },
  completed: {
    label: 'Completed',
    className:
      'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  },
}

// State labels, keyed by state — shared with ProgressSelector so the badge and
// the selector dropdown never drift apart.
export const PROGRESS_LABELS = Object.fromEntries(
  Object.entries(PROGRESS_CONFIG).map(([state, config]) => [state, config.label]),
) as Record<ProgressState, string>

export function ProgressBadge({
  state,
  className,
}: {
  state: ProgressState
  className?: string
}) {
  const config = PROGRESS_CONFIG[state]
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
