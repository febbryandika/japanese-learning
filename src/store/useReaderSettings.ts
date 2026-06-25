import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const READER_THEMES = ['white', 'sepia', 'dark'] as const
export type ReaderTheme = (typeof READER_THEMES)[number]

export const MIN_FONT_SIZE = 80
export const MAX_FONT_SIZE = 160
const FONT_STEP = 10

type ReaderSettings = {
  // Percentage applied to epubjs `themes.fontSize` (100 = book default).
  fontSize: number
  theme: ReaderTheme
  increaseFont: () => void
  decreaseFont: () => void
  setTheme: (theme: ReaderTheme) => void
}

// Reader appearance, persisted to localStorage so it survives reloads. This is
// the only persisted store in the app; settings are read client-side after the
// reader mounts, so there is no SSR hydration mismatch.
export const useReaderSettings = create<ReaderSettings>()(
  persist(
    (set) => ({
      fontSize: 100,
      theme: 'white',
      increaseFont: () =>
        set((s) => ({ fontSize: Math.min(MAX_FONT_SIZE, s.fontSize + FONT_STEP) })),
      decreaseFont: () =>
        set((s) => ({ fontSize: Math.max(MIN_FONT_SIZE, s.fontSize - FONT_STEP) })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'reader-settings' },
  ),
)
