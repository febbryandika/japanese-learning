import Link from 'next/link'

import { ProgressBadge } from '@/components/ProgressBadge'
import type { GrammarListItem } from '@/hooks/use-grammar'

// Sumi Night grammar row: pattern in a fixed serif column, meaning beside it,
// mastery pill on the right. Rendered as full-width rows (not a card grid).
export function GrammarCard({ grammar }: { grammar: GrammarListItem }) {
  return (
    <Link
      href={`/grammar/${grammar.id}`}
      className="flex items-center gap-5 rounded-2xl border bg-card px-5 py-[18px] transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_30px_-14px_var(--ring)] sm:px-6"
    >
      <span
        className="jp min-w-0 text-xl leading-snug font-medium sm:min-w-[200px] sm:text-2xl"
        lang="ja"
      >
        {grammar.pattern}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-medium">{grammar.meaning}</span>
      </span>
      {grammar.progressState ? (
        <ProgressBadge state={grammar.progressState} className="shrink-0" />
      ) : null}
    </Link>
  )
}
