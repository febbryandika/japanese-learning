import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// Stroke counts come from kanjiapi.dev (KANJIDIC2 / EDRDG, CC BY-SA) — the kanji
// seed itself ships `strokeCount: null`. This module is shared by the standalone
// generator (build-kanji-strokes.ts) and the seed (seed-kanji.ts), which
// backfills automatically when the cache file is missing.

export const DATA_DIR = join(process.cwd(), 'scripts/seed-data')
export const STROKES_FILE = join(DATA_DIR, 'kanji-strokes.json')
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

// Fetch stroke counts for the given characters. Characters that 404 or keep
// failing are simply omitted from the map.
export async function buildStrokeMap(
  characters: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<Record<string, number>> {
  const unique = [...new Set(characters)]
  const strokes: Record<string, number> = {}

  for (let i = 0; i < unique.length; i += CONCURRENCY) {
    const batch = unique.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map(async (character) => {
        return [character, await fetchStrokeCount(character)] as const
      }),
    )
    for (const [character, strokeCount] of results) {
      if (strokeCount != null) strokes[character] = strokeCount
    }
    onProgress?.(Math.min(i + CONCURRENCY, unique.length), unique.length)
  }

  return strokes
}

export async function readStrokeCache(): Promise<Record<string, number>> {
  try {
    return JSON.parse(await readFile(STROKES_FILE, 'utf8')) as Record<
      string,
      number
    >
  } catch {
    return {}
  }
}

export async function writeStrokeCache(
  strokes: Record<string, number>,
): Promise<void> {
  await writeFile(STROKES_FILE, `${JSON.stringify(strokes, null, 2)}\n`, 'utf8')
}
