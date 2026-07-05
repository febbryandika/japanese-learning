import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { PageHeader } from '@/components/PageHeader'
import { VideoGroupsView } from '@/components/videos/VideoGroupsView'

export const metadata: Metadata = {
  title: 'Video Lessons',
}

export default async function VideosPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <main>
      <PageHeader title="Video Lessons" jpTitle="動画" />
      <div className="mx-auto w-full max-w-6xl px-6 py-6 sm:px-8">
        <VideoGroupsView />
      </div>
    </main>
  )
}
