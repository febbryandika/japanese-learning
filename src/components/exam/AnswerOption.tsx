'use client'

import { cn } from '@/lib/utils'

// One multiple-choice option. A visually-hidden native radio keeps keyboard and
// screen-reader behavior correct; the styled label is the visible control.
export function AnswerOption({
  name,
  value,
  label,
  checked,
  disabled,
  onSelect,
}: {
  name: string
  value: string
  label: string
  checked: boolean
  disabled?: boolean
  onSelect: (value: string) => void
}) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors',
        'has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:bg-muted',
        checked ? 'border-ring bg-muted' : 'border-border',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
          checked ? 'border-primary' : 'border-muted-foreground/40',
        )}
      >
        {checked && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <span className="flex-1">{label}</span>
    </label>
  )
}
