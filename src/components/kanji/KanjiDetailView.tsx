'use client'

import { toast } from 'sonner'

import { useKanjiDetail } from '@/hooks/use-kanji'
import { useUpdateProgress } from '@/hooks/use-progress'
import { AIExampleBlock } from '@/components/AIExampleBlock'
import { BookmarkButton } from '@/components/BookmarkButton'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { MasterySegments } from '@/components/MasterySegments'
import { ProgressBadge } from '@/components/ProgressBadge'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { STUDY_PROGRESS_STATES } from '@/lib/validations'

function MetaChip({ children, lang }: { children: React.ReactNode; lang?: string }) {
  return (
    <span
      className="rounded-lg bg-secondary px-2.5 py-1.5 text-[11.5px] leading-none font-semibold"
      lang={lang}
    >
      {children}
    </span>
  )
}

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
    <article className="space-y-6">
      <Breadcrumbs
        items={[{ label: 'Kanji', href: '/kanji' }, { label: kanji.character }]}
      />

      <div className="grid items-start gap-7 lg:grid-cols-[340px_1fr]">
        {/* Character panel — sticky on desktop */}
        <div className="rounded-2xl border bg-card p-7 text-center lg:sticky lg:top-6">
          <div className="kchar text-[110px] sm:text-[150px]" lang="ja">
            {kanji.character}
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <MetaChip>{kanji.jlptLevel}</MetaChip>
            {kanji.strokeCount != null ? (
              <MetaChip lang="ja">{kanji.strokeCount}画</MetaChip>
            ) : null}
          </div>
          <div className="mt-5 flex justify-center">
            <ProgressBadge state={kanji.progressState} />
          </div>
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-6">
          <header>
            <h1 className="text-3xl font-bold tracking-tight">{kanji.meaning}</h1>
            <div className="mt-4 flex flex-wrap gap-7">
              <div>
                <div className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  On&#39;yomi
                </div>
                <div className="jp mt-1.5 text-xl" lang="ja">
                  {kanji.onyomi ?? '—'}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  Kun&#39;yomi
                </div>
                <div className="jp mt-1.5 text-xl" lang="ja">
                  {kanji.kunyomi ?? '—'}
                </div>
              </div>
            </div>
          </header>

          <div>
            <div className="mb-2.5 text-xs font-semibold text-muted-foreground">
              Mastery
            </div>
            <div className="flex flex-wrap items-center gap-3.5">
              <MasterySegments
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
              <BookmarkButton targetType="kanji" targetId={kanji.id} showLabel />
            </div>
          </div>

          <section className="rounded-2xl border bg-card p-[22px]">
            <h2 className="mb-3.5 text-sm font-semibold">Compound vocabulary</h2>
            {kanji.compounds.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No compound words available.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {kanji.compounds.map((compound, index) => (
                  <li
                    key={`${compound.word}-${index}`}
                    className="border-l-2 border-primary pl-3.5"
                  >
                    <span className="flex flex-wrap items-baseline gap-x-3">
                      <span className="jp text-[17px] font-medium" lang="ja">
                        {compound.word}
                      </span>
                      <span className="jps text-[12.5px] text-muted-foreground" lang="ja">
                        {compound.reading}
                      </span>
                    </span>
                    <p className="mt-1 text-[13px] text-muted-foreground">
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
        </div>
      </div>
    </article>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-24" />
      <div className="grid items-start gap-7 lg:grid-cols-[340px_1fr]">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-16 w-full max-w-sm" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
