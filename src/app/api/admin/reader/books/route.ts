import { NextResponse, type NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { adminListQuerySchema, createBookSchema } from '@/lib/validations'
import { createBook, listBooksAdmin } from '@/services/admin/book.service'

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

  const { items, total } = await listBooksAdmin(parsed.data)
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
  const parsed = createBookSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid book' }, { status: 400 })
  }

  const created = await createBook(parsed.data)
  return NextResponse.json(created, { status: 201 })
}
