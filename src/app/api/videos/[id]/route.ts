import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { getLessonDetail } from '@/services/video.service'
import { isBookmarked } from '@/services/bookmark.service'
import { recordView } from '@/services/progress.service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const lesson = await getLessonDetail(id, session.user.id)
  if (!lesson) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Bump lastViewedAt for the study-history / progress page ("viewing lessons").
  await recordView(session.user.id, 'video_lesson', id)
  const bookmarked = await isBookmarked(session.user.id, 'video_lesson', id)
  return NextResponse.json({ ...lesson, isBookmarked: bookmarked })
}
