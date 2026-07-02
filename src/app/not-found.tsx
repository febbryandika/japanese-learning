import Link from 'next/link'

import { EmptyState } from '@/components/EmptyState'

// Global fallback for URLs that match no route (rendered outside the app shell).
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <EmptyState
        message="This page doesn't exist."
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
