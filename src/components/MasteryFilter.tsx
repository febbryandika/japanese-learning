'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PROGRESS_LABELS } from '@/components/ProgressBadge'
import {
  STUDY_PROGRESS_STATES,
  type StudyProgressState,
} from '@/lib/validations'

// Shared mastery-state filter for the study lists (kanji / vocabulary / grammar).
// Offers the three-value study subset; labels come from PROGRESS_LABELS so the
// filter and the ProgressBadge never drift apart.
const items: Record<string, string> = {
  all: 'Any mastery',
  ...Object.fromEntries(
    STUDY_PROGRESS_STATES.map((state) => [state, PROGRESS_LABELS[state]]),
  ),
}

export function MasteryFilter({
  value,
  onChange,
}: {
  value: StudyProgressState | undefined
  onChange: (value: StudyProgressState | undefined) => void
}) {
  return (
    <Select
      items={items}
      value={value ?? 'all'}
      onValueChange={(next) =>
        onChange(
          next == null || next === 'all'
            ? undefined
            : (next as StudyProgressState),
        )
      }
    >
      <SelectTrigger className="w-44" aria-label="Filter by mastery state">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(items).map(([itemValue, label]) => (
          <SelectItem key={itemValue} value={itemValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
