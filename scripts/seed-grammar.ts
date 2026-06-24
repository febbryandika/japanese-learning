import { config } from 'dotenv'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Load .env.local first (takes precedence), then fall back to .env — mirrors
// drizzle.config.ts. Must run before the db client is imported (done
// dynamically in main), because the db module reads DATABASE_URL at import time.
config({ path: '.env.local' })
config({ path: '.env' })

// Seeds grammar_items + grammar_examples from scripts/seed-data/ (SPEC §14:
// 135 patterns, 639 example sentences). Examples join to grammar by the
// `grammarPattern` string — so we insert items first, build a pattern → id map,
// then resolve examples against it. Destructive + idempotent: clears both
// tables first (examples before items to respect the FK) so re-runs are clean.

type GrammarSeedRow = {
  pattern: string
  meaning: string
  formation: string | null
  usageNotes: string | null
  commonMistakes: string | null
  jlptLevel: string
}

type GrammarExampleSeedRow = {
  grammarPattern: string
  sentenceJa: string
  sentenceEn: string
  orderIndex: number
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
  const { grammarItems, grammarExamples } = await import('../src/lib/db/schema')

  const grammarSeed = await readJson<GrammarSeedRow[]>('grammar-seed.json', [])
  if (grammarSeed.length === 0) {
    throw new Error('grammar-seed.json is empty or missing (scripts/seed-data/)')
  }
  const examplesSeed = await readJson<GrammarExampleSeedRow[]>(
    'grammar-examples-seed.json',
    [],
  )

  // Clear examples before items: examples FK-reference items.
  await db.delete(grammarExamples)
  await db.delete(grammarItems)

  const itemRows = grammarSeed.map((g) => ({
    pattern: g.pattern,
    meaning: g.meaning,
    formation: g.formation,
    usageNotes: g.usageNotes,
    commonMistakes: g.commonMistakes,
    jlptLevel: g.jlptLevel ?? 'N2',
  }))

  // Insert items and capture the generated ids to build the pattern → id map.
  const inserted = await db
    .insert(grammarItems)
    .values(itemRows)
    .returning({ id: grammarItems.id, pattern: grammarItems.pattern })

  const patternToId = new Map(inserted.map((row) => [row.pattern, row.id]))

  const exampleRows = examplesSeed.flatMap((e) => {
    const grammarId = patternToId.get(e.grammarPattern)
    // Skip any example whose pattern wasn't inserted (defensive against drift).
    if (!grammarId) return []
    return [
      {
        grammarId,
        sentenceJa: e.sentenceJa,
        sentenceEn: e.sentenceEn,
        orderIndex: e.orderIndex,
      },
    ]
  })

  // Chunked insert keeps the bound-parameter count well under Postgres limits.
  const CHUNK = 500
  for (let i = 0; i < exampleRows.length; i += CHUNK) {
    await db.insert(grammarExamples).values(exampleRows.slice(i, i + CHUNK))
  }

  console.log(
    `Seeded ${inserted.length} grammar items / ${exampleRows.length} examples.`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
