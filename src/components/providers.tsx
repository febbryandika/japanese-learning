'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per browser session, created lazily so it is never shared
  // across requests on the server (the recommended App Router pattern).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Study content changes rarely; a short stale window avoids refetching
            // on every remount/nav while keeping data reasonably fresh.
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            // A single retry covers transient blips without hammering a genuinely
            // failing endpoint (e.g. a 401 that should surface quickly).
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
