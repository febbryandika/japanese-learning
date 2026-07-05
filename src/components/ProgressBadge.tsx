import { cn } from '@/lib/utils'
import type { ProgressState } from '@/lib/validations'

// Sumi Night mastery pills: tinted background + dot prefix, colored per state
// via the --mp-* theme tokens (green mastered, blue reviewing, amber in
// progress, gray unseen).
const PROGRESS_CONFIG: Record<ProgressState, { label: string; className: string }> = {
  unseen: {
    label: 'Not started',
    className: 'bg-[var(--mp-unseen-bg)] text-[var(--mp-unseen-fg)]',
  },
  in_progress: {
    label: 'In progress',
    className: 'bg-[var(--mp-progress-bg)] text-[var(--mp-progress-fg)]',
  },
  reviewing: {
    label: 'Reviewing',
    className: 'bg-[var(--mp-reviewing-bg)] text-[var(--mp-reviewing-fg)]',
  },
  mastered: {
    label: 'Mastered',
    className: 'bg-[var(--mp-mastered-bg)] text-[var(--mp-mastered-fg)]',
  },
  completed: {
    label: 'Completed',
    className: 'bg-[var(--mp-mastered-bg)] text-[var(--mp-mastered-fg)]',
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
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-2 text-[11.5px] leading-none font-semibold whitespace-nowrap',
        "before:size-[7px] before:rounded-full before:bg-current before:opacity-85 before:content-['']",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
