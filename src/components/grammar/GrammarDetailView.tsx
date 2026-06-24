'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { useGrammarDetail } from '@/hooks/use-grammar'
import { useUpdateProgress } from '@/hooks/use-progress'
import { BookmarkButton } from '@/components/BookmarkButton'
import { ProgressSelector } from '@/components/ProgressSelector'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { STUDY_PROGRESS_STATES } from '@/lib/validations'

export function GrammarDetailView({ id }: { id: string }) {
  const { data: grammar, isPending, isError, refetch } = useGrammarDetail(id)
  const updateProgress = useUpdateProgress()

  if (isPending) {
    return <DetailSkeleton />
  }

  if (isError || !grammar) {
    return <ErrorState message="Couldn't load this grammar." onRetry={refetch} />
  }

  return (
    <article className="space-y-8">
      <Link
        href="/grammar"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All grammar
      </Link>

      <header className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{grammar.jlptLevel}</Badge>
          <div className="flex items-center gap-2">
            <ProgressSelector
              value={grammar.progressState}
              options={STUDY_PROGRESS_STATES}
              disabled={updateProgress.isPending}
              onChange={(progressState) =>
                updateProgress.mutate(
                  { targetType: 'grammar', targetId: grammar.id, progressState },
                  {
                    onError: () =>
                      toast.error(
                        'Could not update progress. Please try again.',
                      ),
                  },
                )
              }
            />
            <BookmarkButton targetType="grammar" targetId={grammar.id} />
          </div>
        </div>
        <h1 className="text-3xl leading-tight font-semibold" lang="ja">
          {grammar.pattern}
        </h1>
        <p className="text-lg font-medium">{grammar.meaning}</p>
      </header>

      {grammar.formation ? (
        <Section title="Formation">
          <p className="text-sm whitespace-pre-line" lang="ja">
            {grammar.formation}
          </p>
        </Section>
      ) : null}

      {grammar.usageNotes ? (
        <Section title="Usage notes">
          <p className="text-sm whitespace-pre-line text-muted-foreground">
            {grammar.usageNotes}
          </p>
        </Section>
      ) : null}

      {grammar.commonMistakes ? (
        <Section title="Common mistakes">
          <p className="text-sm whitespace-pre-line text-muted-foreground">
            {grammar.commonMistakes}
          </p>
        </Section>
      ) : null}

      <Section title="Example sentences">
        {grammar.examples.length > 0 ? (
          <ul className="space-y-3">
            {grammar.examples.map((example) => (
              <li key={example.id} className="space-y-1 rounded-lg border p-4">
                <p className="text-base" lang="ja">
                  {example.sentenceJa}
                </p>
                <p className="text-sm text-muted-foreground">
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
      </Section>
    </article>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  )
}
