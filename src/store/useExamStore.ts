import { create } from 'zustand'

// In-flight exam state only (SPEC §8). The server is authoritative for the saved
// answers and the timer anchor (startedAt); this store holds the live working
// copy that the attempt page hydrates from the server on mount.
type ExamStore = {
  attemptId: string | null
  answers: Record<string, string> // questionId → userAnswer
  timeLeft: number // seconds remaining
  setAnswer: (questionId: string, answer: string) => void
  tick: () => void
  hydrate: (state: {
    attemptId: string
    answers: Record<string, string>
    timeLeft: number
  }) => void
  reset: () => void
}

export const useExamStore = create<ExamStore>((set) => ({
  attemptId: null,
  answers: {},
  timeLeft: 0,
  setAnswer: (questionId, answer) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: answer } })),
  tick: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),
  hydrate: ({ attemptId, answers, timeLeft }) =>
    set({ attemptId, answers, timeLeft }),
  reset: () => set({ attemptId: null, answers: {}, timeLeft: 0 }),
}))
