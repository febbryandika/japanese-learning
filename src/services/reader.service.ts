import { and, desc, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { epubBooks, readerProgress } from '@/lib/db/schema'

// Library card: a published book plus the caller's saved CFI (null if unread),
// so the library can label the action "Continue reading" vs "Start reading".
export type BookListItem = {
  id: string
  title: string
  author: string | null
  coverUrl: string | null
  cfi: string | null
}

// Everything the reader needs to render a book: metadata, the file to load, and
// the caller's saved reading position (cfi) so it can restore on open.
export type BookDetail = {
  id: string
  title: string
  author: string | null
  fileUrl: string
  coverUrl: string | null
  cfi: string | null
}

// All published books, newest first, each enriched with the caller's reading
// position via a left join on reader_progress (scoped to `userId`).
export async function listPublishedBooks(
  userId: string,
): Promise<BookListItem[]> {
  return db
    .select({
      id: epubBooks.id,
      title: epubBooks.title,
      author: epubBooks.author,
      coverUrl: epubBooks.coverUrl,
      cfi: readerProgress.cfi,
    })
    .from(epubBooks)
    .leftJoin(
      readerProgress,
      and(
        eq(readerProgress.bookId, epubBooks.id),
        eq(readerProgress.userId, userId),
      ),
    )
    .where(eq(epubBooks.isPublished, true))
    .orderBy(desc(epubBooks.createdAt))
}

// A single published book's metadata + file URL + the caller's saved reading
// position (cfi, null if unread). Returns null when the book doesn't exist or
// isn't published (→ 404). Scoped to `userId`.
export async function getBookDetail(
  userId: string,
  bookId: string,
): Promise<BookDetail | null> {
  const [row] = await db
    .select({
      id: epubBooks.id,
      title: epubBooks.title,
      author: epubBooks.author,
      fileUrl: epubBooks.fileUrl,
      coverUrl: epubBooks.coverUrl,
      cfi: readerProgress.cfi,
    })
    .from(epubBooks)
    .leftJoin(
      readerProgress,
      and(
        eq(readerProgress.bookId, epubBooks.id),
        eq(readerProgress.userId, userId),
      ),
    )
    .where(and(eq(epubBooks.id, bookId), eq(epubBooks.isPublished, true)))
    .limit(1)

  return row ?? null
}

// Upsert the caller's reading position (keyed on `uq_reader_progress`). Returns
// null when the book doesn't exist (→ 404; bookId has a FK but we 404 cleanly
// rather than surface a constraint error). All writes are scoped to `userId`.
export async function saveReaderProgress(
  userId: string,
  bookId: string,
  cfi: string,
): Promise<{ cfi: string | null; updatedAt: Date } | null> {
  if (!(await bookExists(bookId))) {
    return null
  }

  const now = new Date()
  const [row] = await db
    .insert(readerProgress)
    .values({ userId, bookId, cfi, updatedAt: now })
    .onConflictDoUpdate({
      target: [readerProgress.userId, readerProgress.bookId],
      set: { cfi, updatedAt: now },
    })
    .returning({ cfi: readerProgress.cfi, updatedAt: readerProgress.updatedAt })

  return row
}

async function bookExists(bookId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: epubBooks.id })
    .from(epubBooks)
    .where(and(eq(epubBooks.id, bookId), eq(epubBooks.isPublished, true)))
    .limit(1)
  return Boolean(row)
}
