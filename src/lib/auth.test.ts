import { beforeEach, describe, expect, it, vi } from 'vitest'

// Hoisted so the vi.mock factories below can reference them (vi.mock is lifted
// above imports). `@/lib/db` is mocked so getUserRole's query is controllable
// without a real connection; next/headers + next/navigation are mocked so
// importing auth.ts (and calling redirect) is side-effect-free.
const { limitMock, redirectMock } = vi.hoisted(() => ({
  limitMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    // Real next/navigation redirect throws to halt rendering; mirror that so
    // callers can assert the thrown target.
    throw new Error(`NEXT_REDIRECT:${path}`)
  }),
}))

vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('next/navigation', () => ({ redirect: redirectMock }))
vi.mock('@/lib/db', () => ({
  db: {
    select: () => ({
      from: () => ({ where: () => ({ limit: limitMock }) }),
    }),
  },
}))

import { auth, getUserRole, requireAdmin, requireAdminPage } from '@/lib/auth'

const getSessionSpy = vi.spyOn(auth.api, 'getSession')

type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>

// A minimal stand-in for Better Auth's session shape — only `user.id` is read.
function fakeSession(id = 'user-1'): SessionResult {
  return { user: { id, name: 'Test' } } as unknown as SessionResult
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getUserRole', () => {
  it('returns the role when a profile row exists', async () => {
    limitMock.mockResolvedValue([{ role: 'admin' }])
    expect(await getUserRole('user-1')).toBe('admin')
  })

  it('returns null when the user has no profile row', async () => {
    limitMock.mockResolvedValue([])
    expect(await getUserRole('user-1')).toBeNull()
  })
})

describe('requireAdmin', () => {
  it('returns 401 when there is no session', async () => {
    getSessionSpy.mockResolvedValue(null)
    expect(await requireAdmin()).toEqual({ ok: false, status: 401 })
    expect(limitMock).not.toHaveBeenCalled()
  })

  it('returns 403 for a logged-in learner', async () => {
    getSessionSpy.mockResolvedValue(fakeSession())
    limitMock.mockResolvedValue([{ role: 'learner' }])
    expect(await requireAdmin()).toEqual({ ok: false, status: 403 })
  })

  it('returns 403 when the user has no profile row', async () => {
    getSessionSpy.mockResolvedValue(fakeSession())
    limitMock.mockResolvedValue([])
    expect(await requireAdmin()).toEqual({ ok: false, status: 403 })
  })

  it('returns ok with the session for an admin', async () => {
    const session = fakeSession()
    getSessionSpy.mockResolvedValue(session)
    limitMock.mockResolvedValue([{ role: 'admin' }])
    expect(await requireAdmin()).toEqual({ ok: true, session })
  })
})

describe('requireAdminPage', () => {
  it('redirects to /login when there is no session', async () => {
    getSessionSpy.mockResolvedValue(null)
    await expect(requireAdminPage()).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(redirectMock).toHaveBeenCalledWith('/login')
  })

  it('redirects to /dashboard for a non-admin', async () => {
    getSessionSpy.mockResolvedValue(fakeSession())
    limitMock.mockResolvedValue([{ role: 'learner' }])
    await expect(requireAdminPage()).rejects.toThrow('NEXT_REDIRECT:/dashboard')
    expect(redirectMock).toHaveBeenCalledWith('/dashboard')
  })

  it('returns the session for an admin', async () => {
    const session = fakeSession()
    getSessionSpy.mockResolvedValue(session)
    limitMock.mockResolvedValue([{ role: 'admin' }])
    expect(await requireAdminPage()).toEqual(session)
    expect(redirectMock).not.toHaveBeenCalled()
  })
})
