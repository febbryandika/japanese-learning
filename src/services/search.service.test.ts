import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock only the db client (not the schema) so the service's real Drizzle column
// references and and/or/ilike/exists/sql helpers run, but no connection opens.
// Each select chain resolves to the next array queued via `queueSelect`; WHERE is
// ignored, so tests assert control flow (grouping/pagination), not SQL semantics.
const { dbMock, queueSelect, resetDb } = vi.hoisted(() => {
  let selectQueue: unknown[][] = []

  function thenable(getResult: () => unknown[]) {
    const builder: Record<string, unknown> = {}
    for (const m of [
      'from',
      'leftJoin',
      'innerJoin',
      'where',
      'orderBy',
      'limit',
      'offset',
      'groupBy',
    ]) {
      builder[m] = () => builder
    }
    builder.then = (
      resolve: (v: unknown[]) => unknown,
      reject: (e: unknown) => unknown,
    ) => Promise.resolve(getResult()).then(resolve, reject)
    return builder
  }

  const dbMock = {
    select: () => thenable(() => selectQueue.shift() ?? []),
  }

  return {
    dbMock,
    queueSelect: (rows: unknown[]) => selectQueue.push(rows),
    resetDb: () => {
      selectQueue = []
    },
  }
})

vi.mock('@/lib/db', () => ({ db: dbMock }))

import { search } from '@/services/search.service'
import { searchQuerySchema } from '@/lib/validations'

const USER = 'user-1'

const kanjiRows = [
  {
    id: 'k1',
    character: '数',
    onyomi: 'スウ',
    kunyomi: 'かず',
    meaning: 'number',
    strokeCount: 13,
    jlptLevel: 'N2',
    progressState: 'reviewing',
  },
]
const vocabRows = [
  {
    id: 'v1',
    word: '影響',
    reading: 'えいきょう',
    meaning: 'influence',
    partOfSpeech: 'noun',
    jlptLevel: 'N2',
    progressState: 'mastered',
  },
]
const grammarRows = [
  {
    id: 'g1',
    pattern: '〜ばかりか',
    meaning: 'not only',
    jlptLevel: 'N2',
    progressState: 'unseen',
  },
]
const videoRows = [
  {
    id: 'l1',
    title: 'Lesson 1',
    groupSlug: 'grammar',
    groupTitle: '文法',
    progressState: 'completed',
  },
]

beforeEach(() => {
  resetDb()
})

describe('search — grouped mode', () => {
  it('returns a group per type with match counts', async () => {
    // Query order: kanji rows/count, vocab rows/count, grammar rows/count, video rows/count.
    queueSelect(kanjiRows)
    queueSelect([{ total: 10 }])
    queueSelect(vocabRows)
    queueSelect([{ total: 20 }])
    queueSelect(grammarRows)
    queueSelect([{ total: 5 }])
    queueSelect(videoRows)
    queueSelect([{ total: 3 }])

    const result = await search({ q: '数', page: 1, pageSize: 24 }, USER)

    expect(result.type).toBeNull()
    expect(result.pagination).toBeNull()
    expect(result.groups.map((g) => g.type)).toEqual([
      'kanji',
      'vocabulary',
      'grammar',
      'video',
    ])
    expect(result.groups.map((g) => g.total)).toEqual([10, 20, 5, 3])
    expect(result.groups[0].items).toEqual(kanjiRows)
    expect(result.groups[3].items).toEqual(videoRows)
  })

  it('omits the video group when a JLPT level is set (videos have no level)', async () => {
    queueSelect(kanjiRows)
    queueSelect([{ total: 1 }])
    queueSelect(vocabRows)
    queueSelect([{ total: 1 }])
    queueSelect(grammarRows)
    queueSelect([{ total: 1 }])

    const result = await search(
      { q: '数', jlptLevel: 'N2', page: 1, pageSize: 24 },
      USER,
    )

    expect(result.groups.map((g) => g.type)).toEqual([
      'kanji',
      'vocabulary',
      'grammar',
    ])
  })
})

describe('search — single-type mode', () => {
  it('returns one group with pagination', async () => {
    queueSelect(kanjiRows)
    queueSelect([{ total: 50 }])

    const result = await search(
      { q: '数', type: 'kanji', page: 2, pageSize: 24 },
      USER,
    )

    expect(result.type).toBe('kanji')
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].type).toBe('kanji')
    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 24,
      total: 50,
      totalPages: 3,
    })
  })

  it('applies mastery-state and bookmarked filters without error', async () => {
    queueSelect(vocabRows)
    queueSelect([{ total: 2 }])

    const result = await search(
      {
        q: '影響',
        type: 'vocabulary',
        progressState: 'mastered',
        bookmarked: true,
        page: 1,
        pageSize: 24,
      },
      USER,
    )

    expect(result.type).toBe('vocabulary')
    expect(result.groups[0].items).toEqual(vocabRows)
  })
})

describe('searchQuerySchema', () => {
  it('parses bookmarked from the literal string, not coercion', () => {
    expect(searchQuerySchema.parse({ bookmarked: 'true' }).bookmarked).toBe(true)
    expect(searchQuerySchema.parse({ bookmarked: 'false' }).bookmarked).toBe(false)
    expect(searchQuerySchema.parse({}).bookmarked).toBe(false)
  })

  it('defaults page and pageSize', () => {
    const parsed = searchQuerySchema.parse({})
    expect(parsed.page).toBe(1)
    expect(parsed.pageSize).toBe(20)
  })

  it('rejects an unknown resource type and an over-large pageSize', () => {
    expect(searchQuerySchema.safeParse({ type: 'audio' }).success).toBe(false)
    expect(searchQuerySchema.safeParse({ pageSize: '500' }).success).toBe(false)
  })
})
