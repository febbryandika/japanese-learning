import { NextResponse, type NextRequest } from 'next/server'
import { get } from '@vercel/blob'

import { getServerSession } from '@/lib/auth'
import { getPublishedBookFileUrl } from '@/services/reader.service'

function isVercelBlobUrl(value: string): boolean {
  try {
    return new URL(value).hostname.endsWith('.blob.vercel-storage.com')
  } catch {
    return false
  }
}

// Streams a book's EPUB to authenticated learners. Private blobs are fetched
// server-side with the RW token (their URLs aren't publicly accessible); seeded
// /public paths are redirected to same-origin. The reader loads this route.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bookId } = await params
  const fileUrl = await getPublishedBookFileUrl(bookId)
  if (!fileUrl) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!isVercelBlobUrl(fileUrl)) {
    // Seeded /public path (or any non-blob URL) — resolve against this origin.
    return NextResponse.redirect(new URL(fileUrl, request.url))
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'File storage is not configured (BLOB_READ_WRITE_TOKEN missing).' },
      { status: 503 },
    )
  }

  const pathname = new URL(fileUrl).pathname.replace(/^\//, '')
  const result = await get(pathname, { access: 'private' })
  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType ?? 'application/epub+zip',
      'Cache-Control': 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
