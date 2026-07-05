import Link from 'next/link'

import { ProgressBadge } from '@/components/ProgressBadge'
import { VOCAB_POS_LABELS, type VocabPartOfSpeech } from '@/lib/validations'
import type { VocabularyListItem } from '@/hooks/use-vocabulary'

function posLabel(partOfSpeech: string | null): string | null {
  if (!partOfSpeech) return null
  return VOCAB_POS_LABELS[partOfSpeech as VocabPartOfSpeech] ?? partOfSpeech
}

// Sumi Night vocabulary tile: word + reading on a shared baseline, meaning,
// part-of-speech tag + mastery pill.
export function VocabularyCard({ vocab }: { vocab: VocabularyListItem }) {
  const label = posLabel(vocab.partOfSpeech)

  return (
    <Link
      href={`/vocabulary/${vocab.id}`}
      className="block h-full rounded-2xl border bg-card p-[18px] transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_30px_-14px_var(--ring)]"
    >
      <p className="flex items-baseline gap-3">
        <span className="jp text-3xl leading-none font-medium" lang="ja">
          {vocab.word}
        </span>
        <span className="jp truncate text-sm text-muted-foreground" lang="ja">
          {vocab.reading}
        </span>
      </p>
      <p className="mt-2.5 line-clamp-2 text-sm font-medium">{vocab.meaning}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        {label ? (
          <span className="rounded-lg bg-secondary px-2 py-1 text-[11px] leading-none font-medium text-muted-foreground">
            {label}
          </span>
        ) : null}
        {vocab.progressState ? <ProgressBadge state={vocab.progressState} /> : null}
      </div>
    </Link>
  )
}
