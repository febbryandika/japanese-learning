import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { ExamReviewQuestion } from '@/lib/validations'

function statusBadge(question: ExamReviewQuestion) {
  if (question.userAnswer === null) {
    return { label: 'Unanswered', className: 'bg-muted text-muted-foreground' }
  }
  if (question.isCorrect) {
    return {
      label: 'Correct',
      className:
        'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    }
  }
  return {
    label: 'Incorrect',
    className: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
  }
}

export function QuestionReviewCard({
  question,
  index,
  total,
}: {
  question: ExamReviewQuestion
  index: number
  total: number
}) {
  const badge = statusBadge(question)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Question {index + 1} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{question.sectionName}</Badge>
            <Badge variant="secondary" className={badge.className}>
              {badge.label}
            </Badge>
          </div>
        </div>
        <p className="pt-1 text-base leading-relaxed">{question.prompt}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {question.choices.map((choice) => {
            const isCorrectChoice = choice === question.correctAnswer
            const isUserWrong =
              choice === question.userAnswer && !isCorrectChoice
            return (
              <li
                key={choice}
                className={cn(
                  'flex items-start justify-between gap-3 rounded-lg border p-3 text-sm',
                  isCorrectChoice &&
                    'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
                  isUserWrong &&
                    'border-red-500 bg-red-50 dark:bg-red-950/40',
                )}
              >
                <span className="flex-1">{choice}</span>
                {isCorrectChoice && (
                  <Badge variant="secondary" className="shrink-0">
                    Correct answer
                  </Badge>
                )}
                {isUserWrong && (
                  <Badge variant="secondary" className="shrink-0">
                    Your answer
                  </Badge>
                )}
              </li>
            )
          })}
        </ul>

        {question.userAnswer === null && (
          <p className="text-sm text-muted-foreground">No answer selected.</p>
        )}

        {question.explanation && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="mb-1 font-medium">Explanation</p>
            <p className="text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function QuestionReviewSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="mt-1 h-5 w-full max-w-md" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}
