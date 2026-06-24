import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressBadge } from '@/components/ProgressBadge'
import type { KanjiListItem } from '@/hooks/use-kanji'

export function KanjiCard({ kanji }: { kanji: KanjiListItem }) {
  return (
    <Link href={`/kanji/${kanji.id}`} className="block rounded-xl">
      <Card className="h-full transition-colors hover:border-ring">
        <CardContent className="flex gap-4 py-4">
          <span className="text-4xl leading-none" lang="ja">
            {kanji.character}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="line-clamp-2 text-sm font-medium">{kanji.meaning}</p>
            <dl className="space-y-0.5 text-xs text-muted-foreground">
              {kanji.onyomi ? (
                <div className="flex gap-1">
                  <dt className="shrink-0">On</dt>
                  <dd className="truncate" lang="ja">
                    {kanji.onyomi}
                  </dd>
                </div>
              ) : null}
              {kanji.kunyomi ? (
                <div className="flex gap-1">
                  <dt className="shrink-0">Kun</dt>
                  <dd className="truncate" lang="ja">
                    {kanji.kunyomi}
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="secondary">{kanji.jlptLevel}</Badge>
              <span className="text-xs text-muted-foreground">
                {kanji.strokeCount != null
                  ? `${kanji.strokeCount} strokes`
                  : '— strokes'}
              </span>
              {kanji.progressState ? (
                <ProgressBadge state={kanji.progressState} />
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
