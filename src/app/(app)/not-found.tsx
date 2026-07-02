import Link from 'next/link'

import { EmptyState } from '@/components/EmptyState'

// Shown for notFound() within the learner area (e.g. an unknown video group),
// rendered inside the app shell so the nav stays available.
export default function AppNotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <EmptyState
        message="The page or resource you're looking for doesn't exist."
        action={
          <Link
            href="/dashboard"
            className="text-sm font-medium underline underline-offset-4 hover:text-foreground"
          >
            Back to dashboard
          </Link>
        }
      />
    </main>
  )
}
