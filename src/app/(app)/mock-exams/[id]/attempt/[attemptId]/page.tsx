import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { ExamAttemptView } from '@/components/exam/ExamAttemptView'

export default async function ExamAttemptPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>
}) {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  const { id, attemptId } = await params

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <ExamAttemptView examId={id} attemptId={attemptId} />
    </main>
  )
}
