import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { getKanjiDetail } from '@/services/kanji.service'
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
  const kanji = await getKanjiDetail(id)
  if (!kanji) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const bookmarked = await isBookmarked(session.user.id, 'kanji', id)
  const progressState = await recordView(session.user.id, 'kanji', id)
  return NextResponse.json({
    ...kanji,
    isBookmarked: bookmarked,
    progressState,
  })
}
