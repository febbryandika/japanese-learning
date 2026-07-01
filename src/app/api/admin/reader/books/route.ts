import { NextResponse, type NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { createId } from '@paralleldrive/cuid2'

import { requireAdmin } from '@/lib/auth'
import {
  adminListQuerySchema,
  bookUploadMetadataSchema,
  MAX_EPUB_UPLOAD_BYTES,
  MAX_EPUB_UPLOAD_MB,
} from '@/lib/validations'
import { createBook, listBooksAdmin } from '@/services/admin/book.service'

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: guard.status },
    )
  }

  const sp = request.nextUrl.searchParams
  const parsed = adminListQuerySchema.safeParse({
    q: sp.get('q') ?? undefined,
    page: sp.get('page') ?? undefined,
    pageSize: sp.get('pageSize') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
  }

  const { items, total } = await listBooksAdmin(parsed.data)
  const { page, pageSize } = parsed.data
  return NextResponse.json({
    data: items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  })
}

// Server-side upload: the browser POSTs the EPUB as multipart/form-data; we
// store it as a PRIVATE Vercel Blob (only served to authenticated learners via
// the /file proxy) and persist the row. Subject to the platform request-body
// limit (~4.5 MB) — fine for text light novels.
export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: guard.status },
    )
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'File upload is not configured (BLOB_READ_WRITE_TOKEN missing).' },
      { status: 503 },
    )
  }

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'An EPUB file is required' }, { status: 400 })
  }
  if (file.size > MAX_EPUB_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `EPUB must be under ${MAX_EPUB_UPLOAD_MB} MB` },
      { status: 413 },
    )
  }

  const authorRaw = form.get('author')
  const parsed = bookUploadMetadataSchema.safeParse({
    title: form.get('title'),
    author: typeof authorRaw === 'string' && authorRaw.trim() ? authorRaw.trim() : null,
    isPublished: form.get('isPublished') === 'true',
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid book' }, { status: 400 })
  }

  const blob = await put(`books/${createId()}.epub`, file, {
    access: 'private',
    contentType: file.type || 'application/epub+zip',
  })

  const created = await createBook({ ...parsed.data, fileUrl: blob.url })
  return NextResponse.json(created, { status: 201 })
}
