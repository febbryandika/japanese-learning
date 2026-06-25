'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ErrorState'
import { useBooks } from '@/hooks/use-reader'
import type { BookListItem } from '@/services/reader.service'

export function ReaderLibrary() {
  const { data, isPending, isError, refetch } = useBooks()

  if (isPending) {
    return <LibrarySkeleton />
  }

  if (isError || !data) {
    return <ErrorState message="Couldn’t load the library." onRetry={refetch} />
  }

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground">No books are available yet.</p>
    )
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((book) => (
        <li key={book.id}>
          <BookCard book={book} />
        </li>
      ))}
    </ul>
  )
}

function BookCard({ book }: { book: BookListItem }) {
  return (
    <Card className="h-full">
      <CardContent className="flex flex-col gap-4">
        <div className="flex aspect-[2/3] w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <BookOpen className="size-10 text-muted-foreground" aria-hidden />
          )}
        </div>

        <div className="min-w-0 space-y-1">
          <p className="font-semibold" lang="ja">
            {book.title}
          </p>
          {book.author && (
            <p className="text-sm text-muted-foreground" lang="ja">
              {book.author}
            </p>
          )}
        </div>

        <Link
          href={`/reader/${book.id}`}
          className={buttonVariants({ variant: 'default' })}
        >
          {book.cfi ? 'Continue reading' : 'Start reading'}
        </Link>
      </CardContent>
    </Card>
  )
}

function LibrarySkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-80 w-full rounded-xl" />
      ))}
    </div>
  )
}
