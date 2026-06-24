import { config } from 'dotenv'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Load .env.local first (takes precedence), then fall back to .env — mirrors
// drizzle.config.ts. Must run before the db client is imported (done
// dynamically in main), because the db module reads DATABASE_URL at import time.
config({ path: '.env.local' })
config({ path: '.env' })

import {
  DATA_DIR,
  buildStrokeMap,
  readStrokeCache,
  writeStrokeCache,
} from './lib/kanji-strokes'

// Seeds kanji_items from scripts/seed-data/kanji-seed.json (SPEC §14, 390 N2
// kanji entries → 387 unique characters), merging stroke counts from
// kanji-strokes.json. If that cache is missing, it is backfilled from
// kanjiapi.dev automatically (best-effort — seeding still succeeds without it).
//
// Destructive + idempotent: clears kanji_items first so re-runs are clean.

type Compound = { word: string; reading: string; meaning: string }

type KanjiSeedRow = {
  character: string
  onyomi: string | null
  kunyomi: string | null
  meaning: string
  strokeCount: number | null
  jlptLevel: string
  notes: string | null
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(join(DATA_DIR, file), 'utf8')) as T
  } catch {
    return fallback
  }
}

function parseCompounds(notes: string | null): Compound[] {
  if (!notes) return []
  try {
    const value = JSON.parse(notes)
    return Array.isArray(value) ? (value as Compound[]) : []
  } catch {
    return []
  }
}

// Combine the compound lists of every occurrence of a character, de-duplicated
// by word, so a kanji that appears in more than one chapter keeps all of its
// vocabulary instead of losing the later occurrence's compounds.
function mergeCompounds(notesList: (string | null)[]): Compound[] {
  const out: Compound[] = []
  const seen = new Set<string>()
  for (const notes of notesList) {
    for (const compound of parseCompounds(notes)) {
      if (!seen.has(compound.word)) {
        seen.add(compound.word)
        out.push(compound)
      }
    }
  }
  return out
}

async function resolveStrokeMap(
  characters: string[],
): Promise<Record<string, number>> {
  const cached = await readStrokeCache()
  if (Object.keys(cached).length > 0) return cached

  console.log('No cached stroke counts — backfilling from kanjiapi.dev...')
  try {
    const fresh = await buildStrokeMap(characters, (done, total) => {
      if (done % 40 === 0 || done === total) console.log(`  ${done}/${total}`)
    })
    if (Object.keys(fresh).length > 0) await writeStrokeCache(fresh)
    return fresh
  } catch (error) {
    console.warn('Stroke backfill failed; seeding without stroke counts.', error)
    return {}
  }
}

async function main() {
  const { db } = await import('../src/lib/db')
  const { kanjiItems } = await import('../src/lib/db/schema')

  const seed = await readJson<KanjiSeedRow[]>('kanji-seed.json', [])
  if (seed.length === 0) {
    throw new Error('kanji-seed.json is empty or missing (scripts/seed-data/)')
  }

  const strokeMap = await resolveStrokeMap(seed.map((k) => k.character))

  // `character` is unique. Keep the first occurrence's fields but merge the
  // compound lists across all occurrences (肩 / 筋 / 額 each appear twice).
  const order: string[] = []
  const first = new Map<string, KanjiSeedRow>()
  const occurrences = new Map<string, KanjiSeedRow[]>()
  for (const row of seed) {
    if (!first.has(row.character)) {
      first.set(row.character, row)
      order.push(row.character)
    }
    const list = occurrences.get(row.character) ?? []
    list.push(row)
    occurrences.set(row.character, list)
  }

  const rows = order.map((character) => {
    const base = first.get(character)!
    const occ = occurrences.get(character)!
    // Single occurrence keeps its notes verbatim; duplicates get merged.
    const notes =
      occ.length === 1
        ? base.notes
        : JSON.stringify(mergeCompounds(occ.map((r) => r.notes)))
    return {
      character: base.character,
      onyomi: base.onyomi,
      kunyomi: base.kunyomi,
      meaning: base.meaning,
      strokeCount: strokeMap[character] ?? base.strokeCount ?? null,
      jlptLevel: base.jlptLevel ?? 'N2',
      notes,
    }
  })

  await db.delete(kanjiItems)

  // Chunked insert keeps the bound-parameter count well under Postgres limits.
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.insert(kanjiItems).values(rows.slice(i, i + CHUNK))
  }

  const withStrokes = rows.filter((row) => row.strokeCount != null).length
  const merged = order.filter((c) => occurrences.get(c)!.length > 1)
  console.log(
    `Seeded ${rows.length} kanji (${withStrokes} with stroke counts; ` +
      `merged compounds for ${merged.join(' / ') || 'none'}).`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
