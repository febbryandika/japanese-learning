import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { listPublishedExams } from '@/services/exam.service'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await listPublishedExams()
  return NextResponse.json({ data })
}
