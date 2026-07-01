import { and, asc, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm'

import { db } from '@/lib/db'
import { epubBooks } from '@/lib/db/schema'
import type {
  AdminListQuery,
  CreateBookInput,
  UpdateBookInput,
} from '@/lib/validations'

export type AdminBook = {
  id: string
  title: string
  author: string | null
  fileUrl: string
  coverUrl: string | null
  isPublished: boolean
}

const columns = {
  id: epubBooks.id,
  title: epubBooks.title,
  author: epubBooks.author,
  fileUrl: epubBooks.fileUrl,
  coverUrl: epubBooks.coverUrl,
  isPublished: epubBooks.isPublished,
}

export async function listBooksAdmin({
  q,
  page,
  pageSize,
}: AdminListQuery): Promise<{ items: AdminBook[]; total: number }> {
  const filters: SQL[] = []
  if (q) {
    const term = `%${q}%`
    const match = or(ilike(epubBooks.title, term), ilike(epubBooks.author, term))
    if (match) filters.push(match)
  }
  const where = filters.length ? and(...filters) : undefined

  const [items, totalResult] = await Promise.all([
    db
      .select(columns)
      .from(epubBooks)
      .where(where)
      .orderBy(desc(epubBooks.createdAt), asc(epubBooks.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(epubBooks).where(where),
  ])

  return { items, total: totalResult[0]?.total ?? 0 }
}

export async function createBook(input: CreateBookInput): Promise<AdminBook> {
  const [row] = await db.insert(epubBooks).values(input).returning(columns)
  return row
}

export async function updateBook(
  id: string,
  input: UpdateBookInput,
): Promise<AdminBook | null> {
  if (Object.keys(input).length === 0) {
    const [row] = await db
      .select(columns)
      .from(epubBooks)
      .where(eq(epubBooks.id, id))
      .limit(1)
    return row ?? null
  }

  const [row] = await db
    .update(epubBooks)
    .set(input)
    .where(eq(epubBooks.id, id))
    .returning(columns)
  return row ?? null
}

// Returns the deleted row's fileUrl so the route can best-effort remove the blob.
// reader_progress rows cascade with the book (schema FK onDelete cascade).
export async function deleteBook(
  id: string,
): Promise<{ id: string; fileUrl: string } | null> {
  const [row] = await db
    .delete(epubBooks)
    .where(eq(epubBooks.id, id))
    .returning({ id: epubBooks.id, fileUrl: epubBooks.fileUrl })
  return row ?? null
}
