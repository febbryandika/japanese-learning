// In-memory sliding-window rate limiter. Per-process: on Vercel serverless each
// lambda instance keeps its own window, so the limit is approximate across
// instances — acceptable for the AI generation guard (SPEC §5.9: 10 req/min per
// user). No external store (Redis) is in the stack.

const WINDOW_MS = 60_000
const MAX_REQUESTS = 10

// key → timestamps (ms) of requests still inside the current window.
const windows = new Map<string, number[]>()

// Records a request against `key` and returns whether it is allowed. `now` is
// injectable so tests can advance time deterministically.
export function checkRateLimit(key: string, now: number = Date.now()): boolean {
  const recent = (windows.get(key) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  )

  if (recent.length >= MAX_REQUESTS) {
    windows.set(key, recent)
    return false
  }

  recent.push(now)
  windows.set(key, recent)
  return true
}

// Test helper — clears all windows so cases don't leak state into each other.
export function resetRateLimit(): void {
  windows.clear()
}

export const RATE_LIMIT_MAX = MAX_REQUESTS
export const RATE_LIMIT_WINDOW_MS = WINDOW_MS
