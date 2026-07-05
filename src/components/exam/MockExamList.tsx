'use client'

import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

import { useMockExams } from '@/hooks/use-exam'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { LoadingState } from '@/components/LoadingState'

// Sumi Night exam rows: icon square, title + description, question count and
// time limit on a Japanese sub line, brand CTA chip on the right.
export function MockExamList() {
  const { data, isPending, isError, refetch } = useMockExams()

  if (isPending) {
    return (
      <LoadingState count={4} className="sm:grid-cols-1 lg:grid-cols-1" itemClassName="h-[88px]" />
    )
  }

  if (isError || !data) {
    return <ErrorState message="Couldn't load mock exams." onRetry={refetch} />
  }

  if (data.length === 0) {
    return <EmptyState message="No mock exams available yet." />
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.map((exam) => (
        <li key={exam.id}>
          <Link
            href={`/mock-exams/${exam.id}`}
            className="flex items-center gap-5 rounded-2xl border bg-card px-5 py-[18px] transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-primary sm:px-6"
          >
            <span className="grid size-[52px] shrink-0 place-items-center rounded-[13px] bg-secondary">
              <GraduationCap className="size-[22px] text-primary" strokeWidth={1.7} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">
                {exam.title}
              </span>
              {exam.description ? (
                <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                  {exam.description}
                </span>
              ) : null}
              <span className="jps mt-1 block text-xs text-muted-foreground" lang="ja">
                {exam.questionCount}問 · {exam.timeLimitMinutes} min
              </span>
            </span>
            <span className="shrink-0 rounded-[11px] bg-primary px-4 py-2.5 text-[13px] leading-none font-semibold text-primary-foreground">
              Open
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
