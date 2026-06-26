import { beforeEach, describe, expect, it, vi } from 'vitest'

// One chainable mock stands in for the Drizzle query builder; every chain ends
// in `.returning()`, whose mock decides success vs. a PG constraint error.
const { dbMock, returningMock } = vi.hoisted(() => {
  const returningMock = vi.fn()
  const chain = {
    values: vi.fn(() => chain),
    set: vi.fn(() => chain),
    where: vi.fn(() => chain),
    returning: returningMock,
  }
  const dbMock = {
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
  }
  return { dbMock, returningMock }
})

vi.mock('@/lib/db', () => ({ db: dbMock }))

import {
  createLessonGroup,
  deleteLessonGroup,
} from '@/services/admin/lesson-group.service'
import {
  ForeignKeyError,
  UniqueConstraintError,
} from '@/services/admin/errors'

const validInput = {
  slug: 'grammar',
  title: '文法',
  sortOrder: 0,
  isPublished: false,
}

describe('createLessonGroup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the inserted row', async () => {
    const row = { id: 'g1', ...validInput }
    returningMock.mockResolvedValue([row])
    await expect(createLessonGroup(validInput)).resolves.toEqual(row)
  })

  it('maps a unique violation (23505) to UniqueConstraintError', async () => {
    // Drizzle wraps the driver error; the SQLSTATE code lives on `.cause`.
    returningMock.mockRejectedValue(
      Object.assign(new Error('Failed query'), {
        cause: Object.assign(new Error('duplicate key'), { code: '23505' }),
      }),
    )
    await expect(createLessonGroup(validInput)).rejects.toBeInstanceOf(
      UniqueConstraintError,
    )
  })

  it('rethrows non-constraint errors untouched', async () => {
    const boom = new Error('connection lost')
    returningMock.mockRejectedValue(boom)
    await expect(createLessonGroup(validInput)).rejects.toBe(boom)
  })
})

describe('deleteLessonGroup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when no row was deleted', async () => {
    returningMock.mockResolvedValue([])
    await expect(deleteLessonGroup('missing')).resolves.toBeNull()
  })

  it('maps a foreign-key violation (23503) to ForeignKeyError', async () => {
    returningMock.mockRejectedValue(
      Object.assign(new Error('Failed query'), {
        cause: Object.assign(new Error('still referenced'), { code: '23503' }),
      }),
    )
    await expect(deleteLessonGroup('g1')).rejects.toBeInstanceOf(ForeignKeyError)
  })
})
