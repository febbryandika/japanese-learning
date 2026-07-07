import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  dbMock,
  selectLimitMock,
  updateSetMock,
  deleteWhereMock,
  transactionMock,
  authContextMock,
  passwordHashMock,
  createUserMock,
  linkAccountMock,
  deleteUserMock,
  updatePasswordMock,
} = vi.hoisted(() => {
  const selectLimitMock = vi.fn()
  const updateSetMock = vi.fn()
  const deleteWhereMock = vi.fn()
  const transactionMock = vi.fn()

  const selectChain = {
    from: () => selectChain,
    innerJoin: () => selectChain,
    where: () => selectChain,
    orderBy: () => selectChain,
    limit: selectLimitMock,
    offset: () => selectLimitMock(),
  }

  const updateChain = {
    set: (arg: unknown) => {
      updateSetMock(arg)
      return updateChain
    },
    where: () => Promise.resolve(),
  }

  const deleteChain = {
    where: (arg: unknown) => deleteWhereMock(arg),
  }

  const dbMock = {
    select: () => selectChain,
    update: () => updateChain,
    delete: () => deleteChain,
    transaction: transactionMock,
  }

  const passwordHashMock = vi.fn().mockResolvedValue('hashed-password')
  const createUserMock = vi.fn()
  const linkAccountMock = vi.fn()
  const deleteUserMock = vi.fn().mockResolvedValue(undefined)
  const updatePasswordMock = vi.fn().mockResolvedValue(undefined)

  const authContextMock = {
    password: { hash: passwordHashMock },
    internalAdapter: {
      createUser: createUserMock,
      linkAccount: linkAccountMock,
      deleteUser: deleteUserMock,
      updatePassword: updatePasswordMock,
    },
  }

  return {
    dbMock,
    selectLimitMock,
    updateSetMock,
    deleteWhereMock,
    transactionMock,
    authContextMock,
    passwordHashMock,
    createUserMock,
    linkAccountMock,
    deleteUserMock,
    updatePasswordMock,
  }
})

vi.mock('@/lib/db', () => ({ db: dbMock }))
vi.mock('@/lib/auth', () => ({
  auth: { $context: Promise.resolve(authContextMock) },
}))

import {
  createUserAdmin,
  deleteUserAdmin,
  resetUserPasswordAdmin,
  updateUserAdmin,
} from '@/services/admin/user.service'
import { UniqueConstraintError } from '@/services/admin/errors'

const adminUserRow = {
  id: 'u1',
  name: 'Taro',
  email: 'taro@example.com',
  role: 'admin' as const,
  status: 'active' as const,
  createdAt: new Date('2026-01-01'),
}

const learnerUserRow = {
  ...adminUserRow,
  id: 'u1',
  role: 'learner' as const,
}

describe('createUserAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a user, links the credential account, and sets admin role', async () => {
    // 1st select: duplicate-email pre-check → no existing user.
    selectLimitMock.mockResolvedValueOnce([])
    createUserMock.mockResolvedValue({ id: 'u1' })
    linkAccountMock.mockResolvedValue(undefined)
    // 2nd select (via getUserAdmin at the end) → the assembled row.
    selectLimitMock.mockResolvedValueOnce([adminUserRow])

    const result = await createUserAdmin({
      name: 'Taro',
      email: 'taro@example.com',
      password: 'password123',
      role: 'admin',
    })

    expect(passwordHashMock).toHaveBeenCalledWith('password123')
    expect(createUserMock).toHaveBeenCalledWith({
      email: 'taro@example.com',
      name: 'Taro',
      emailVerified: false,
    })
    expect(linkAccountMock).toHaveBeenCalledWith({
      userId: 'u1',
      providerId: 'credential',
      accountId: 'u1',
      password: 'hashed-password',
    })
    expect(updateSetMock).toHaveBeenCalledWith({ role: 'admin' })
    expect(result).toEqual(adminUserRow)
  })

  it('throws UniqueConstraintError when the email is already taken', async () => {
    selectLimitMock.mockResolvedValueOnce([{ id: 'existing' }])

    await expect(
      createUserAdmin({
        name: 'Taro',
        email: 'taro@example.com',
        password: 'password123',
        role: 'learner',
      }),
    ).rejects.toBeInstanceOf(UniqueConstraintError)

    expect(createUserMock).not.toHaveBeenCalled()
  })
})

describe('updateUserAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when the user does not exist', async () => {
    selectLimitMock.mockResolvedValueOnce([]) // getUserAdmin (existing) check

    await expect(updateUserAdmin('missing', { name: 'X' })).resolves.toBeNull()
  })

  it('deletes sessions when transitioning to disabled', async () => {
    selectLimitMock.mockResolvedValueOnce([learnerUserRow]) // existing
    selectLimitMock.mockResolvedValueOnce([{ ...learnerUserRow, status: 'disabled' }]) // final getUserAdmin

    const result = await updateUserAdmin('u1', { status: 'disabled' })

    expect(deleteWhereMock).toHaveBeenCalled()
    expect(result?.status).toBe('disabled')
  })
})

describe('deleteUserAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when the user does not exist', async () => {
    selectLimitMock.mockResolvedValueOnce([])

    await expect(deleteUserAdmin('missing')).resolves.toBeNull()
    expect(transactionMock).not.toHaveBeenCalled()
  })

  it('removes app rows + profile inside a transaction, then the auth user', async () => {
    selectLimitMock.mockResolvedValueOnce([learnerUserRow]) // existing check
    const txDeleteWhere = vi.fn()
    const tx = {
      delete: () => ({ where: txDeleteWhere }),
    }
    transactionMock.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx))

    const result = await deleteUserAdmin('u1')

    expect(transactionMock).toHaveBeenCalled()
    // studyProgress, bookmarks, mockExamAttempts, readerProgress, userProfiles
    expect(txDeleteWhere).toHaveBeenCalledTimes(5)
    expect(deleteUserMock).toHaveBeenCalledWith('u1')
    expect(result).toEqual({ id: 'u1' })
  })
})

describe('resetUserPasswordAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when the user does not exist', async () => {
    selectLimitMock.mockResolvedValueOnce([])

    await expect(
      resetUserPasswordAdmin('missing', { mode: 'generate' }),
    ).resolves.toBeNull()
  })

  it('generate mode returns a password and hashes it before updatePassword', async () => {
    selectLimitMock.mockResolvedValueOnce([learnerUserRow])

    const result = await resetUserPasswordAdmin('u1', { mode: 'generate' })

    expect(result?.password).toEqual(expect.any(String))
    expect(result?.password?.length).toBe(16)
    expect(passwordHashMock).toHaveBeenCalledWith(result?.password)
    expect(updatePasswordMock).toHaveBeenCalledWith('u1', 'hashed-password')

    const hashOrder = passwordHashMock.mock.invocationCallOrder[0]
    const updateOrder = updatePasswordMock.mock.invocationCallOrder[0]
    expect(hashOrder).toBeLessThan(updateOrder)
  })

  it('manual mode uses the provided password and does not return one', async () => {
    selectLimitMock.mockResolvedValueOnce([learnerUserRow])

    const result = await resetUserPasswordAdmin('u1', {
      mode: 'manual',
      password: 'manual-pass-1',
    })

    expect(passwordHashMock).toHaveBeenCalledWith('manual-pass-1')
    expect(updatePasswordMock).toHaveBeenCalledWith('u1', 'hashed-password')
    expect(result).toEqual({ id: 'u1' })
  })
})
