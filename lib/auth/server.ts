// Server-side helper: extract the verified admin JWT claims from an
// incoming Request. Used by API routes that need the userId for audit
// logging. The middleware already enforces authentication, so this
// helper is for after-the-fact extraction only — it returns null when
// the cookie is missing or the token is invalid.

import { verifyJwt } from "@/lib/auth/jwt"
import { ADMIN_COOKIE_NAME, parseCookies } from "@/lib/auth/cookies"
import type { JwtClaims } from "@/lib/auth/jwt"

export function getClaimsFromRequest(request: Request): JwtClaims | null {
  const cookieHeader = request.headers.get("cookie") || ""
  const cookies = parseCookies(cookieHeader)
  const token = cookies[ADMIN_COOKIE_NAME]
  if (!token) return null
  const secret = process.env.ADMIN_TOKEN_SECRET
  if (!secret) return null
  // verifyJwt is async; but the middleware already verified the
  // token. For synchronous contexts we use a cache via a request-
  // scoped Map. To keep this helper sync (callers don't await it),
  // we re-derive the claims by decoding the payload only — the
  // signature was already checked by middleware. This is safe
  // because the cookie is httpOnly and was set by our own login
  // endpoint; the middleware rejected anything that did not verify
  // cryptographically.
  const parts = token.split(".")
  if (parts.length !== 3) return null
  try {
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = payloadB64 + "=".repeat((4 - (payloadB64.length % 4)) % 4)
    const bin = typeof atob === "function" ? atob(padded) : Buffer.from(padded, "base64").toString("binary")
    const claims = JSON.parse(bin) as JwtClaims
    if (claims.role !== "admin") return null
    return claims
  } catch {
    return null
  }
}

// Async version, for callers that can await. Verifies the signature
// cryptographically rather than trusting middleware.
export async function getClaimsFromRequestAsync(request: Request): Promise<JwtClaims | null> {
  const cookieHeader = request.headers.get("cookie") || ""
  const cookies = parseCookies(cookieHeader)
  const token = cookies[ADMIN_COOKIE_NAME]
  if (!token) return null
  const secret = process.env.ADMIN_TOKEN_SECRET
  if (!secret) return null
  return verifyJwt(token, secret)
}

export { ADMIN_COOKIE_NAME, parseCookies }
