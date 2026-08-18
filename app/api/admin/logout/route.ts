import { NextResponse } from "next/server"
import { ADMIN_COOKIE_NAME } from "@/lib/auth/cookies"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  })
  return response
}
