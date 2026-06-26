import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock only the db client (not the schema) so the service's real Drizzle column
// references and or/like/inArray/sql helpers run, but no connection is opened.
// Each select chain resolves to the next array queued via `queueSelect`.
const { dbMock, queueSelect, resetDb } = vi.hoisted(() => {
  let selectQueue: unknown[][] = []

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

import { extractKanji, lookup } from '@/services/lookup.service'
import { lookupQuerySchema } from '@/lib/validations'

beforeEach(() => {
  resetDb()
})

describe('extractKanji', () => {
  it('returns only Han characters from a mixed selection', () => {
    expect(extractKanji('影響を受ける')).toEqual(['影', '響', '受'])
  })

  it('de-duplicates repeated kanji', () => {
    expect(extractKanji('人人')).toEqual(['人'])
  })

  it('returns an empty array for kana/latin-only input', () => {
    expect(extractKanji('ですabc')).toEqual([])
  })
})

describe('lookup', () => {
  it('returns up to 3 vocabulary and 3 kanji matches', async () => {
    const vocabulary = [
      { id: 'v1', word: '影響', reading: 'えいきょう', meaning: 'influence', partOfSpeech: 'noun' },
    ]
    const kanji = [
      { id: 'k1', character: '影', onyomi: 'エイ', kunyomi: 'かげ', meaning: 'shadow' },
    ]
    queueSelect(vocabulary) // vocabulary query resolves first
    queueSelect(kanji) // kanji query resolves second
    await expect(lookup('影響')).resolves.toEqual({ vocabulary, kanji })
  })

  it('skips the kanji query when the selection has no kanji', async () => {
    const vocabulary = [
      { id: 'v1', word: 'です', reading: 'です', meaning: 'to be', partOfSpeech: null },
    ]
    queueSelect(vocabulary) // only the vocabulary query runs
    await expect(lookup('です')).resolves.toEqual({ vocabulary, kanji: [] })
  })

  it('returns empty arrays when nothing matches', async () => {
    queueSelect([]) // vocabulary
    queueSelect([]) // kanji ('猫' has a kanji, so both queries run)
    await expect(lookup('猫')).resolves.toEqual({ vocabulary: [], kanji: [] })
  })
})

describe('lookupQuerySchema', () => {
  it('accepts a non-empty query', () => {
    expect(lookupQuerySchema.safeParse({ q: '影響' }).success).toBe(true)
  })

  it('trims and rejects a whitespace-only query', () => {
    expect(lookupQuerySchema.safeParse({ q: '   ' }).success).toBe(false)
  })

  it('rejects a missing query', () => {
    expect(lookupQuerySchema.safeParse({}).success).toBe(false)
  })
})
