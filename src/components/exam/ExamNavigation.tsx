'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ExamNavigation({
  questionIds,
  currentIndex,
  answeredIds,
  onNavigate,
  onSubmit,
  submitting,
}: {
  questionIds: string[]
  currentIndex: number
  answeredIds: Set<string>
  onNavigate: (index: number) => void
  onSubmit: () => void
  submitting?: boolean
}) {
  const total = questionIds.length

  return (
    <div className="space-y-4">
      {/* Jump grid — answered questions are filled. */}
      <div className="flex flex-wrap gap-1.5">
        {questionIds.map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(i)}
            aria-current={i === currentIndex ? 'true' : undefined}
            aria-label={`Go to question ${i + 1}${
              answeredIds.has(id) ? ', answered' : ''
            }`}
            className={cn(
              'flex size-8 items-center justify-center rounded-md border text-xs font-medium transition-colors',
              i === currentIndex && 'ring-2 ring-ring/50',
              answeredIds.has(id)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:bg-muted',
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => onNavigate(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate(currentIndex + 1)}
          disabled={currentIndex >= total - 1}
        >
          Next
        </Button>
      </div>

      <Button className="w-full" onClick={onSubmit} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit exam'}
      </Button>
    </div>
  )
}
