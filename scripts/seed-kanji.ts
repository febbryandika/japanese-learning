import { config } from 'dotenv'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Load .env.local first (takes precedence), then fall back to .env — mirrors
// drizzle.config.ts. Must run before the db client is imported (done
// dynamically in main), because the db module reads DATABASE_URL at import time.
config({ path: '.env.local' })
config({ path: '.env' })

// Seeds kanji_items from scripts/seed-data/kanji-seed.json (SPEC §14, 390 N2
// kanji), merging stroke counts from kanji-strokes.json when present (produced
// by build-kanji-strokes.ts; the seed itself ships strokeCount: null).
//
// JSON is read at runtime (not imported) so typecheck doesn't depend on the
// generated strokes file existing. Destructive + idempotent: clears kanji_items
// first so re-runs are clean. Mirrors scripts/seed-videos.ts.

type KanjiSeedRow = {
  character: string
  onyomi: string | null
  kunyomi: string | null
  meaning: string
  strokeCount: number | null
  jlptLevel: string
  notes: string | null
}

const DATA_DIR = join(process.cwd(), 'scripts/seed-data')

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(join(DATA_DIR, file), 'utf8')) as T
  } catch {
    return fallback
  }
}

async function main() {
  const { db } = await import('../src/lib/db')
  const { kanjiItems } = await import('../src/lib/db/schema')

  const seed = await readJson<KanjiSeedRow[]>('kanji-seed.json', [])
  if (seed.length === 0) {
    throw new Error('kanji-seed.json is empty or missing (scripts/seed-data/)')
  }
  const strokeMap = await readJson<Record<string, number>>(
    'kanji-strokes.json',
    {},
  )

  await db.delete(kanjiItems)

  // A few characters (肩 / 筋 / 額) appear in more than one chapter, but the
  // `character` column is unique — keep the first occurrence of each.
  const byCharacter = new Map<string, KanjiSeedRow>()
  for (const row of seed) {
    if (!byCharacter.has(row.character)) byCharacter.set(row.character, row)
  }

  const rows = [...byCharacter.values()].map((k) => ({
    character: k.character,
    onyomi: k.onyomi,
    kunyomi: k.kunyomi,
    meaning: k.meaning,
    strokeCount: strokeMap[k.character] ?? k.strokeCount ?? null,
    jlptLevel: k.jlptLevel ?? 'N2',
    notes: k.notes,
  }))

  // Chunked insert keeps the bound-parameter count well under Postgres limits.
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.insert(kanjiItems).values(rows.slice(i, i + CHUNK))
  }

  const withStrokes = rows.filter((row) => row.strokeCount != null).length
  console.log(`Seeded ${rows.length} kanji (${withStrokes} with stroke counts).`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
