// Admin audit log helper.
//
// Writes audit events to the admin-audit-logs collection in Lightbase
// when it is configured (LIGHTBASE_API_KEY set). Falls back to the
// local JSON file (existing behaviour) when Lightbase is not
// configured, so local dev continues to record audit events.
//
// Used by /api/admin/login, /api/admin/content/[id]/approve|reject,
// /api/admin/manual-publish, /api/admin/oauth/*, /api/admin/settings,
// and /api/admin/schedule/*.

import { lightbaseClient } from "@/lib/lightbase/client"
import { sdk } from "@/lib/sdk"

export interface AuditEvent {
  action: string
  userId?: string
  data?: any
  ip?: string
  timestamp?: string
}

export async function writeAuditLog(event: AuditEvent): Promise<void> {
  const ts = event.timestamp || new Date().toISOString()
  const record = {
    action: event.action,
    userId: event.userId || "system",
    data: event.data || {},
    ip: event.ip || "",
    timestamp: ts,
  }

  // Lightbase path
  if (lightbaseClient) {
    try {
      await lightbaseClient.insert("admin-audit-logs", record)
      return
    } catch (e) {
      console.warn("[audit] lightbase write failed; falling back to local file:", (e as Error).message)
    }
  }

  // Local JSON fallback (dev only)
  try {
    await sdk.insert("admin-audit-logs", record)
  } catch (e) {
    console.error("[audit] local file write failed:", (e as Error).message)
  }
}

export function getClientIp(request: Request | null | undefined): string {
  if (!request) return ""
  const headers = request.headers
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    ""
  )
}
