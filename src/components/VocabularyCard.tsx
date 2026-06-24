import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressBadge } from '@/components/ProgressBadge'
import { VOCAB_POS_LABELS, type VocabPartOfSpeech } from '@/lib/validations'
import type { VocabularyListItem } from '@/hooks/use-vocabulary'

function posLabel(partOfSpeech: string | null): string | null {
  if (!partOfSpeech) return null
  return VOCAB_POS_LABELS[partOfSpeech as VocabPartOfSpeech] ?? partOfSpeech
}

export function VocabularyCard({ vocab }: { vocab: VocabularyListItem }) {
  const label = posLabel(vocab.partOfSpeech)

  return (
    <Link href={`/vocabulary/${vocab.id}`} className="block rounded-xl">
      <Card className="h-full transition-colors hover:border-ring">
        <CardContent className="space-y-1 py-4">
          <p className="text-2xl leading-none font-medium" lang="ja">
            {vocab.word}
          </p>
          <p className="text-sm text-muted-foreground" lang="ja">
            {vocab.reading}
          </p>
          <p className="line-clamp-2 text-sm">{vocab.meaning}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary">{vocab.jlptLevel}</Badge>
            {label ? (
              <span className="text-xs text-muted-foreground">{label}</span>
            ) : null}
            {vocab.progressState ? (
              <ProgressBadge state={vocab.progressState} />
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
