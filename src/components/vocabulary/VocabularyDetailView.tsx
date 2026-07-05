'use client'

import { toast } from 'sonner'

import { useVocabularyDetail } from '@/hooks/use-vocabulary'
import { useUpdateProgress } from '@/hooks/use-progress'
import { AIExampleBlock } from '@/components/AIExampleBlock'
import { BookmarkButton } from '@/components/BookmarkButton'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { MasterySegments } from '@/components/MasterySegments'
import { ProgressBadge } from '@/components/ProgressBadge'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import {
  STUDY_PROGRESS_STATES,
  VOCAB_POS_LABELS,
  type VocabPartOfSpeech,
} from '@/lib/validations'

function posLabel(partOfSpeech: string | null): string | null {
  if (!partOfSpeech) return null
  return VOCAB_POS_LABELS[partOfSpeech as VocabPartOfSpeech] ?? partOfSpeech
}

export function VocabularyDetailView({ id }: { id: string }) {
  const { data: vocab, isPending, isError, refetch } = useVocabularyDetail(id)
  const updateProgress = useUpdateProgress()

  if (isPending) {
    return <DetailSkeleton />
  }

  if (isError || !vocab) {
    return (
      <ErrorState message="Couldn't load this vocabulary." onRetry={refetch} />
    )
  }

  const label = posLabel(vocab.partOfSpeech)
  const hasExample =
    Boolean(vocab.exampleSentenceOriginal) ||
    Boolean(vocab.exampleSentenceTranslation)

  return (
    <article className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Vocabulary', href: '/vocabulary' },
          { label: vocab.word },
        ]}
      />

      <div className="grid items-start gap-7 lg:grid-cols-[340px_1fr]">
        {/* Word panel — sticky on desktop */}
        <div className="rounded-2xl border bg-card p-7 text-center lg:sticky lg:top-6">
          <div className="kchar text-6xl leading-tight sm:text-7xl" lang="ja">
            {vocab.word}
          </div>
          <div className="jp mt-3 text-lg text-primary" lang="ja">
            {vocab.reading}
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <span className="rounded-lg bg-secondary px-2.5 py-1.5 text-[11.5px] leading-none font-semibold">
              {vocab.jlptLevel}
            </span>
            {label ? (
              <span className="rounded-lg bg-secondary px-2.5 py-1.5 text-[11.5px] leading-none font-semibold">
                {label}
              </span>
            ) : null}
          </div>
          <div className="mt-5 flex justify-center">
            <ProgressBadge state={vocab.progressState} />
          </div>
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-6">
          <header>
            <h1 className="text-3xl font-bold tracking-tight">{vocab.meaning}</h1>
            {vocab.notes ? (
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {vocab.notes}
              </p>
            ) : null}
          </header>

          <div>
            <div className="mb-2.5 text-xs font-semibold text-muted-foreground">
              Mastery
            </div>
            <div className="flex flex-wrap items-center gap-3.5">
              <MasterySegments
                value={vocab.progressState}
                options={STUDY_PROGRESS_STATES}
                disabled={updateProgress.isPending}
                onChange={(progressState) =>
                  updateProgress.mutate(
                    {
                      targetType: 'vocabulary',
                      targetId: vocab.id,
                      progressState,
                    },
                    {
                      onError: () =>
                        toast.error('Could not update progress. Please try again.'),
                    },
                  )
                }
              />
              <BookmarkButton
                targetType="vocabulary"
                targetId={vocab.id}
                showLabel
              />
            </div>
          </div>

          <section className="rounded-2xl border bg-card p-[22px]">
            <h2 className="mb-3.5 text-sm font-semibold">Example sentence</h2>
            {hasExample ? (
              <div className="border-l-2 border-primary pl-3.5">
                {vocab.exampleSentenceOriginal ? (
                  <p className="jp text-[17px] leading-relaxed" lang="ja">
                    {vocab.exampleSentenceOriginal}
                  </p>
                ) : null}
                {vocab.exampleSentenceTranslation ? (
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {vocab.exampleSentenceTranslation}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No example sentence available.
              </p>
            )}
          </section>

          <AIExampleBlock
            targetType="vocabulary"
            targetId={vocab.id}
            examples={vocab.generatedExamples}
          />
        </div>
      </div>
    </article>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-32" />
      <div className="grid items-start gap-7 lg:grid-cols-[340px_1fr]">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-12 w-full max-w-sm" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
