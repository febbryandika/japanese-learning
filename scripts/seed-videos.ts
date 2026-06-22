import { config } from 'dotenv'

// Load .env.local first (takes precedence), then fall back to .env — mirrors
// drizzle.config.ts so the script connects to the same database. This must run
// before the db client is imported (done dynamically in main), because the db
// module reads DATABASE_URL at import time.
config({ path: '.env.local' })
config({ path: '.env' })

// Dev-only seed for video content. SPEC §14 ships no video data, so this seeds
// the 7 canonical groups plus a few sample lessons to make the "Watch a video"
// flow exercisable end to end.
//
// The embedUrl values are placeholders in the correct Google Drive /preview
// format — swap the <PLACEHOLDER_*> file IDs for real Drive IDs when available.
//
// Destructive + idempotent: clears existing video data first so re-runs are
// clean. studyProgress.targetId has no FK, so old progress rows are simply
// orphaned (acceptable for a dev seed).

const GROUPS = [
  { slug: 'bunpou', title: '文法', sortOrder: 0 },
  { slug: 'kanji', title: '漢字', sortOrder: 1 },
  { slug: 'goi', title: '語彙', sortOrder: 2 },
  { slug: 'dokkai', title: '読解', sortOrder: 3 },
  { slug: 'choukai', title: '聴解', sortOrder: 4 },
  { slug: 'mogi-shiken', title: '模擬試験', sortOrder: 5 },
  { slug: 'final-test', title: 'Final Test', sortOrder: 6 },
] as const

const LESSONS = [
  {
    groupSlug: 'bunpou',
    title: 'N2文法 入門',
    description: 'Introduction to N2 grammar patterns.',
    durationSeconds: 754,
    sortOrder: 0,
    fileId: 'PLACEHOLDER_BUNPOU_1',
  },
  {
    groupSlug: 'bunpou',
    title: '〜ばかりか の使い方',
    description: 'How to use the 〜ばかりか pattern.',
    durationSeconds: 612,
    sortOrder: 1,
    fileId: 'PLACEHOLDER_BUNPOU_2',
  },
  {
    groupSlug: 'kanji',
    title: 'N2漢字 第1章',
    description: 'Chapter 1 kanji readings and compounds.',
    durationSeconds: 905,
    sortOrder: 0,
    fileId: 'PLACEHOLDER_KANJI_1',
  },
] as const

function driveEmbed(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`
}

async function main() {
  const { db } = await import('../src/lib/db')
  const { lessonGroups, videoLessons } = await import('../src/lib/db/schema')

  await db.delete(videoLessons)
  await db.delete(lessonGroups)

  const insertedGroups = await db
    .insert(lessonGroups)
    .values(GROUPS.map((group) => ({ ...group, isPublished: true })))
    .returning({ id: lessonGroups.id, slug: lessonGroups.slug })

  const groupIdBySlug = new Map(insertedGroups.map((g) => [g.slug, g.id]))

  const lessonRows = LESSONS.map((lesson) => {
    const lessonGroupId = groupIdBySlug.get(lesson.groupSlug)
    if (!lessonGroupId) {
      throw new Error(`No seeded group for slug "${lesson.groupSlug}"`)
    }
    return {
      lessonGroupId,
      title: lesson.title,
      description: lesson.description,
      durationSeconds: lesson.durationSeconds,
      sortOrder: lesson.sortOrder,
      embedUrl: driveEmbed(lesson.fileId),
      isPublished: true,
    }
  })

  await db.insert(videoLessons).values(lessonRows)

  console.log(
    `Seeded ${insertedGroups.length} lesson groups and ${LESSONS.length} video lessons.`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
