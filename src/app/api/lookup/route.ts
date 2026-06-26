import { NextResponse, type NextRequest } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { lookupQuerySchema } from '@/lib/validations'
import { lookup } from '@/services/lookup.service'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = lookupQuerySchema.safeParse({
    q: request.nextUrl.searchParams.get('q') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters' },
      { status: 400 },
    )
  }

  try {
    return NextResponse.json(await lookup(parsed.data.q))
  } catch {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
