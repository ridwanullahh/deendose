import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const adminSecret = process.env.ADMIN_SECRET
    const authHeader = request.headers.get('authorization')
    const sessionCookie = request.cookies.get('admin-session')

    // Check for valid session or authorization
    if (!sessionCookie && (!authHeader || authHeader !== `Bearer ${adminSecret}`)) {
      // Redirect to login page (will create this)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Protect admin API routes
  if (pathname.startsWith('/api/admin')) {
    const adminSecret = process.env.ADMIN_SECRET
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  // Protect cron routes
  if (pathname.startsWith('/api/cron')) {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/cron/:path*',
  ],
}
