import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { GrammarDetailView } from '@/components/grammar/GrammarDetailView'

export default async function GrammarDetailPage({
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
      <GrammarDetailView id={id} />
    </main>
  )
}
