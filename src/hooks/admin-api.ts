// Shared client helper for admin mutations/queries. Carries the HTTP status on
// the thrown error so a mutation's `onError` can message 409 (conflict) vs 400
// (validation) vs 401/403 differently.

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'AdminApiError'
  }
}

export async function adminFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers:
      options?.body != null
        ? { 'Content-Type': 'application/json', ...options.headers }
        : options?.headers,
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new AdminApiError(res.status, body?.error ?? `Request failed (${res.status})`)
  }

  return res.json() as Promise<T>
}
