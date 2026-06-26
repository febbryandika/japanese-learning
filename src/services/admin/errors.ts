// Typed errors thrown by the admin services when a write violates a DB
// constraint. Route handlers translate these into HTTP statuses (409 / 400).

export class UniqueConstraintError extends Error {
  constructor(message = 'A record with these values already exists') {
    super(message)
    this.name = 'UniqueConstraintError'
  }
}

export class ForeignKeyError extends Error {
  constructor(message = 'A referenced record is missing or still in use') {
    super(message)
    this.name = 'ForeignKeyError'
  }
}

// Postgres surfaces constraint violations as SQLSTATE codes. Drizzle wraps the
// driver error, putting the original (with `.code`) on `.cause`; the raw driver
// error carries `.code` directly. Check both.
function pgErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined

  const withCode = (value: unknown): string | undefined => {
    if (typeof value === 'object' && value !== null && 'code' in value) {
      const code = (value as { code: unknown }).code
      return typeof code === 'string' ? code : undefined
    }
    return undefined
  }

  return withCode(error) ?? withCode((error as { cause?: unknown }).cause)
}

// Narrow a caught DB error into our typed variants; anything else is rethrown
// untouched. Always throws — call as `catch (e) { mapPgError(e) }`.
export function mapPgError(error: unknown): never {
  const code = pgErrorCode(error)
  if (code === '23505') {
    throw new UniqueConstraintError()
  }
  if (code === '23503') {
    throw new ForeignKeyError()
  }
  throw error
}
