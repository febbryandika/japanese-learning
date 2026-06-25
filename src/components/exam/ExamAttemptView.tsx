'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

import {
  useExamAttempt,
  useSaveExamAnswers,
  useSubmitExam,
  type AttemptStateResponse,
} from '@/hooks/use-exam'
import { useExamStore } from '@/store/useExamStore'
import { ExamTimer } from '@/components/ExamTimer'
import { QuestionCard } from '@/components/exam/QuestionCard'
import { ExamNavigation } from '@/components/exam/ExamNavigation'
import { ErrorState } from '@/components/ErrorState'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function computeTimeLeft(startedAt: string, timeLimitMinutes: number): number {
  const elapsed = Math.floor((Date.now() - Date.parse(startedAt)) / 1000)
  return Math.max(0, timeLimitMinutes * 60 - elapsed)
}

// Snapshot the live store answers into the request array (reads getState so
// handlers never close over stale answers).
function currentAnswerArray() {
  return Object.entries(useExamStore.getState().answers).map(
    ([questionId, userAnswer]) => ({ questionId, userAnswer }),
  )
}

export function ExamAttemptView({
  examId,
  attemptId,
}: {
  examId: string
  attemptId: string
}) {
  const { data, isPending, isError, refetch } = useExamAttempt(attemptId)

  if (isPending) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  if (isError || !data) {
    return <ErrorState message="Couldn't load this attempt." onRetry={refetch} />
  }

  if (data.status === 'submitted') {
    return <ResultView examId={examId} data={data} />
  }

  // key on the attempt id so a different attempt fully remounts (fresh state).
  return <ActiveAttempt key={data.id} data={data} />
}

function ActiveAttempt({ data }: { data: AttemptStateResponse }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const answers = useExamStore((s) => s.answers)
  const setAnswer = useExamStore((s) => s.setAnswer)
  const hydrate = useExamStore((s) => s.hydrate)
  const storeAttemptId = useExamStore((s) => s.attemptId)

  const { mutate: saveAnswers } = useSaveExamAnswers()
  const { mutate: submitExam, isPending: isSubmitting } = useSubmitExam()

  const ready = storeAttemptId === data.id

  // Hydrate the store from the server once per attempt (resume-safe: timer is
  // anchored to startedAt, answers come from what was already saved).
  useEffect(() => {
    if (storeAttemptId === data.id) return
    hydrate({
      attemptId: data.id,
      answers: data.answers,
      timeLeft: computeTimeLeft(data.startedAt, data.timeLimitMinutes),
    })
  }, [
    storeAttemptId,
    hydrate,
    data.id,
    data.answers,
    data.startedAt,
    data.timeLimitMinutes,
  ])

  // Debounced autosave: persist ~2s after the last answer change.
  useEffect(() => {
    if (!ready) return
    const id = setTimeout(() => {
      const arr = currentAnswerArray()
      if (arr.length > 0) saveAnswers({ attemptId: data.id, answers: arr })
    }, 2000)
    return () => clearTimeout(id)
  }, [answers, ready, data.id, saveAnswers])

  const flushSave = () => {
    const arr = currentAnswerArray()
    if (arr.length > 0) saveAnswers({ attemptId: data.id, answers: arr })
  }

  const handleNavigate = (index: number) => {
    flushSave()
    setCurrentIndex(Math.max(0, Math.min(index, data.questions.length - 1)))
  }

  const handleSubmit = () => {
    if (isSubmitting) return
    submitExam(
      { attemptId: data.id, answers: currentAnswerArray() },
      {
        onSuccess: () => toast.success('Exam submitted.'),
        onError: () =>
          toast.error('Could not submit the exam. Please try again.'),
      },
    )
  }

  if (!ready) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  if (data.questions.length === 0) {
    return <p className="text-muted-foreground">This exam has no questions.</p>
  }

  const question = data.questions[currentIndex]
  const answeredIds = new Set(Object.keys(answers))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="truncate text-lg font-semibold">{data.exam.title}</h1>
        <ExamTimer onExpire={handleSubmit} />
      </div>

      <QuestionCard
        question={question}
        index={currentIndex}
        total={data.questions.length}
        selected={answers[question.id]}
        disabled={isSubmitting}
        onSelect={(value) => setAnswer(question.id, value)}
      />

      <ExamNavigation
        questionIds={data.questions.map((q) => q.id)}
        currentIndex={currentIndex}
        answeredIds={answeredIds}
        onNavigate={handleNavigate}
        onSubmit={handleSubmit}
        submitting={isSubmitting}
      />
    </div>
  )
}

function ResultView({
  examId,
  data,
}: {
  examId: string
  data: AttemptStateResponse
}) {
  const reset = useExamStore((s) => s.reset)
  useEffect(() => {
    reset()
  }, [reset])

  const scoreTotal = data.scoreTotal ?? 0
  const scoreMax = data.scoreMax ?? 0
  const pct = scoreMax === 0 ? 0 : Math.round((scoreTotal / scoreMax) * 100)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exam submitted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-3xl font-semibold tabular-nums">
            {scoreTotal} / {scoreMax}
          </p>
          <p className="text-muted-foreground">{pct}% correct</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/mock-exams/${examId}/attempt/${data.id}/review`}
          className={buttonVariants({ variant: 'default' })}
        >
          Review answers
        </Link>
        <Link
          href={`/mock-exams/${examId}`}
          className={buttonVariants({ variant: 'outline' })}
        >
          Exam details
        </Link>
        <Link
          href="/mock-exams"
          className={buttonVariants({ variant: 'outline' })}
        >
          All mock exams
        </Link>
      </div>
    </div>
  )
}
