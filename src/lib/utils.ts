import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formats a duration in seconds as "m:ss" (e.g. 754 → "12:34"). Returns null
// when the duration is unknown so callers can omit it.
export function formatDuration(seconds: number | null | undefined): string | null {
  if (seconds == null || seconds < 0) return null
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}:${remaining.toString().padStart(2, '0')}`
}
