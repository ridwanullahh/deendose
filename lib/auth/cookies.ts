// Shared constants for admin auth cookies and verification helpers.
// Re-exported here so middleware and API routes share the same source
// of truth without circular imports.

export const ADMIN_COOKIE_NAME = "deendose_admin"

export function getAdminCookie(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || ""
  const map = parseCookies(cookieHeader)
  return map[ADMIN_COOKIE_NAME]
}

export function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  const parts = header.split(";")
  for (const p of parts) {
    const idx = p.indexOf("=")
    if (idx < 0) continue
    const k = p.slice(0, idx).trim()
    const v = p.slice(idx + 1).trim()
    if (k) out[k] = decodeURIComponent(v)
  }
  return out
}
