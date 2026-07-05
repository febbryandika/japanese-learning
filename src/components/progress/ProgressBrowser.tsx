'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import {
  useProgress,
  useUpdateProgress,
  type ProgressSummary,
} from '@/hooks/use-progress'
import { KanjiCard } from '@/components/KanjiCard'
import { VocabularyCard } from '@/components/VocabularyCard'
import { GrammarCard } from '@/components/GrammarCard'
import { VideoLessonCard } from '@/components/VideoLessonCard'
import { ProgressSelector } from '@/components/ProgressSelector'
import { PROGRESS_LABELS } from '@/components/ProgressBadge'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PROGRESS_STATES,
  STUDY_PROGRESS_STATES,
  VIDEO_PROGRESS_STATES,
  type BookmarkTargetType,
  type ProgressState,
} from '@/lib/validations'

type TypeFilter = 'all' | BookmarkTargetType
type StateFilter = 'all' | ProgressState

const TYPE_ITEMS: Record<string, string> = {
  all: 'All types',
  kanji: 'Kanji',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  video_lesson: 'Video lessons',
}

const STATE_ITEMS: Record<string, string> = {
  all: 'All states',
  ...Object.fromEntries(PROGRESS_STATES.map((state) => [state, PROGRESS_LABELS[state]])),
}

// Fixed section order so the grouped view is stable regardless of view recency.
const GROUP_ORDER: BookmarkTargetType[] = [
  'kanji',
  'vocabulary',
  'grammar',
  'video_lesson',
]

export function ProgressBrowser() {
  const [type, setType] = useState<TypeFilter>('all')
  const [state, setState] = useState<StateFilter>('all')

  const { data, isPending, isError, refetch } = useProgress({
    type: type === 'all' ? undefined : type,
    state: state === 'all' ? undefined : state,
  })

  const filtersActive = type !== 'all' || state !== 'all'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          items={TYPE_ITEMS}
          value={type}
          onValueChange={(value) => setType(value as TypeFilter)}
        >
          <SelectTrigger className="w-52" aria-label="Filter progress by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TYPE_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={STATE_ITEMS}
          value={state}
          onValueChange={(value) => setState(value as StateFilter)}
        >
          <SelectTrigger className="w-52" aria-label="Filter progress by state">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATE_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ProgressResults
        data={data?.data}
        filtersActive={filtersActive}
        isPending={isPending}
        isError={isError}
        onRetry={refetch}
      />
    </div>
  )
}

function ProgressResults({
  data,
  filtersActive,
  isPending,
  isError,
  onRetry,
}: {
  data: ProgressSummary[] | undefined
  filtersActive: boolean
  isPending: boolean
  isError: boolean
  onRetry: () => void
}) {
  if (isPending) {
    return <CardGridSkeleton />
  }

  if (isError || !data) {
    return <ErrorState message="Couldn't load your progress." onRetry={onRetry} />
  }

  if (data.length === 0) {
    return (
      <EmptyState
        message={
          filtersActive
            ? 'No resources match this filter.'
            : 'No tracked resources yet. Open a kanji, vocabulary, grammar, or video lesson to start tracking progress.'
        }
      />
    )
  }

  // The list arrives most-recently-viewed first; grouping preserves that order.
  const groups = GROUP_ORDER.map((groupType) => ({
    type: groupType,
    items: data.filter((entry) => entry.targetType === groupType),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.type} className="space-y-3">
          <h2 className="text-[15px] font-semibold">
            {TYPE_ITEMS[group.type] ?? group.type}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({group.items.length})
            </span>
          </h2>
          <ul className={GROUP_GRID[group.type]}>
            {group.items.map((entry) => (
              <li
                key={`${entry.targetType}-${entry.targetId}`}
                className="space-y-2"
              >
                <ProgressCard progress={entry} />
                <ProgressItemControl progress={entry} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

// Per-type layout: tiles for kanji/vocabulary, full-width rows for grammar and
// video lessons (matching each card's shape).
const GROUP_GRID: Record<BookmarkTargetType, string> = {
  kanji: 'grid grid-cols-2 gap-3.5 sm:grid-cols-3',
  vocabulary: 'grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3',
  grammar: 'flex flex-col gap-3',
  video_lesson: 'flex flex-col gap-3',
}

function ProgressCard({ progress }: { progress: ProgressSummary }) {
  switch (progress.targetType) {
    case 'kanji':
      return <KanjiCard kanji={progress.item} />
    case 'vocabulary':
      return <VocabularyCard vocab={progress.item} />
    case 'grammar':
      return <GrammarCard grammar={progress.item} />
    case 'video_lesson':
      return <VideoLessonCard lesson={progress.item} />
  }
}

function ProgressItemControl({ progress }: { progress: ProgressSummary }) {
  const updateProgress = useUpdateProgress()
  const options =
    progress.targetType === 'video_lesson'
      ? VIDEO_PROGRESS_STATES
      : STUDY_PROGRESS_STATES

  return (
    <ProgressSelector
      value={progress.progressState}
      options={options}
      disabled={updateProgress.isPending}
      className="w-full"
      onChange={(progressState) =>
        updateProgress.mutate(
          {
            targetType: progress.targetType,
            targetId: progress.targetId,
            progressState,
          },
          {
            onError: () =>
              toast.error('Could not update progress. Please try again.'),
          },
        )
      }
    />
  )
}

function CardGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-36 w-full rounded-xl" />
      ))}
    </div>
  )
}
