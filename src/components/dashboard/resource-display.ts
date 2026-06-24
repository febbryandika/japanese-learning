import type { ProgressSummary } from '@/hooks/use-progress'
import type { BookmarkTargetType } from '@/lib/validations'

export const RESOURCE_TYPE_LABELS: Record<BookmarkTargetType, string> = {
  kanji: 'Kanji',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  video_lesson: 'Video',
}

// The display title for a tracked resource, by type.
export function resourceTitle(p: ProgressSummary): string {
  switch (p.targetType) {
    case 'kanji':
      return p.item.character
    case 'vocabulary':
      return p.item.word
    case 'grammar':
      return p.item.pattern
    case 'video_lesson':
      return p.item.title
  }
}

// The detail-page link for a tracked resource. Video lessons live under their
// group slug (present on the enriched item, so no extra lookup is needed).
export function resourceHref(p: ProgressSummary): string {
  switch (p.targetType) {
    case 'kanji':
      return `/kanji/${p.targetId}`
    case 'vocabulary':
      return `/vocabulary/${p.targetId}`
    case 'grammar':
      return `/grammar/${p.targetId}`
    case 'video_lesson':
      return `/videos/${p.item.groupSlug}/${p.targetId}`
  }
}

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
]

// Compact "2 hours ago" formatting for lastViewedAt (an ISO string).
export function formatRelativeTime(iso: string | null): string {
  if (!iso) return ''
  let duration = (new Date(iso).getTime() - Date.now()) / 1000
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return relativeTime.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return ''
}
