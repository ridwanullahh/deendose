import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyJwt } from "@/lib/auth/jwt"
import { ADMIN_COOKIE_NAME } from "@/lib/auth/cookies"

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/cron/:path*",
  ],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ---- Admin pages: protect everything except /admin/login ----
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
      return NextResponse.next()
    }
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
    const secret = process.env.ADMIN_TOKEN_SECRET
    let authorised = false
    if (token && secret) {
      const claims = await verifyJwt(token, secret)
      if (claims && claims.role === "admin") authorised = true
    }
    if (!authorised) {
      const from = pathname + request.nextUrl.search
      const url = new URL("/admin/login", request.url)
      url.searchParams.set("from", from)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ---- Admin API routes: require a valid JWT cookie (or Bearer) ----
  if (pathname.startsWith("/api/admin")) {
    // Allow /api/admin/login to be hit unauthenticated (it is the login).
    if (pathname === "/api/admin/login" || pathname.startsWith("/api/admin/login/")) {
      return NextResponse.next()
    }
    const secret = process.env.ADMIN_TOKEN_SECRET
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
      || (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim()

    if (!secret || !token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const claims = await verifyJwt(token, secret).catch(() => null)
    if (!claims || claims.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  // ---- Cron routes: require CRON_SECRET Bearer token ----
  if (pathname.startsWith("/api/cron")) {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization")
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  return NextResponse.next()
}
