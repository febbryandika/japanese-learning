import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { ProgressBrowser } from '@/components/progress/ProgressBrowser'

export const metadata: Metadata = {
  title: 'Progress',
}

export default async function ProgressPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Progress</h1>
      <ProgressBrowser />
    </main>
  )
}
