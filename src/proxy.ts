import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// Optimistic, cookie-only gate (no DB hit). The real session check still runs
// server-side in protected pages via getServerSession().
//
// The cookie is only evidence enough to keep guests out of protected routes —
// never to bounce cookie-holders away from /login. A cookie can outlive its
// session (admin-disabled accounts have their sessions revoked server-side),
// and redirecting such a browser to /dashboard loops it straight back here.
export function proxy(request: NextRequest) {
  const hasSessionCookie = Boolean(getSessionCookie(request))

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/videos/:path*'],
}
