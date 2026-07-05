'use client'

import { toast } from 'sonner'

import { useGrammarDetail } from '@/hooks/use-grammar'
import { useUpdateProgress } from '@/hooks/use-progress'
import { AIExampleBlock } from '@/components/AIExampleBlock'
import { BookmarkButton } from '@/components/BookmarkButton'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { MasterySegments } from '@/components/MasterySegments'
import { ProgressBadge } from '@/components/ProgressBadge'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { STUDY_PROGRESS_STATES } from '@/lib/validations'

// Uppercase section label inside the formation/notes card.
function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
      {children}
    </div>
  )
}

export function GrammarDetailView({ id }: { id: string }) {
  const { data: grammar, isPending, isError, refetch } = useGrammarDetail(id)
  const updateProgress = useUpdateProgress()

  if (isPending) {
    return <DetailSkeleton />
  }

  if (isError || !grammar) {
    return <ErrorState message="Couldn't load this grammar." onRetry={refetch} />
  }

  // Formation / usage notes / common mistakes live in one card, separated by
  // hairlines, per the design.
  const noteBlocks = [
    { label: 'Formation', text: grammar.formation, lang: 'ja', muted: false },
    { label: 'Usage notes', text: grammar.usageNotes, lang: undefined, muted: true },
    { label: 'Common mistakes', text: grammar.commonMistakes, lang: undefined, muted: true },
  ].filter((block) => Boolean(block.text))

  return (
    <article className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Grammar', href: '/grammar' },
          { label: grammar.pattern },
        ]}
      />

      <div className="grid items-start gap-7 lg:grid-cols-[340px_1fr]">
        {/* Pattern panel — sticky on desktop */}
        <div className="rounded-2xl border bg-card p-7 text-center lg:sticky lg:top-6">
          <div className="jp text-3xl leading-snug font-medium" lang="ja">
            {grammar.pattern}
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <span className="rounded-lg bg-secondary px-2.5 py-1.5 text-[11.5px] leading-none font-semibold">
              {grammar.jlptLevel}
            </span>
            <span className="rounded-lg bg-secondary px-2.5 py-1.5 text-[11.5px] leading-none font-semibold">
              Grammar
            </span>
          </div>
          <div className="mt-5 flex justify-center">
            <ProgressBadge state={grammar.progressState} />
          </div>
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-6">
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">
            {grammar.meaning}
          </h1>

          {noteBlocks.length > 0 ? (
            <section className="rounded-2xl border bg-card p-[22px]">
              {noteBlocks.map((block, index) => (
                <div key={block.label}>
                  {index > 0 ? <div className="my-4 h-px bg-border" /> : null}
                  <CardLabel>{block.label}</CardLabel>
                  <p
                    className={`jps mt-2 text-sm leading-relaxed whitespace-pre-line ${
                      block.muted ? 'text-muted-foreground' : 'font-medium'
                    }`}
                    lang={block.lang}
                  >
                    {block.text}
                  </p>
                </div>
              ))}
            </section>
          ) : null}

          <div>
            <div className="mb-2.5 text-xs font-semibold text-muted-foreground">
              Mastery
            </div>
            <div className="flex flex-wrap items-center gap-3.5">
              <MasterySegments
                value={grammar.progressState}
                options={STUDY_PROGRESS_STATES}
                disabled={updateProgress.isPending}
                onChange={(progressState) =>
                  updateProgress.mutate(
                    { targetType: 'grammar', targetId: grammar.id, progressState },
                    {
                      onError: () =>
                        toast.error('Could not update progress. Please try again.'),
                    },
                  )
                }
              />
              <BookmarkButton targetType="grammar" targetId={grammar.id} showLabel />
            </div>
          </div>

          <section className="rounded-2xl border bg-card p-[22px]">
            <h2 className="mb-3.5 text-sm font-semibold">Example sentences</h2>
            {grammar.examples.length > 0 ? (
              <ul className="flex flex-col gap-4">
                {grammar.examples.map((example) => (
                  <li key={example.id} className="border-l-2 border-primary pl-3.5">
                    <p className="jp text-[17px] leading-relaxed" lang="ja">
                      {example.sentenceJa}
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {example.sentenceEn}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No example sentences available.
              </p>
            )}
          </section>

          <AIExampleBlock
            targetType="grammar"
            targetId={grammar.id}
            examples={grammar.generatedExamples}
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
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
