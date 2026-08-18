import { NextResponse } from "next/server"
import { rejectContent } from "@/lib/services/content-pipeline"
import { writeAuditLog, getClientIp } from "@/lib/auth/audit-log"
import { getClaimsFromRequest } from "@/lib/auth/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const ip = getClientIp(request)
  const claims = getClaimsFromRequest(request)
  const userId = claims?.sub || "admin"
  try {
    const { reason } = await request.json().catch(() => ({}))
    const rejectionReason = reason || "No reason provided"
    await rejectContent(params.id, rejectionReason)
    await writeAuditLog({
      action: "admin.content_reject",
      userId,
      data: { contentId: params.id, reason: rejectionReason },
      ip,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    )
  }
}
