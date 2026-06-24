'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { useVocabularyDetail } from '@/hooks/use-vocabulary'
import { BookmarkButton } from '@/components/BookmarkButton'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { VOCAB_POS_LABELS, type VocabPartOfSpeech } from '@/lib/validations'

function posLabel(partOfSpeech: string | null): string | null {
  if (!partOfSpeech) return null
  return VOCAB_POS_LABELS[partOfSpeech as VocabPartOfSpeech] ?? partOfSpeech
}

export function VocabularyDetailView({ id }: { id: string }) {
  const { data: vocab, isPending, isError, refetch } = useVocabularyDetail(id)

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
    <article className="space-y-8">
      <Link
        href="/vocabulary"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All vocabulary
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{vocab.jlptLevel}</Badge>
          {label ? (
            <span className="text-sm text-muted-foreground">{label}</span>
          ) : null}
          <BookmarkButton
            targetType="vocabulary"
            targetId={vocab.id}
            className="ml-auto"
          />
        </div>
        <h1 className="text-4xl leading-none font-semibold" lang="ja">
          {vocab.word}
        </h1>
        <p className="text-lg text-muted-foreground" lang="ja">
          {vocab.reading}
        </p>
        <p className="text-lg font-medium">{vocab.meaning}</p>
      </header>

      {vocab.notes ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Notes</h2>
          <p className="text-sm whitespace-pre-line text-muted-foreground">
            {vocab.notes}
          </p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Example sentence</h2>
        {hasExample ? (
          <div className="space-y-1 rounded-lg border p-4">
            {vocab.exampleSentenceOriginal ? (
              <p className="text-base" lang="ja">
                {vocab.exampleSentenceOriginal}
              </p>
            ) : null}
            {vocab.exampleSentenceTranslation ? (
              <p className="text-sm text-muted-foreground">
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
    </article>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-full max-w-sm" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  )
}
