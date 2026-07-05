import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { PageHeader } from '@/components/PageHeader'
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
    <main>
      <PageHeader title="Progress" jpTitle="学習記録" />
      <div className="mx-auto w-full max-w-5xl px-6 py-6 sm:px-8">
        <ProgressBrowser />
      </div>
    </main>
  )
}
