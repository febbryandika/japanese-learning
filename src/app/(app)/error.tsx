'use client'

import { useEffect } from 'react'

import { ErrorState } from '@/components/ErrorState'

// Route-segment error boundary for the learner area. Renders inside the app
// shell, so navigation stays available while the failed segment offers a retry.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <ErrorState
        message="Something went wrong loading this page."
        onRetry={reset}
      />
    </main>
  )
}
