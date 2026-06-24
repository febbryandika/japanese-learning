'use client'

import { useQuery } from '@tanstack/react-query'

import type {
  DashboardProgressStat,
  DashboardWeakArea,
} from '@/lib/validations'
import type { ProgressSummary } from '@/hooks/use-progress'

type StudyType = 'kanji' | 'vocabulary' | 'grammar'

// Mirrors the server's DashboardData, but the two lists reuse the client
// ProgressSummary (timestamps are JSON strings here).
export type DashboardData = {
  progress: Record<StudyType, DashboardProgressStat>
  recentActivity: ProgressSummary[]
  continueLearning: ProgressSummary[]
  weakAreas: DashboardWeakArea[]
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetchJson<DashboardData>('/api/dashboard'),
  })
}
