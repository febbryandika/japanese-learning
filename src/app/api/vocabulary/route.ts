import { NextResponse, type NextRequest } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { vocabularyListQuerySchema } from '@/lib/validations'
import { listVocabulary } from '@/services/vocabulary.service'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const parsed = vocabularyListQuerySchema.safeParse({
    q: sp.get('q') ?? undefined,
    partOfSpeech: sp.get('partOfSpeech') ?? undefined,
    page: sp.get('page') ?? undefined,
    pageSize: sp.get('pageSize') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters' },
      { status: 400 },
    )
  }

  const { q, partOfSpeech, page, pageSize } = parsed.data
  const { items, total } = await listVocabulary(
    { q, partOfSpeech, page, pageSize },
    session.user.id,
  )

  return NextResponse.json({
    data: items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  })
}
