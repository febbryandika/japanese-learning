'use client'

import Link from 'next/link'

import type { SearchGroup, SearchResponse } from '@/hooks/use-search'
import type { SearchType } from '@/lib/validations'
import type { ProgressState } from '@/lib/validations'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PaginationControls } from '@/components/PaginationControls'
import { ProgressBadge } from '@/components/ProgressBadge'
import { Button } from '@/components/ui/button'

const TYPE_LABELS: Record<SearchType, string> = {
  kanji: 'Kanji',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  video: 'Videos',
}

// One flat result row (Sumi Night): type-glyph badge, Japanese display text,
// meaning, kind + sub line, mastery pill.
type ResultRow = {
  key: string
  href: string
  badge: string
  big: string
  title: string
  sub: string
  kind: string
  progressState: ProgressState
}

// Flatten one API group into display rows (links resolve per resource type).
function groupRows(group: SearchGroup): ResultRow[] {
  switch (group.type) {
    case 'kanji':
      return group.items.map((item) => ({
        key: item.id,
        href: `/kanji/${item.id}`,
        badge: '漢',
        big: item.character,
        title: item.meaning,
        sub: [item.onyomi, item.kunyomi].filter(Boolean).join('・') || '—',
        kind: 'Kanji',
        progressState: item.progressState ?? 'unseen',
      }))
    case 'vocabulary':
      return group.items.map((item) => ({
        key: item.id,
        href: `/vocabulary/${item.id}`,
        badge: '語',
        big: item.word,
        title: item.meaning,
        sub: item.reading,
        kind: 'Vocabulary',
        progressState: item.progressState ?? 'unseen',
      }))
    case 'grammar':
      return group.items.map((item) => ({
        key: item.id,
        href: `/grammar/${item.id}`,
        badge: '文',
        big: item.pattern,
        title: item.meaning,
        sub: item.jlptLevel,
        kind: 'Grammar',
        progressState: item.progressState ?? 'unseen',
      }))
    case 'video':
      return group.items.map((item) => ({
        key: item.id,
        href: `/videos/${item.groupSlug}/${item.id}`,
        badge: '動',
        big: item.title,
        title: item.groupTitle,
        sub: 'Video lesson',
        kind: 'Videos',
        progressState: item.progressState,
      }))
  }
}

function ResultRowLink({ row }: { row: ResultRow }) {
  return (
    <Link
      href={row.href}
      className="flex items-center gap-4 rounded-2xl border bg-card px-4.5 py-3.5 transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-primary"
    >
      <span
        className="jp grid size-[46px] shrink-0 place-items-center rounded-xl bg-secondary text-xl text-primary"
        lang="ja"
        aria-hidden
      >
        {row.badge}
      </span>
      <span className="min-w-0 flex-1">
        <span className="jp block truncate text-[17px] font-semibold" lang="ja">
          {row.big}
        </span>
        <span className="mt-0.5 block truncate text-[13px] font-medium">
          {row.title}
        </span>
        <span className="jps mt-0.5 block truncate text-[11.5px] text-muted-foreground" lang="ja">
          {row.kind} · {row.sub}
        </span>
      </span>
      <ProgressBadge state={row.progressState} className="shrink-0" />
    </Link>
  )
}

export function SearchResults({
  data,
  hasCriteria,
  isPending,
  isError,
  isPlaceholderData,
  onRetry,
  onPageChange,
  onSelectType,
}: {
  data: SearchResponse | undefined
  hasCriteria: boolean
  isPending: boolean
  isError: boolean
  isPlaceholderData: boolean
  onRetry: () => void
  onPageChange: (page: number) => void
  onSelectType: (type: SearchType) => void
}) {
  // The query is disabled until there's something to search for.
  if (!hasCriteria) {
    return (
      <p className="text-sm text-muted-foreground">
        Enter a search term or pick a filter to search across kanji, vocabulary,
        grammar, and videos.
      </p>
    )
  }

  if (isPending) {
    return (
      <LoadingState count={4} className="sm:grid-cols-1 lg:grid-cols-1" itemClassName="h-20" />
    )
  }

  if (isError || !data) {
    return <ErrorState message="Couldn't run the search." onRetry={onRetry} />
  }

  const totalHits = data.groups.reduce((sum, group) => sum + group.items.length, 0)
  if (totalHits === 0) {
    return <EmptyState message="No results match your search." />
  }

  const dim = isPlaceholderData ? 'opacity-60 transition-opacity' : ''

  // Single-type mode: one flat list with pagination.
  if (data.type && data.pagination) {
    const rows = groupRows(data.groups[0])
    return (
      <div className="space-y-6">
        <ul className={`flex flex-col gap-2.5 ${dim}`}>
          {rows.map((row) => (
            <li key={row.key}>
              <ResultRowLink row={row} />
            </li>
          ))}
        </ul>
        <PaginationControls
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={onPageChange}
        />
      </div>
    )
  }

  // Grouped mode: a preview section per type that has matches.
  return (
    <div className={`space-y-8 ${dim}`}>
      {data.groups
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section key={group.type} aria-label={TYPE_LABELS[group.type]}>
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-[15px] font-semibold">{TYPE_LABELS[group.type]}</h2>
              <span className="text-xs text-muted-foreground">
                {group.total} {group.total === 1 ? 'result' : 'results'}
              </span>
            </div>
            <ul className="flex flex-col gap-2.5">
              {groupRows(group).map((row) => (
                <li key={row.key}>
                  <ResultRowLink row={row} />
                </li>
              ))}
            </ul>
            {group.total > group.items.length ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-[10px]"
                onClick={() => onSelectType(group.type)}
              >
                View all {group.total} {TYPE_LABELS[group.type].toLowerCase()}
              </Button>
            ) : null}
          </section>
        ))}
    </div>
  )
}
