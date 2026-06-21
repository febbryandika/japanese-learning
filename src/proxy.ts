import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const authRoutes = ['/login', '/register']

// Optimistic, cookie-only gate (no DB hit). The real session check still runs
// server-side in protected pages via getServerSession().
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSessionCookie = Boolean(getSessionCookie(request))
  const isAuthRoute = authRoutes.includes(pathname)

  if (hasSessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!hasSessionCookie && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}
