import { NextResponse } from "next/server"
import { executeDailyPublishing } from "@/lib/services/auto-publisher"
import { writeAuditLog, getClientIp } from "@/lib/auth/audit-log"
import { getClaimsFromRequest } from "@/lib/auth/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const claims = getClaimsFromRequest(request)
  const userId = claims?.sub || "admin"
  try {
    const result = await executeDailyPublishing()
    await writeAuditLog({
      action: "admin.manual_publish",
      userId,
      data: { result },
      ip,
    })
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    )
  }
}
