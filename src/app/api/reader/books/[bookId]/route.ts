import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { getBookDetail } from '@/services/reader.service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bookId } = await params
  const book = await getBookDetail(session.user.id, bookId)
  if (!book) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(book)
}
