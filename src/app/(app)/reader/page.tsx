import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { PageHeader } from '@/components/PageHeader'
import { ReaderLibrary } from '@/components/reader/ReaderLibrary'

export default async function ReaderPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <main>
      <PageHeader title="Reader" jpTitle="読書" />
      <div className="mx-auto w-full max-w-6xl px-6 py-6 sm:px-8">
        <ReaderLibrary />
      </div>
    </main>
  )
}
