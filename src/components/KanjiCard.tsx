import Link from 'next/link'

import { ProgressBadge } from '@/components/ProgressBadge'
import type { KanjiListItem } from '@/hooks/use-kanji'

// Sumi Night kanji tile: centered gradient glyph, meaning, readings + stroke
// count, mastery pill. Hover lifts the tile with a brand border.
export function KanjiCard({ kanji }: { kanji: KanjiListItem }) {
  const readings = [kanji.onyomi, kanji.kunyomi].filter(Boolean).join('・')

  return (
    <Link
      href={`/kanji/${kanji.id}`}
      className="block h-full rounded-2xl border bg-card p-[18px] text-center transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_30px_-14px_var(--ring)]"
    >
      <span className="kchar text-6xl" lang="ja">
        {kanji.character}
      </span>
      <p className="mt-3 line-clamp-2 text-[13.5px] font-semibold">{kanji.meaning}</p>
      <p className="jp mt-1 truncate text-[11.5px] text-muted-foreground" lang="ja">
        {readings || '—'}
        {kanji.strokeCount != null ? (
          <>
            <span className="opacity-50"> · </span>
            {kanji.strokeCount}画
          </>
        ) : null}
      </p>
      <div className="mt-2.5 flex justify-center">
        {kanji.progressState ? <ProgressBadge state={kanji.progressState} /> : null}
      </div>
    </Link>
  )
}
