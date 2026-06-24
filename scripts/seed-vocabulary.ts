import { config } from 'dotenv'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Load .env.local first (takes precedence), then fall back to .env — mirrors
// drizzle.config.ts. Must run before the db client is imported (done
// dynamically in main), because the db module reads DATABASE_URL at import time.
config({ path: '.env.local' })
config({ path: '.env' })

// Seeds vocabulary_items from scripts/seed-data/vocabulary-seed.json (SPEC §14,
// 3,434 N2 words across 10 parts of speech). Destructive + idempotent: clears
// vocabulary_items first so re-runs are clean.

type VocabularySeedRow = {
  word: string
  reading: string
  meaning: string
  partOfSpeech: string | null
  jlptLevel: string
  exampleSentenceOriginal: string | null
  exampleSentenceTranslation: string | null
}

const DATA_DIR = join(process.cwd(), 'scripts', 'seed-data')

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(join(DATA_DIR, file), 'utf8')) as T
  } catch {
    return fallback
  }
}

async function main() {
  const { db } = await import('../src/lib/db')
  const { vocabularyItems } = await import('../src/lib/db/schema')

  const seed = await readJson<VocabularySeedRow[]>('vocabulary-seed.json', [])
  if (seed.length === 0) {
    throw new Error('vocabulary-seed.json is empty or missing (scripts/seed-data/)')
  }

  const rows = seed.map((v) => ({
    word: v.word,
    reading: v.reading,
    meaning: v.meaning,
    partOfSpeech: v.partOfSpeech,
    jlptLevel: v.jlptLevel ?? 'N2',
    exampleSentenceOriginal: v.exampleSentenceOriginal,
    exampleSentenceTranslation: v.exampleSentenceTranslation,
  }))

  await db.delete(vocabularyItems)

  // Chunked insert keeps the bound-parameter count well under Postgres limits.
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.insert(vocabularyItems).values(rows.slice(i, i + CHUNK))
  }

  console.log(`Seeded ${rows.length} vocabulary items.`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
