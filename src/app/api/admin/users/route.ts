import { NextResponse, type NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { adminUsersListQuerySchema, createUserSchema } from '@/lib/validations'
import { createUserAdmin, listUsersAdmin } from '@/services/admin/user.service'
import { UniqueConstraintError } from '@/services/admin/errors'

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: guard.status },
    )
  }

  const sp = request.nextUrl.searchParams
  const parsed = adminUsersListQuerySchema.safeParse({
    q: sp.get('q') ?? undefined,
    sortBy: sp.get('sortBy') ?? undefined,
    sortDir: sp.get('sortDir') ?? undefined,
    page: sp.get('page') ?? undefined,
    pageSize: sp.get('pageSize') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
  }

  const { items, total } = await listUsersAdmin(parsed.data)
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
  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  try {
    const created = await createUserAdmin(parsed.data)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return NextResponse.json(
        { error: 'A user with that email already exists' },
        { status: 409 },
      )
    }
    throw error
  }
}
