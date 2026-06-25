import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { updateReaderProgressSchema } from '@/lib/validations'
import { saveReaderProgress } from '@/services/reader.service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = updateReaderProgressSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid reading position' }, { status: 400 })
  }

  const { bookId } = await params
  const result = await saveReaderProgress(
    session.user.id,
    bookId,
    parsed.data.cfi,
  )
  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(result)
}
