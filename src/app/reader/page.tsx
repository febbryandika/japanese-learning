import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { ReaderLibrary } from '@/components/reader/ReaderLibrary'

export default async function ReaderPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Reader</h1>
      <ReaderLibrary />
    </main>
  )
}
