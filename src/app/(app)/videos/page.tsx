import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
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
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Video Lessons</h1>
      <VideoGroupsView />
    </main>
  )
}
