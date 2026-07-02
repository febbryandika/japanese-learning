import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { LessonDetailView } from '@/components/videos/LessonDetailView'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ groupSlug: string; lessonId: string }>
}) {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  const { groupSlug, lessonId } = await params

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <LessonDetailView lessonId={lessonId} groupSlug={groupSlug} />
    </main>
  )
}
