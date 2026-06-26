import { NextResponse, type NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { adminListQuerySchema, createGrammarSchema } from '@/lib/validations'
import { createGrammar, listGrammarAdmin } from '@/services/admin/grammar.service'

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: guard.status },
    )
  }

  const sp = request.nextUrl.searchParams
  const parsed = adminListQuerySchema.safeParse({
    q: sp.get('q') ?? undefined,
    page: sp.get('page') ?? undefined,
    pageSize: sp.get('pageSize') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
  }

  const { items, total } = await listGrammarAdmin(parsed.data)
  const { page, pageSize } = parsed.data
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

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: guard.status },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = createGrammarSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid grammar pattern' }, { status: 400 })
  }

  const created = await createGrammar(parsed.data)
  return NextResponse.json(created, { status: 201 })
}
