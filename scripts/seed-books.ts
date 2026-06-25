import { config } from 'dotenv'

// Load .env.local first (takes precedence), then fall back to .env — mirrors
// drizzle.config.ts. Must run before the db client is imported (done dynamically
// in main), because the db module reads DATABASE_URL at import time.
config({ path: '.env.local' })
config({ path: '.env' })

// Dev seed for the epub reader. SPEC §14 ships no book data and admin upload is
// out of scope for Phase 4b, so this registers the bundled public-domain sample
// (芥川龍之介「蜘蛛の糸」, built by scripts/build-sample-epub.mjs and served from
// /public). `fileUrl` is a same-origin /public path so epubjs loads it without
// CORS.
//
// Destructive + idempotent: clears reader_progress → epub_books (FK order) so
// re-runs are clean.

const BOOKS = [
  {
    title: '蜘蛛の糸',
    author: '芥川龍之介',
    fileUrl: '/books/kumo-no-ito.epub',
    coverUrl: null,
    isPublished: true,
  },
]

async function main() {
  const { db } = await import('../src/lib/db')
  const { epubBooks, readerProgress } = await import('../src/lib/db/schema')

  await db.delete(readerProgress)
  await db.delete(epubBooks)

  await db.insert(epubBooks).values(BOOKS)

  console.log(`Seeded ${BOOKS.length} book(s).`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
