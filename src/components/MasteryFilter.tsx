'use client'

import { cn } from '@/lib/utils'
import { PROGRESS_LABELS } from '@/components/ProgressBadge'
import {
  STUDY_PROGRESS_STATES,
  type StudyProgressState,
} from '@/lib/validations'

// Shared mastery-state filter for the study lists (kanji / vocabulary /
// grammar), rendered as Sumi Night chips: All + the three-value study subset.
// Labels come from PROGRESS_LABELS so the filter and ProgressBadge never drift.
const OPTIONS: { value: StudyProgressState | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  ...STUDY_PROGRESS_STATES.map((state) => ({
    value: state as StudyProgressState | undefined,
    label: PROGRESS_LABELS[state],
  })),
]

export function MasteryFilter({
  value,
  onChange,
}: {
  value: StudyProgressState | undefined
  onChange: (value: StudyProgressState | undefined) => void
}) {
  return (
    <div role="group" aria-label="Filter by mastery state" className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full border px-3.5 py-2 text-[12.5px] leading-none font-medium transition-colors',
              active
                ? 'border-transparent bg-primary font-semibold text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
