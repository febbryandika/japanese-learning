// Learner navigation, shared by the desktop rail and the mobile drawer. The
// admin entry is appended only for admins (resolved server-side in the layout).
// `icon` keys map to lucide icons in AppSidebar; `glyph` renders a kanji
// character instead (the design marks the study sections with 漢 / 語 / 文).
export type NavItem = {
  href: string
  label: string
  icon?: 'dashboard' | 'search' | 'videos' | 'exams' | 'reader' | 'bookmarks' | 'progress' | 'admin'
  glyph?: string
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/search', label: 'Search', icon: 'search' },
  { href: '/videos', label: 'Videos', icon: 'videos' },
  { href: '/kanji', label: 'Kanji', glyph: '漢' },
  { href: '/vocabulary', label: 'Vocabulary', glyph: '語' },
  { href: '/grammar', label: 'Grammar', glyph: '文' },
  { href: '/mock-exams', label: 'Mock Exams', icon: 'exams' },
  { href: '/reader', label: 'Reader', icon: 'reader' },
  { href: '/bookmarks', label: 'Bookmarks', icon: 'bookmarks' },
  { href: '/progress', label: 'Progress', icon: 'progress' },
]

export const ADMIN_NAV_ITEM: NavItem = { href: '/admin', label: 'Admin', icon: 'admin' }
