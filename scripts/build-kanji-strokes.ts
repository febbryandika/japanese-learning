import { config } from 'dotenv'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// Load env to mirror the other scripts (not strictly needed — this calls a
// public API, not the DB).
config({ path: '.env.local' })
config({ path: '.env' })

// One-off dev helper. The kanji seed ships with `strokeCount: null` for every
// entry (SPEC §14). This backfills stroke counts from kanjiapi.dev (built on
// KANJIDIC2, EDRDG CC BY-SA) into scripts/seed-data/kanji-strokes.json, which
// the kanji seed then merges in. Re-runnable; run whenever the seed changes:
//   pnpm exec tsx scripts/build-kanji-strokes.ts

const DATA_DIR = join(process.cwd(), 'scripts/seed-data')
const OUT = join(DATA_DIR, 'kanji-strokes.json')
const CONCURRENCY = 8

async function fetchStrokeCount(character: string): Promise<number | null> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(
        `https://kanjiapi.dev/v1/kanji/${encodeURIComponent(character)}`,
      )
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = (await res.json()) as { stroke_count?: number }
      return typeof data.stroke_count === 'number' ? data.stroke_count : null
    } catch (error) {
      if (attempt === 2) {
        console.warn(`Failed to fetch "${character}":`, error)
        return null
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
    }
  }
  return null
}

async function main() {
  const seed = JSON.parse(
    await readFile(join(DATA_DIR, 'kanji-seed.json'), 'utf8'),
  ) as { character: string }[]
  const characters = [...new Set(seed.map((k) => k.character))]
  const strokes: Record<string, number> = {}

  for (let i = 0; i < characters.length; i += CONCURRENCY) {
    const batch = characters.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map(async (character) => {
        return [character, await fetchStrokeCount(character)] as const
      }),
    )
    for (const [character, strokeCount] of results) {
      if (strokeCount != null) strokes[character] = strokeCount
    }
    console.log(
      `Fetched ${Math.min(i + CONCURRENCY, characters.length)}/${characters.length}`,
    )
  }

  await writeFile(OUT, `${JSON.stringify(strokes, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${Object.keys(strokes).length} stroke counts to ${OUT}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
