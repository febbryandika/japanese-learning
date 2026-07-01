'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BookmarkedToggle } from '@/components/BookmarkedToggle'
import { PROGRESS_LABELS } from '@/components/ProgressBadge'
import {
  JLPT_LEVELS,
  PROGRESS_STATES,
  SEARCH_TYPES,
  type JlptLevel,
  type ProgressState,
  type SearchType,
} from '@/lib/validations'

const TYPE_LABELS: Record<SearchType, string> = {
  kanji: 'Kanji',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  video: 'Videos',
}

const typeItems: Record<string, string> = {
  all: 'All types',
  ...Object.fromEntries(SEARCH_TYPES.map((type) => [type, TYPE_LABELS[type]])),
}

const levelItems: Record<string, string> = {
  all: 'All levels',
  ...Object.fromEntries(JLPT_LEVELS.map((level) => [level, level])),
}

const stateItems: Record<string, string> = {
  all: 'Any state',
  ...Object.fromEntries(
    PROGRESS_STATES.map((state) => [state, PROGRESS_LABELS[state]]),
  ),
}

export function SearchFilters({
  type,
  jlptLevel,
  progressState,
  bookmarked,
  onTypeChange,
  onJlptLevelChange,
  onProgressStateChange,
  onBookmarkedChange,
}: {
  type: SearchType | undefined
  jlptLevel: JlptLevel | undefined
  progressState: ProgressState | undefined
  bookmarked: boolean
  onTypeChange: (value: SearchType | undefined) => void
  onJlptLevelChange: (value: JlptLevel | undefined) => void
  onProgressStateChange: (value: ProgressState | undefined) => void
  onBookmarkedChange: (value: boolean) => void
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <FilterSelect
        items={typeItems}
        value={type ?? 'all'}
        label="Filter by type"
        onChange={(value) =>
          onTypeChange(value === 'all' ? undefined : (value as SearchType))
        }
      />
      <FilterSelect
        items={levelItems}
        value={jlptLevel ?? 'all'}
        label="Filter by JLPT level"
        onChange={(value) =>
          onJlptLevelChange(value === 'all' ? undefined : (value as JlptLevel))
        }
      />
      <FilterSelect
        items={stateItems}
        value={progressState ?? 'all'}
        label="Filter by mastery state"
        onChange={(value) =>
          onProgressStateChange(
            value === 'all' ? undefined : (value as ProgressState),
          )
        }
      />
      <BookmarkedToggle active={bookmarked} onToggle={onBookmarkedChange} />
    </div>
  )
}

function FilterSelect({
  items,
  value,
  label,
  onChange,
}: {
  items: Record<string, string>
  value: string
  label: string
  onChange: (value: string) => void
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onChange(next == null ? 'all' : next)}
    >
      <SelectTrigger className="w-44" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(items).map(([itemValue, itemLabel]) => (
          <SelectItem key={itemValue} value={itemValue}>
            {itemLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
