import { create } from 'zustand'

type UIStore = {
  sidebarOpen: boolean
  setSidebar: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  setSidebar: (open) => set({ sidebarOpen: open }),
}))
