import { NextResponse, type NextRequest } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { kanjiListQuerySchema } from '@/lib/validations'
import { getStrokeCountOptions, listKanji } from '@/services/kanji.service'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const parsed = kanjiListQuerySchema.safeParse({
    q: sp.get('q') ?? undefined,
    strokeCount: sp.get('strokeCount') ?? undefined,
    page: sp.get('page') ?? undefined,
    pageSize: sp.get('pageSize') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters' },
      { status: 400 },
    )
  }

  const { q, strokeCount, page, pageSize } = parsed.data
  const [{ items, total }, strokeCounts] = await Promise.all([
    listKanji({ q, strokeCount, page, pageSize }),
    getStrokeCountOptions(),
  ])

  return NextResponse.json({
    data: items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    strokeCounts,
  })
}
