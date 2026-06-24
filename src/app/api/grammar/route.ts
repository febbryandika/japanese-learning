import { NextResponse, type NextRequest } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { grammarListQuerySchema } from '@/lib/validations'
import { getJlptLevelOptions, listGrammar } from '@/services/grammar.service'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const parsed = grammarListQuerySchema.safeParse({
    q: sp.get('q') ?? undefined,
    jlptLevel: sp.get('jlptLevel') ?? undefined,
    page: sp.get('page') ?? undefined,
    pageSize: sp.get('pageSize') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters' },
      { status: 400 },
    )
  }

  const { q, jlptLevel, page, pageSize } = parsed.data
  const [{ items, total }, jlptLevels] = await Promise.all([
    listGrammar({ q, jlptLevel, page, pageSize }, session.user.id),
    getJlptLevelOptions(),
  ])

  return NextResponse.json({
    data: items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    jlptLevels,
  })
}
