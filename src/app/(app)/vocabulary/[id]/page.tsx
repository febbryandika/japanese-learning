import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { VocabularyDetailView } from '@/components/vocabulary/VocabularyDetailView'

export default async function VocabularyDetailPage({
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
    <main className="mx-auto w-full max-w-6xl px-6 py-6 sm:px-8">
      <VocabularyDetailView id={id} />
    </main>
  )
}
