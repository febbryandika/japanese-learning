import { count } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  epubBooks,
  grammarItems,
  kanjiItems,
  lessonGroups,
  mockExams,
  videoLessons,
  vocabularyItems,
} from '@/lib/db/schema'

// One count per admin-managed resource, keyed to match ADMIN_SECTIONS so the
// dashboard can read `counts[section.key]` directly.
export type AdminCounts = {
  lessonGroups: number
  videos: number
  kanji: number
  vocabulary: number
  grammar: number
  mockExams: number
  books: number
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const [groups, videos, kanji, vocabulary, grammar, exams, books] =
    await Promise.all([
      db.select({ value: count() }).from(lessonGroups),
      db.select({ value: count() }).from(videoLessons),
      db.select({ value: count() }).from(kanjiItems),
      db.select({ value: count() }).from(vocabularyItems),
      db.select({ value: count() }).from(grammarItems),
      db.select({ value: count() }).from(mockExams),
      db.select({ value: count() }).from(epubBooks),
    ])

  return {
    lessonGroups: groups[0].value,
    videos: videos[0].value,
    kanji: kanji[0].value,
    vocabulary: vocabulary[0].value,
    grammar: grammar[0].value,
    mockExams: exams[0].value,
    books: books[0].value,
  }
}
