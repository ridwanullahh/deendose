import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { signJwt } from "@/lib/auth/jwt"
import { writeAuditLog, getClientIp } from "@/lib/auth/audit-log"

export const runtime = "edge"
export const dynamic = "force-dynamic"

const ADMIN_COOKIE_NAME = "deendose_admin"
const TOKEN_TTL_SECONDS = 2 * 60 * 60 // 2 hours

export async function POST(request: Request) {
  const ip = getClientIp(request)
  try {
    const body = await request.json().catch(() => ({}))
    const username = String(body.username || "").trim()
    const password = String(body.password || "")

    const envUsername = process.env.ADMIN_USERNAME
    const envHash = process.env.ADMIN_PASSWORD_HASH
    const tokenSecret = process.env.ADMIN_TOKEN_SECRET

    if (!envUsername || !envHash) {
      return NextResponse.json(
        { error: "Admin authentication is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH." },
        { status: 500 },
      )
    }
    if (!tokenSecret) {
      return NextResponse.json(
        { error: "Admin token secret is not configured. Set ADMIN_TOKEN_SECRET." },
        { status: 500 },
      )
    }

    const usernameOk = username === envUsername
    let passwordOk = false
    try {
      passwordOk = await bcrypt.compare(password, envHash)
    } catch {
      passwordOk = false
    }

    if (!usernameOk || !passwordOk) {
      await writeAuditLog({
        action: "admin.login_failed",
        userId: username || "unknown",
        data: { reason: "invalid_credentials" },
        ip,
      })
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      )
    }

    const token = await signJwt(
      { sub: username, role: "admin" },
      tokenSecret,
      TOKEN_TTL_SECONDS,
    )

    const response = NextResponse.json({ success: true, username })
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: TOKEN_TTL_SECONDS,
      path: "/",
    })

    await writeAuditLog({
      action: "admin.login_success",
      userId: username,
      ip,
    })

    return response
  } catch (error) {
    await writeAuditLog({
      action: "admin.login_error",
      data: { error: (error as Error).message },
      ip,
    })
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
