// Edge-compatible HS256 JWT helpers using the Web Crypto API.
// No external dependencies; works in Cloudflare Pages edge runtime
// and Node runtime alike.

export interface JwtHeader {
  alg: "HS256"
  typ: "JWT"
}

export interface JwtClaims {
  sub: string
  iat: number
  exp: number
  [key: string]: any
}

const TEXT_ENCODER = new TextEncoder()
const TEXT_DECODER = new TextDecoder()

function base64UrlEncode(bytes: Uint8Array): string {
  let str = ""
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i])
  const b64 = typeof btoa === "function" ? btoa(str) : Buffer.from(bytes).toString("base64")
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlDecode(input: string): Uint8Array {
  let s = input.replace(/-/g, "+").replace(/_/g, "/")
  while (s.length % 4) s += "="
  const bin = typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary")
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const keyBytes = TEXT_ENCODER.encode(secret)
  return crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

export async function signJwt(
  claims: Record<string, any>,
  secret: string,
  ttlSeconds: number = 7200,
): Promise<string> {
  if (!secret) throw new Error("JWT secret is not configured")
  const now = Math.floor(Date.now() / 1000)
  const payload: JwtClaims = {
    sub: claims.sub || "system",
    iat: now,
    exp: now + ttlSeconds,
    ...claims,
  }
  const header: JwtHeader = { alg: "HS256", typ: "JWT" }
  const headerB64 = base64UrlEncode(TEXT_ENCODER.encode(JSON.stringify(header)))
  const payloadB64 = base64UrlEncode(TEXT_ENCODER.encode(JSON.stringify(payload)))
  const signingInput = `${headerB64}.${payloadB64}`
  const key = await importHmacKey(secret)
  const sigBuf = await crypto.subtle.sign("HMAC", key, TEXT_ENCODER.encode(signingInput))
  const sigB64 = base64UrlEncode(new Uint8Array(sigBuf))
  return `${signingInput}.${sigB64}`
}

export async function verifyJwt(token: string, secret: string): Promise<JwtClaims | null> {
  if (!secret) return null
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [headerB64, payloadB64, sigB64] = parts
  const signingInput = `${headerB64}.${payloadB64}`

  let key: CryptoKey
  try {
    key = await importHmacKey(secret)
  } catch {
    return null
  }
  const sigBytes = base64UrlDecode(sigB64)
  let ok = false
  try {
    ok = await crypto.subtle.verify("HMAC", key, sigBytes as unknown as BufferSource, TEXT_ENCODER.encode(signingInput))
  } catch {
    return null
  }
  if (!ok) return null

  let claims: JwtClaims
  try {
    const payloadBytes = base64UrlDecode(payloadB64)
    claims = JSON.parse(TEXT_DECODER.decode(payloadBytes))
  } catch {
    return null
  }
  const now = Math.floor(Date.now() / 1000)
  if (typeof claims.exp !== "number" || claims.exp < now) return null
  return claims
}

export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null
  const m = authHeader.match(/^Bearer\s+(.+)$/i)
  return m ? m[1].trim() : null
}

export async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", TEXT_ENCODER.encode(data))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}
