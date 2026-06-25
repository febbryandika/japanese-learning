'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { AttemptQuestion } from '@/services/exam.service'

import { AnswerOption } from './AnswerOption'

export function QuestionCard({
  question,
  index,
  total,
  selected,
  disabled,
  onSelect,
}: {
  question: AttemptQuestion
  index: number
  total: number
  selected: string | undefined
  disabled?: boolean
  onSelect: (value: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Question {index + 1} of {total}
          </span>
          <Badge variant="secondary">{question.sectionName}</Badge>
        </div>
        <p className="pt-1 text-base leading-relaxed">{question.prompt}</p>
      </CardHeader>
      <CardContent>
        <fieldset className="space-y-2">
          <legend className="sr-only">Answer choices</legend>
          {question.choices.map((choice) => (
            <AnswerOption
              key={choice}
              name={`q-${question.id}`}
              value={choice}
              label={choice}
              checked={selected === choice}
              disabled={disabled}
              onSelect={onSelect}
            />
          ))}
        </fieldset>
      </CardContent>
    </Card>
  )
}
