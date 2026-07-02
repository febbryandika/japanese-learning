import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { ReaderView } from '@/components/reader/ReaderView'

export default async function ReaderBookPage({
  params,
}: {
  params: Promise<{ bookId: string }>
}) {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  const { bookId } = await params
  return <ReaderView bookId={bookId} />
}
