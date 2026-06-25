import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { listPublishedBooks } from '@/services/reader.service'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await listPublishedBooks(session.user.id)
  return NextResponse.json({ data })
}
