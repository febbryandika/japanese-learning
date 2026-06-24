import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { KanjiDetailView } from '@/components/kanji/KanjiDetailView'

export default async function KanjiDetailPage({
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
      <KanjiDetailView id={id} />
    </main>
  )
}
