'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import {
  NotSubmittedError,
  useExamReview,
  useStartAttempt,
} from '@/hooks/use-exam'
import { ErrorState } from '@/components/ErrorState'
import {
  ReviewSummaryCard,
  ReviewSummarySkeleton,
} from '@/components/exam/ReviewSummaryCard'
import { SectionScoreCard } from '@/components/exam/SectionScoreCard'
import {
  QuestionReviewCard,
  QuestionReviewSkeleton,
} from '@/components/exam/QuestionReviewCard'
import { Button, buttonVariants } from '@/components/ui/button'

export function ExamReviewView({
  examId,
  attemptId,
}: {
  examId: string
  attemptId: string
}) {
  const router = useRouter()
  const { data, isPending, isError, error, refetch } = useExamReview(attemptId)
  const startAttempt = useStartAttempt()

  if (isPending) {
    return <ReviewSkeleton />
  }

  // 409: the attempt exists but isn't submitted — offer to finish it.
  if (error instanceof NotSubmittedError) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          This attempt hasn’t been submitted yet, so there’s nothing to review.
        </p>
        <Link
          href={`/mock-exams/${examId}/attempt/${attemptId}`}
          className={buttonVariants({ variant: 'default' })}
        >
          Continue the exam
        </Link>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <ErrorState message="Couldn't load this review." onRetry={refetch} />
    )
  }

  const handleRetake = () => {
    startAttempt.mutate(examId, {
      onSuccess: ({ attemptId: newAttemptId }) => {
        router.push(`/mock-exams/${examId}/attempt/${newAttemptId}`)
      },
      onError: () => toast.error('Could not start a new attempt. Try again.'),
    })
  }

  return (
    <div className="space-y-6">
      <ReviewSummaryCard attempt={data.attempt} examTitle={data.exam.title} />

      {data.sections.length > 0 && (
        <SectionScoreCard sections={data.sections} />
      )}

      {data.questions.length === 0 ? (
        <p className="text-muted-foreground">This exam has no questions.</p>
      ) : (
        <div className="space-y-4">
          {data.questions.map((question, index) => (
            <QuestionReviewCard
              key={question.id}
              question={question}
              index={index}
              total={data.questions.length}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleRetake} disabled={startAttempt.isPending}>
          {startAttempt.isPending ? 'Starting…' : 'Retake exam'}
        </Button>
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

function ReviewSkeleton() {
  return (
    <div className="space-y-6">
      <ReviewSummarySkeleton />
      <div className="space-y-4">
        <QuestionReviewSkeleton />
        <QuestionReviewSkeleton />
        <QuestionReviewSkeleton />
      </div>
    </div>
  )
}
