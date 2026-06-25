import { beforeEach, describe, expect, it } from 'vitest'

import { checkRateLimit, RATE_LIMIT_MAX, resetRateLimit } from '@/lib/rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimit()
  })

  it('allows up to the max within the window, then denies', () => {
    const now = 1_000_000
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(checkRateLimit('user-a', now)).toBe(true)
    }
    expect(checkRateLimit('user-a', now)).toBe(false)
  })

  it('allows again once the window has passed', () => {
    const start = 1_000_000
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('user-a', start)
    }
    expect(checkRateLimit('user-a', start)).toBe(false)
    // 61s later the earliest hits have aged out of the 60s window.
    expect(checkRateLimit('user-a', start + 61_000)).toBe(true)
  })

  it('tracks limits independently per key', () => {
    const now = 1_000_000
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('user-a', now)
    }
    expect(checkRateLimit('user-a', now)).toBe(false)
    expect(checkRateLimit('user-b', now)).toBe(true)
  })
})
