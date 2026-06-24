'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PROGRESS_LABELS } from '@/components/ProgressBadge'
import type { ProgressState } from '@/lib/validations'

// Presentational, controlled dropdown for changing mastery state. The consumer
// wires `onChange` to its progress mutation and passes the state set valid for
// the resource (study items vs videos). Reused on every detail view and on the
// /progress page rows.
export function ProgressSelector({
  value,
  options,
  onChange,
  disabled,
  className,
}: {
  value: ProgressState
  options: readonly ProgressState[]
  onChange: (state: ProgressState) => void
  disabled?: boolean
  className?: string
}) {
  // value → label map so <SelectValue> renders the current state's label.
  const items = Object.fromEntries(
    options.map((state) => [state, PROGRESS_LABELS[state]]),
  )

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onChange(next as ProgressState)}
      disabled={disabled}
    >
      <SelectTrigger className={className} aria-label="Set progress state">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((state) => (
          <SelectItem key={state} value={state}>
            {PROGRESS_LABELS[state]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
