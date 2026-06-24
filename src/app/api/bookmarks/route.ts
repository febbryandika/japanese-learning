import { NextResponse, type NextRequest } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { bookmarksListQuerySchema } from '@/lib/validations'
import { listBookmarks } from '@/services/bookmark.service'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = bookmarksListQuerySchema.safeParse({
    type: request.nextUrl.searchParams.get('type') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters' },
      { status: 400 },
    )
  }

  const data = await listBookmarks(session.user.id, parsed.data.type)
  return NextResponse.json({ data })
}
