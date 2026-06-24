import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { getVocabularyDetail } from '@/services/vocabulary.service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const vocabulary = await getVocabularyDetail(id)
  if (!vocabulary) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(vocabulary)
}
