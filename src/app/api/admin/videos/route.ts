import { NextResponse, type NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { adminListQuerySchema, createVideoSchema } from '@/lib/validations'
import { createVideo, listVideosAdmin } from '@/services/admin/video.service'
import { ForeignKeyError } from '@/services/admin/errors'

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

  const { items, total } = await listVideosAdmin(parsed.data)
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
  const parsed = createVideoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid video lesson' }, { status: 400 })
  }

  try {
    const created = await createVideo(parsed.data)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof ForeignKeyError) {
      return NextResponse.json(
        { error: 'Selected lesson group does not exist' },
        { status: 400 },
      )
    }
    throw error
  }
}
