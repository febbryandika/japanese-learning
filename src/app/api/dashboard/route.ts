import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { getDashboardData } from '@/services/dashboard.service'

// User-specific by construction: the userId comes from the session, never the
// request, so a learner can only ever read their own dashboard.
export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await getDashboardData(session.user.id)
  return NextResponse.json(data)
}
