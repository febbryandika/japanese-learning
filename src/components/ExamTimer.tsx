'use client'

import { useEffect, useRef } from 'react'

import { cn, formatDuration } from '@/lib/utils'
import { useExamStore } from '@/store/useExamStore'

// Countdown driven by the shared exam store. Owns the single per-second interval
// and fires `onExpire` exactly once when the clock reaches zero (covers both a
// live timeout and an attempt loaded after its time already ran out).
export function ExamTimer({ onExpire }: { onExpire: () => void }) {
  const timeLeft = useExamStore((s) => s.timeLeft)
  const tick = useExamStore((s) => s.tick)

  const firedRef = useRef(false)

  useEffect(() => {
    const id = setInterval(() => tick(), 1000)
    return () => clearInterval(id)
  }, [tick])

  // Fire exactly once when the clock hits zero. `onExpire` may change identity
  // between renders, but firedRef ensures a single call.
  useEffect(() => {
    if (timeLeft <= 0 && !firedRef.current) {
      firedRef.current = true
      onExpire()
    }
  }, [timeLeft, onExpire])

  const low = timeLeft <= 60

  return (
    <div
      role="timer"
      aria-label="Time remaining"
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium tabular-nums',
        low ? 'border-destructive/40 text-destructive' : 'border-border',
      )}
    >
      <span aria-hidden>⏱</span>
      <span>{formatDuration(timeLeft) ?? '0:00'}</span>
    </div>
  )
}
