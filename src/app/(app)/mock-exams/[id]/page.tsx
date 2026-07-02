import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { MockExamDetailView } from '@/components/exam/MockExamDetailView'

export default async function MockExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  const { id } = await params

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <MockExamDetailView examId={id} />
    </main>
  )
}
