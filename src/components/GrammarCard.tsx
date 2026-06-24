import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressBadge } from '@/components/ProgressBadge'
import type { GrammarListItem } from '@/hooks/use-grammar'

export function GrammarCard({ grammar }: { grammar: GrammarListItem }) {
  return (
    <Link href={`/grammar/${grammar.id}`} className="block rounded-xl">
      <Card className="h-full transition-colors hover:border-ring">
        <CardContent className="space-y-1 py-4">
          <p className="text-xl leading-snug font-medium" lang="ja">
            {grammar.pattern}
          </p>
          <p className="line-clamp-2 text-sm">{grammar.meaning}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary">{grammar.jlptLevel}</Badge>
            {grammar.progressState ? (
              <ProgressBadge state={grammar.progressState} />
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
