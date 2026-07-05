import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { PageHeader } from '@/components/PageHeader'
import { MockExamList } from '@/components/exam/MockExamList'

export const metadata: Metadata = {
  title: 'Mock Exams',
}

export default async function MockExamsPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <main>
      <PageHeader title="Mock Exams" jpTitle="模擬試験" />
      <div className="mx-auto w-full max-w-4xl px-6 py-6 sm:px-8">
        <MockExamList />
      </div>
    </main>
  )
}
