'use client'

import { useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'

type Status = 'loading' | 'ready' | 'error'

export function VideoPlayer({
  embedUrl,
  title,
}: {
  embedUrl: string | null
  title: string
}) {
  const [status, setStatus] = useState<Status>('loading')

  if (!embedUrl) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
        This lesson has no video yet.
      </div>
    )
  }

  function handleLoad() {
    setStatus('ready')
  }

  function handleError() {
    setStatus('error')
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black">
      {status === 'loading' ? (
        <Skeleton className="absolute inset-0 size-full rounded-none" />
      ) : null}

      {status === 'error' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-sm text-muted-foreground">
          The video failed to load.
        </div>
      ) : (
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 size-full"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  )
}
