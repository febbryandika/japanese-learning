'use client'

import Link from 'next/link'

import { useMockExams } from '@/hooks/use-exam'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function MockExamList() {
  const { data, isPending, isError, refetch } = useMockExams()

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return <ErrorState message="Couldn't load mock exams." onRetry={refetch} />
  }

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground">No mock exams available yet.</p>
    )
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {data.map((exam) => (
        <li key={exam.id}>
          <Link href={`/mock-exams/${exam.id}`} className="block rounded-xl">
            <Card className="h-full transition-colors hover:ring-foreground/20">
              <CardHeader>
                <CardTitle>{exam.title}</CardTitle>
                {exam.description && (
                  <CardDescription className="line-clamp-2">
                    {exam.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{exam.timeLimitMinutes} min</Badge>
                <span className="text-xs text-muted-foreground">
                  {exam.questionCount} questions
                </span>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  )
}
