import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateExample } from '@/services/ai.service'
import { getVocabularyDetail } from '@/services/vocabulary.service'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!checkRateLimit(`gen-example:${session.user.id}`)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const { id } = await params
  const vocabulary = await getVocabularyDetail(id)
  if (!vocabulary) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const example = await generateExample('vocabulary', id, {
      subject: vocabulary.word,
      meaning: vocabulary.meaning,
    })
    return NextResponse.json(example, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Generation failed' }, { status: 502 })
  }
}
