'use client'

import { toast } from 'sonner'

import { useKanjiDetail } from '@/hooks/use-kanji'
import { useUpdateProgress } from '@/hooks/use-progress'
import { AIExampleBlock } from '@/components/AIExampleBlock'
import { BookmarkButton } from '@/components/BookmarkButton'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ProgressSelector } from '@/components/ProgressSelector'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { STUDY_PROGRESS_STATES } from '@/lib/validations'

export function KanjiDetailView({ id }: { id: string }) {
  const { data: kanji, isPending, isError, refetch } = useKanjiDetail(id)
  const updateProgress = useUpdateProgress()

  if (isPending) {
    return <DetailSkeleton />
  }

  if (isError || !kanji) {
    return <ErrorState message="Couldn't load this kanji." onRetry={refetch} />
  }

  return (
    <article className="space-y-8">
      <Breadcrumbs
        items={[{ label: 'Kanji', href: '/kanji' }, { label: kanji.character }]}
      />

      <header className="flex flex-wrap items-start gap-6">
        <span className="text-7xl leading-none" lang="ja">
          {kanji.character}
        </span>
        <div className="order-last ml-auto flex items-center gap-2">
          <ProgressSelector
            value={kanji.progressState}
            options={STUDY_PROGRESS_STATES}
            disabled={updateProgress.isPending}
            onChange={(progressState) =>
              updateProgress.mutate(
                { targetType: 'kanji', targetId: kanji.id, progressState },
                {
                  onError: () =>
                    toast.error('Could not update progress. Please try again.'),
                },
              )
            }
          />
          <BookmarkButton targetType="kanji" targetId={kanji.id} />
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{kanji.jlptLevel}</Badge>
            <span className="text-sm text-muted-foreground">
              {kanji.strokeCount != null
                ? `${kanji.strokeCount} strokes`
                : 'Stroke count unavailable'}
            </span>
          </div>
          <p className="text-lg font-medium">{kanji.meaning}</p>
          <dl className="grid gap-1 text-sm">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-muted-foreground">Onyomi</dt>
              <dd lang="ja">{kanji.onyomi ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-muted-foreground">Kunyomi</dt>
              <dd lang="ja">{kanji.kunyomi ?? '—'}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Compound vocabulary</h2>
        {kanji.compounds.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No compound words available.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {kanji.compounds.map((compound, index) => (
              <li
                key={`${compound.word}-${index}`}
                className="flex flex-wrap items-baseline justify-between gap-2 p-3"
              >
                <div className="space-y-0.5">
                  <p className="font-medium" lang="ja">
                    {compound.word}
                  </p>
                  <p className="text-xs text-muted-foreground" lang="ja">
                    {compound.reading}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {compound.meaning}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AIExampleBlock
        targetType="kanji"
        targetId={kanji.id}
        examples={kanji.generatedExamples}
      />
    </article>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-5 w-24" />
      <div className="flex gap-6">
        <Skeleton className="size-24 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-full max-w-xs" />
        </div>
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  )
}
