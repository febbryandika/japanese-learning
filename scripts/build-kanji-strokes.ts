import { config } from 'dotenv'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

config({ path: '.env.local' })
config({ path: '.env' })

import {
  DATA_DIR,
  STROKES_FILE,
  buildStrokeMap,
  writeStrokeCache,
} from './lib/kanji-strokes'

// Optional one-off dev helper to (re)generate scripts/seed-data/kanji-strokes.json
// from kanjiapi.dev. `pnpm db:seed:kanji` also backfills automatically when the
// cache is missing, so running this by hand is only needed to refresh the data:
//   pnpm exec tsx scripts/build-kanji-strokes.ts

async function main() {
  const seed = JSON.parse(
    await readFile(join(DATA_DIR, 'kanji-seed.json'), 'utf8'),
  ) as { character: string }[]

  const strokes = await buildStrokeMap(
    seed.map((k) => k.character),
    (done, total) => console.log(`Fetched ${done}/${total}`),
  )

  await writeStrokeCache(strokes)
  console.log(`Wrote ${Object.keys(strokes).length} stroke counts to ${STROKES_FILE}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
