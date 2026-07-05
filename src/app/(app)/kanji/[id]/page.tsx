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
    <main className="mx-auto w-full max-w-6xl px-6 py-6 sm:px-8">
      <KanjiDetailView id={id} />
    </main>
  )
}
