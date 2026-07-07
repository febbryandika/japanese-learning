import type { AdminCounts } from '@/services/admin/overview.service'

// The seven admin-managed resource types. `key` indexes AdminCounts; `href` is
// the management route. Single source of truth for the admin sidebar and the
// dashboard cards so the two never drift. Section pages land across PRs 5b–5e.
export type AdminSection = {
  key: keyof AdminCounts
  href: string
  label: string
}

export const ADMIN_SECTIONS: AdminSection[] = [
  { key: 'lessonGroups', href: '/admin/lesson-groups', label: 'Lesson Groups' },
  { key: 'videos', href: '/admin/videos', label: 'Videos' },
  { key: 'kanji', href: '/admin/kanji', label: 'Kanji' },
  { key: 'vocabulary', href: '/admin/vocabulary', label: 'Vocabulary' },
  { key: 'grammar', href: '/admin/grammar', label: 'Grammar' },
  { key: 'mockExams', href: '/admin/mock-exams', label: 'Mock Exams' },
  { key: 'books', href: '/admin/books', label: 'Books' },
  { key: 'users', href: '/admin/users', label: 'Users' },
]
