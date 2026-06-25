'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { useMockExam, useStartAttempt } from '@/hooks/use-exam'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function MockExamDetailView({ examId }: { examId: string }) {
  const router = useRouter()
  const { data: exam, isPending, isError, refetch } = useMockExam(examId)
  const startAttempt = useStartAttempt()

  if (isPending) {
    return <Skeleton className="h-64 w-full rounded-xl" />
  }

  if (isError || !exam) {
    return <ErrorState message="Couldn't load this exam." onRetry={refetch} />
  }

  const handleStart = () => {
    startAttempt.mutate(examId, {
      onSuccess: ({ attemptId }) => {
        router.push(`/mock-exams/${examId}/attempt/${attemptId}`)
      },
      onError: () => toast.error('Could not start the exam. Please try again.'),
    })
  }

  return (
    <div className="space-y-6">
      <Link
        href="/mock-exams"
        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        ← All mock exams
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{exam.title}</CardTitle>
          {exam.description && (
            <CardDescription>{exam.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">{exam.timeLimitMinutes} min</Badge>
            <span className="text-muted-foreground">
              {exam.questionCount} questions
            </span>
          </div>

          {exam.sections.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium">Sections</h2>
              <ul className="divide-y rounded-lg border">
                {exam.sections.map((section) => (
                  <li
                    key={section.sectionName}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span>{section.sectionName}</span>
                    <span className="text-muted-foreground">
                      {section.questionCount} questions
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            onClick={handleStart}
            disabled={startAttempt.isPending || exam.questionCount === 0}
          >
            {startAttempt.isPending ? 'Starting…' : 'Start exam'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
