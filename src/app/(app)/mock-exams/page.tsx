import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
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
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Mock Exams</h1>
      <MockExamList />
    </main>
  )
}
