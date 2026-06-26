import { eq, inArray, like, or, sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { kanjiItems, vocabularyItems } from '@/lib/db/schema'

export type VocabularyLookupResult = {
  id: string
  word: string
  reading: string
  meaning: string
  partOfSpeech: string | null
}

export type KanjiLookupResult = {
  id: string
  character: string
  onyomi: string | null
  kunyomi: string | null
  meaning: string
}

export type LookupResponse = {
  vocabulary: VocabularyLookupResult[]
  kanji: KanjiLookupResult[]
}

const RESULT_LIMIT = 3

// Pull the distinct Han (kanji) characters out of a selection, in order, capped
// so a long accidental selection can't explode the IN list. Pure + exported for
// unit testing.
export function extractKanji(q: string): string[] {
  const matches = q.match(/\p{Script=Han}/gu) ?? []
  return [...new Set(matches)].slice(0, 10)
}

// Reader word lookup (SPEC §7 GET /api/lookup). Returns up to 3 vocabulary and 3
// kanji matches for a selected span of text.
export async function lookup(q: string): Promise<LookupResponse> {
  const kanjiChars = extractKanji(q)

  const [vocabulary, kanji] = await Promise.all([
    lookupVocabulary(q),
    kanjiChars.length ? lookupKanji(kanjiChars) : Promise.resolve([]),
  ])

  return { vocabulary, kanji }
}

function lookupVocabulary(q: string): Promise<VocabularyLookupResult[]> {
  const prefix = `${q}%`
  // Exact word/reading match plus a prefix match (e.g. a selected stem). Exact
  // hits use the btree indexes (idx_vocab_word / idx_vocab_reading); the prefix
  // is `q%` — never a leading wildcard — so we stay index-eligible and never
  // full-scan with `%q%`. Exact matches rank ahead of prefix matches.
  return db
    .select({
      id: vocabularyItems.id,
      word: vocabularyItems.word,
      reading: vocabularyItems.reading,
      meaning: vocabularyItems.meaning,
      partOfSpeech: vocabularyItems.partOfSpeech,
    })
    .from(vocabularyItems)
    .where(
      or(
        eq(vocabularyItems.word, q),
        eq(vocabularyItems.reading, q),
        like(vocabularyItems.word, prefix),
        like(vocabularyItems.reading, prefix),
      ),
    )
    .orderBy(
      sql`CASE WHEN ${vocabularyItems.word} = ${q} OR ${vocabularyItems.reading} = ${q} THEN 0 ELSE 1 END`,
      vocabularyItems.word,
    )
    .limit(RESULT_LIMIT)
}

function lookupKanji(chars: string[]): Promise<KanjiLookupResult[]> {
  // `character` is unique + indexed (idx_kanji_character), so an equality IN over
  // the selection's kanji is an index lookup, not a scan.
  return db
    .select({
      id: kanjiItems.id,
      character: kanjiItems.character,
      onyomi: kanjiItems.onyomi,
      kunyomi: kanjiItems.kunyomi,
      meaning: kanjiItems.meaning,
    })
    .from(kanjiItems)
    .where(inArray(kanjiItems.character, chars))
    .limit(RESULT_LIMIT)
}
