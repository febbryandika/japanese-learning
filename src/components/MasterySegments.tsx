'use client'

import { cn } from '@/lib/utils'
import { PROGRESS_LABELS } from '@/components/ProgressBadge'
import type { ProgressState } from '@/lib/validations'

// Segmented mastery control for the study detail pages (kanji / vocabulary /
// grammar): one button per state inside a pill track, active segment filled
// with the brand color. Videos keep the compact ProgressSelector dropdown.
export function MasterySegments({
  value,
  options,
  onChange,
  disabled,
}: {
  value: ProgressState
  options: readonly ProgressState[]
  onChange: (state: ProgressState) => void
  disabled?: boolean
}) {
  return (
    <div
      role="group"
      aria-label="Set progress state"
      className="inline-flex gap-1 rounded-xl bg-secondary p-1"
    >
      {options.map((state) => {
        const active = state === value
        return (
          <button
            key={state}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => {
              if (!active) onChange(state)
            }}
            className={cn(
              'rounded-lg px-4 py-2 text-[12.5px] leading-none font-semibold transition-colors disabled:opacity-50',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {PROGRESS_LABELS[state]}
          </button>
        )
      })}
    </div>
  )
}
