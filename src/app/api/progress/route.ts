import { NextResponse, type NextRequest } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { progressListQuerySchema } from '@/lib/validations'
import { getUserProgress } from '@/services/progress.service'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const parsed = progressListQuerySchema.safeParse({
    type: sp.get('type') ?? undefined,
    state: sp.get('state') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters' },
      { status: 400 },
    )
  }

  const { data, counts } = await getUserProgress(session.user.id, parsed.data)
  return NextResponse.json({ data, counts })
}
