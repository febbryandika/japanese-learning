import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock only the db client (not the schema) so the service's real Drizzle column
// references and eq/and/desc helpers run, but no connection is opened. Each
// select chain resolves to the next array queued via `queueSelect`; the upsert
// chain resolves to `conflictReturning`.
const { dbMock, queueSelect, setConflictReturning, resetDb } = vi.hoisted(() => {
  let selectQueue: unknown[][] = []
  let conflictReturning: unknown[] = []

  function thenable(getResult: () => unknown[]) {
    const builder: Record<string, unknown> = {}
    for (const m of ['from', 'leftJoin', 'innerJoin', 'where', 'orderBy', 'limit']) {
      builder[m] = () => builder
    }
    builder.then = (resolve: (v: unknown[]) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(getResult()).then(resolve, reject)
    return builder
  }

  const dbMock = {
    select: () => thenable(() => selectQueue.shift() ?? []),
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => ({
          returning: () => Promise.resolve(conflictReturning),
        }),
      }),
    }),
  }

  return {
    dbMock,
    queueSelect: (rows: unknown[]) => selectQueue.push(rows),
    setConflictReturning: (rows: unknown[]) => {
      conflictReturning = rows
    },
    resetDb: () => {
      selectQueue = []
      conflictReturning = []
    },
  }
})

vi.mock('@/lib/db', () => ({ db: dbMock }))

import {
  getBookDetail,
  getReaderProgress,
  listPublishedBooks,
  saveReaderProgress,
} from '@/services/reader.service'
import { updateReaderProgressSchema } from '@/lib/validations'

beforeEach(() => {
  resetDb()
})

describe('listPublishedBooks', () => {
  it('returns the joined rows (book + caller cfi) as-is', async () => {
    const rows = [
      { id: 'b1', title: 'A', author: null, coverUrl: null, cfi: 'epubcfi(/6/4)' },
      { id: 'b2', title: 'B', author: 'X', coverUrl: '/c.png', cfi: null },
    ]
    queueSelect(rows)
    await expect(listPublishedBooks('user-1')).resolves.toEqual(rows)
  })
})

describe('getBookDetail', () => {
  it('returns the book when found', async () => {
    const book = { id: 'b1', title: 'A', author: null, fileUrl: '/a.epub', coverUrl: null }
    queueSelect([book])
    await expect(getBookDetail('b1')).resolves.toEqual(book)
  })

  it('returns null when the book is missing or unpublished', async () => {
    queueSelect([])
    await expect(getBookDetail('missing')).resolves.toBeNull()
  })
})

describe('getReaderProgress', () => {
  it('returns the saved cfi when the book exists', async () => {
    queueSelect([{ id: 'b1' }]) // bookExists
    queueSelect([{ cfi: 'epubcfi(/6/4)' }]) // progress row
    await expect(getReaderProgress('user-1', 'b1')).resolves.toEqual({
      cfi: 'epubcfi(/6/4)',
    })
  })

  it('returns { cfi: null } when the book exists but is unread', async () => {
    queueSelect([{ id: 'b1' }]) // bookExists
    queueSelect([]) // no progress row
    await expect(getReaderProgress('user-1', 'b1')).resolves.toEqual({ cfi: null })
  })

  it('returns null when the book does not exist', async () => {
    queueSelect([]) // bookExists → false
    await expect(getReaderProgress('user-1', 'missing')).resolves.toBeNull()
  })
})

describe('saveReaderProgress', () => {
  it('upserts and returns the saved row when the book exists', async () => {
    queueSelect([{ id: 'b1' }]) // bookExists
    const saved = { cfi: 'epubcfi(/6/8)', updatedAt: new Date(0) }
    setConflictReturning([saved])
    await expect(
      saveReaderProgress('user-1', 'b1', 'epubcfi(/6/8)'),
    ).resolves.toEqual(saved)
  })

  it('returns null without writing when the book does not exist', async () => {
    queueSelect([]) // bookExists → false
    await expect(
      saveReaderProgress('user-1', 'missing', 'epubcfi(/6/8)'),
    ).resolves.toBeNull()
  })
})

describe('updateReaderProgressSchema', () => {
  it('accepts a non-empty cfi', () => {
    expect(updateReaderProgressSchema.safeParse({ cfi: 'epubcfi(/6/4)' }).success).toBe(
      true,
    )
  })

  it('rejects an empty cfi', () => {
    expect(updateReaderProgressSchema.safeParse({ cfi: '' }).success).toBe(false)
  })

  it('rejects a missing cfi', () => {
    expect(updateReaderProgressSchema.safeParse({}).success).toBe(false)
  })
})
