import { NextResponse, type NextRequest } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { searchQuerySchema } from '@/lib/validations'
import { search } from '@/services/search.service'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const parsed = searchQuerySchema.safeParse({
    q: sp.get('q') ?? undefined,
    type: sp.get('type') ?? undefined,
    jlptLevel: sp.get('jlptLevel') ?? undefined,
    progressState: sp.get('progressState') ?? undefined,
    bookmarked: sp.get('bookmarked') ?? undefined,
    page: sp.get('page') ?? undefined,
    pageSize: sp.get('pageSize') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters' },
      { status: 400 },
    )
  }

  const result = await search(parsed.data, session.user.id)
  return NextResponse.json(result)
}
