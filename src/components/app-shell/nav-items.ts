// Learner navigation, shared by the desktop sidebar and the mobile drawer. The
// admin entry is appended only for admins (resolved server-side in the layout).
export type NavItem = { href: string; label: string }

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/search', label: 'Search' },
  { href: '/videos', label: 'Videos' },
  { href: '/kanji', label: 'Kanji' },
  { href: '/vocabulary', label: 'Vocabulary' },
  { href: '/grammar', label: 'Grammar' },
  { href: '/mock-exams', label: 'Mock Exams' },
  { href: '/reader', label: 'Reader' },
  { href: '/bookmarks', label: 'Bookmarks' },
  { href: '/progress', label: 'Progress' },
]

export const ADMIN_NAV_ITEM: NavItem = { href: '/admin', label: 'Admin' }
