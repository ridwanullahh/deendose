// ================================
// UniversalSDK - Lightbase-backed, with GitHub JSON storage fallback
// ================================
//
// When process.env.LIGHTBASE_API_KEY is non-empty, every read/write is
// delegated to the Lightbase HTTP client in lib/lightbase/client.ts.
// When the key is empty, the SDK falls back to GitHub Contents-API JSON
// storage so local dev continues to work end-to-end.
//
// The public method shape (get, getItem, insert, bulkInsert, update,
// bulkUpdate, delete, bulkDelete, cloneItem, queryBuilder) is preserved
// exactly so callers in lib/sdk.ts and the API routes do not need to
// change.

import {
  lightbaseClient,
  type LightbaseFilterExpr,
  type LightbaseFieldDefinition,
  type LightbaseIndexDefinition,
} from "./lightbase/client"

interface CloudinaryConfig {
  uploadPreset?: string
  cloudName?: string
  apiKey?: string
  apiSecret?: string
}

interface SMTPConfig {
  endpoint?: string
  from?: string
  test?: () => Promise<boolean>
}

interface AuthConfig {
  requireEmailVerification?: boolean
  otpTriggers?: string[]
}

interface SchemaDefinition {
  required?: string[]
  types?: Record<string, string>
  defaults?: Record<string, any>
}

interface UniversalSDKConfig {
  owner: string
  repo: string
  token: string
  branch?: string
  basePath?: string
  mediaPath?: string
  cloudinary?: CloudinaryConfig
  smtp?: SMTPConfig
  templates?: Record<string, string>
  schemas?: Record<string, SchemaDefinition>
  auth?: AuthConfig
}

interface User {
  id?: string
  uid?: string
  email: string
  password?: string
  googleId?: string
  verified?: boolean
  roles?: string[]
  permissions?: string[]
  [key: string]: any
}

interface Session {
  token: string
  user: User
  created: number
}

interface OTPRecord {
  otp: string
  created: number
  reason: string
}

interface AuditLogEntry {
  action: string
  data: any
  timestamp: number
}

interface QueryBuilder<T = any> {
  where(fn: (item: T) => boolean): QueryBuilder<T>
  sort(field: string, dir?: "asc" | "desc"): QueryBuilder<T>
  project(fields: string[]): QueryBuilder<Partial<T>>
  exec(): Promise<T[]>
}

interface MediaAttachment {
  attachmentId: string
  mimeType: string
  isInline: boolean
  url: string
  name: string
}

interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  url: string
  [key: string]: any
}

interface EmailPayload {
  to: string
  subject: string
  html: string
  from: string
  headers: Record<string, string>
}

// ---- Field-type mapping (legacy GitHub-style -> Lightbase) ----
const LEGACY_TYPE_TO_LIGHTBASE: Record<string, LightbaseFieldDefinition["type"]> = {
  string: "string",
  text: "text",
  number: "number",
  integer: "integer",
  boolean: "boolean",
  date: "datetime",
  datetime: "datetime",
  object: "json",
  json: "json",
  array: "array",
  uuid: "uuid",
  url: "url",
  email: "email",
}

export function mapLegacyTypeToLightbase(legacyType: string): LightbaseFieldDefinition["type"] {
  return LEGACY_TYPE_TO_LIGHTBASE[legacyType] || "json"
}

// ---- Strip legacy id/uid before sending to Lightbase ----
function stripLegacyIdentity(doc: any): any {
  if (!doc || typeof doc !== "object") return doc
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(doc)) {
    if (k === "id" || k === "uid") continue
    out[k] = v
  }
  return out
}

// ---- Normalise a Lightbase document back into the GitHub-style shape
// callers expect (id + uid aliases, plus reserved fields carried as
// _created_at/_updated_at/_revision).
function normaliseLightbaseDoc<T = any>(doc: any): T & { id: string; uid: string } {
  const d = doc || {}
  const id = String(d.id ?? "")
  return {
    ...d,
    id,
    uid: id, // alias for callers that key on uid
  } as T & { id: string; uid: string }
}

class UniversalSDK {
  private owner: string
  private repo: string
  private token: string
  private branch: string
  private basePath: string
  private mediaPath: string
  private cloudinary: CloudinaryConfig
  private smtp: SMTPConfig
  private templates: Record<string, string>
  private schemas: Record<string, SchemaDefinition>
  private authConfig: AuthConfig
  private sessionStore: Record<string, Session>
  private otpMemory: Record<string, OTPRecord>
  private auditLog: Record<string, AuditLogEntry[]>

  constructor(config: UniversalSDKConfig) {
    this.owner = config.owner
    this.repo = config.repo
    this.token = config.token
    this.branch = config.branch || "main"
    this.basePath = config.basePath || "db"
    this.mediaPath = config.mediaPath || "media"
    this.cloudinary = config.cloudinary || {}
    this.smtp = config.smtp || {}
    this.templates = config.templates || {}
    this.schemas = config.schemas || {}
    this.authConfig = config.auth || { requireEmailVerification: true, otpTriggers: ["register"] }
    this.sessionStore = {}
    this.otpMemory = {}
    this.auditLog = {}
  }

  // ---- Routing predicate: Lightbase is the active backend ----
  private useLightbase(): boolean {
    return lightbaseClient !== null && Boolean(process.env.LIGHTBASE_API_KEY)
  }

  private lb() {
    if (!lightbaseClient) {
      throw new Error("Lightbase client is not configured (LIGHTBASE_API_KEY is empty)")
    }
    return lightbaseClient
  }

  // ============================
  // GITHUB FALLBACK IMPLEMENTATION
  // ============================

  private headers(): Record<string, string> {
    return {
      Authorization: `token ${this.token}`,
      "Content-Type": "application/json",
    }
  }

  private async ghRequest(path: string, method = "GET", body: any = null): Promise<any> {
    const url =
      `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}` +
      (method === "GET" ? `?ref=${this.branch}` : "")
    const res = await fetch(url, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : null,
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  private async ghGet<T = any>(collection: string): Promise<T[]> {
    try {
      const res = await this.ghRequest(`${this.basePath}/${collection}.json`)
      const content = typeof res.content === "string" ? res.content : ""
      if (!content) return []
      // atob is available in both Node and the edge runtime via globalThis
      const decoded = typeof atob === "function" ? atob(content) : Buffer.from(content, "base64").toString("utf8")
      const parsed = JSON.parse(decoded)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  private async ghGetOne<T = any>(collection: string, key: string): Promise<T | null> {
    const arr = await this.ghGet<T>(collection)
    return arr.find((x: any) => x.id === key || x.uid === key) || null
  }

  private async ghSave<T = any>(collection: string, data: T[]): Promise<void> {
    let sha: string | undefined
    try {
      const head = await this.ghRequest(`${this.basePath}/${collection}.json`)
      sha = head.sha
    } catch {}
    const content = typeof btoa === "function"
      ? btoa(JSON.stringify(data, null, 2))
      : Buffer.from(JSON.stringify(data, null, 2)).toString("base64")
    await this.ghRequest(`${this.basePath}/${collection}.json`, "PUT", {
      message: `Update ${collection}`,
      content,
      branch: this.branch,
      ...(sha ? { sha } : {}),
    })
  }

  private async ghInsert<T = any>(collection: string, item: Partial<T>): Promise<T & { id: string; uid: string }> {
    const arr = await this.ghGet<T>(collection)
    const schema = this.schemas[collection]
    if (schema?.defaults) item = { ...schema.defaults, ...item }
    this.validateSchema(collection, item)
    const id = (Math.max(0, ...arr.map((x: any) => +x.id || 0)) + 1).toString()
    const newItem = { uid: crypto.randomUUID(), id, ...item } as T & { id: string; uid: string }
    arr.push(newItem)
    await this.ghSave(collection, arr)
    this._audit(collection, newItem, "insert")
    return newItem
  }

  private async ghBulkInsert<T = any>(
    collection: string,
    items: Partial<T>[],
  ): Promise<(T & { id: string; uid: string })[]> {
    const arr = await this.ghGet<T>(collection)
    const schema = this.schemas[collection]
    const base = Math.max(0, ...arr.map((x: any) => +x.id || 0))
    const newItems = items.map((item, i) => {
      if (schema?.defaults) item = { ...schema.defaults, ...item }
      this.validateSchema(collection, item)
      return { uid: crypto.randomUUID(), id: (base + i + 1).toString(), ...item } as T & { id: string; uid: string }
    })
    const result = [...arr, ...newItems]
    await this.ghSave(collection, result)
    newItems.forEach((n) => this._audit(collection, n, "insert"))
    return newItems
  }

  private async ghUpdate<T = any>(collection: string, key: string, updates: Partial<T>): Promise<T> {
    const arr = await this.ghGet<T>(collection)
    const i = arr.findIndex((x: any) => x.id === key || x.uid === key)
    if (i < 0) throw new Error("Not found")
    const upd = { ...arr[i], ...updates }
    this.validateSchema(collection, upd)
    arr[i] = upd
    await this.ghSave(collection, arr)
    this._audit(collection, upd, "update")
    return upd
  }

  private async ghBulkUpdate<T = any>(
    collection: string,
    updates: (Partial<T> & { id?: string; uid?: string })[],
  ): Promise<T[]> {
    const arr = await this.ghGet<T>(collection)
    const updatedItems = updates.map((u) => {
      const i = arr.findIndex((x: any) => x.id === u.id || x.uid === u.uid)
      if (i < 0) throw new Error(`Item not found: ${u.id || u.uid}`)
      const upd = { ...arr[i], ...u }
      this.validateSchema(collection, upd)
      arr[i] = upd
      return upd
    })
    await this.ghSave(collection, arr)
    updatedItems.forEach((u) => this._audit(collection, u, "update"))
    return updatedItems
  }

  private async ghDelete<T = any>(collection: string, key: string): Promise<void> {
    const arr = await this.ghGet<T>(collection)
    const filtered = arr.filter((x: any) => x.id !== key && x.uid !== key)
    const deleted = arr.filter((x: any) => x.id === key || x.uid === key)
    await this.ghSave(collection, filtered)
    deleted.forEach((d) => this._audit(collection, d, "delete"))
  }

  private async ghBulkDelete<T = any>(collection: string, keys: string[]): Promise<T[]> {
    const arr = await this.ghGet<T>(collection)
    const filtered = arr.filter((x: any) => !keys.includes(x.id) && !keys.includes(x.uid))
    const deleted = arr.filter((x: any) => keys.includes(x.id) || keys.includes(x.uid))
    await this.ghSave(collection, filtered)
    deleted.forEach((d) => this._audit(collection, d, "delete"))
    return deleted
  }

  private async ghCloneItem<T = any>(collection: string, key: string): Promise<T & { id: string; uid: string }> {
    const arr = await this.ghGet<T>(collection)
    const orig = arr.find((x: any) => x.id === key || x.uid === key)
    if (!orig) throw new Error("Not found")
    const { id, uid, ...core } = orig as any
    return this.ghInsert(collection, core)
  }

  // ============================
  // LIGHTBASE-BACKED IMPLEMENTATION
  // ============================

  private async lbGet<T = any>(collection: string): Promise<T[]> {
    const docs = await this.lb().getCollection<T>(collection)
    return docs.map((d: any) => normaliseLightbaseDoc<T>(d))
  }

  private async lbGetItem<T = any>(collection: string, key: string): Promise<T | null> {
    // Try by id first; if not found, fall back to querying by uid alias.
    const doc = await this.lb().getOne<any>(collection, key)
    if (doc) return normaliseLightbaseDoc<T>(doc) as T
    // Some legacy callers may pass a uid that differs from the Lightbase id;
    // search the collection for a doc whose stored uid field matches.
    const all = await this.lb().getCollection<any>(collection)
    const match = all.find((d: any) => d.uid === key || d.id === key)
    return match ? (normaliseLightbaseDoc<T>(match) as T) : null
  }

  private async lbInsert<T = any>(collection: string, item: Partial<T>): Promise<T & { id: string; uid: string }> {
    const schema = this.schemas[collection]
    let payload: any = item
    if (schema?.defaults) payload = { ...schema.defaults, ...payload }
    payload = stripLegacyIdentity(payload)
    const doc = await this.lb().insert<any>(collection, payload)
    const out = normaliseLightbaseDoc<T>(doc)
    this._audit(collection, out, "insert")
    return out
  }

  private async lbBulkInsert<T = any>(
    collection: string,
    items: Partial<T>[],
  ): Promise<(T & { id: string; uid: string })[]> {
    const schema = this.schemas[collection]
    const payloads = items.map((it) => {
      let payload: any = it
      if (schema?.defaults) payload = { ...schema.defaults, ...payload }
      return stripLegacyIdentity(payload)
    })
    const docs = await this.lb().bulkInsert<any>(collection, payloads)
    const out = docs.map((d: any) => normaliseLightbaseDoc<T>(d))
    out.forEach((n) => this._audit(collection, n, "insert"))
    return out
  }

  private async lbUpdate<T = any>(collection: string, key: string, updates: Partial<T>): Promise<T> {
    const patch = stripLegacyIdentity(updates)
    const doc = await this.lb().update<any>(collection, key, patch)
    const out = normaliseLightbaseDoc<T>(doc)
    this._audit(collection, out, "update")
    return out
  }

  private async lbBulkUpdate<T = any>(
    collection: string,
    updates: (Partial<T> & { id?: string; uid?: string })[],
  ): Promise<T[]> {
    const out: T[] = []
    for (const u of updates) {
      const id = String(u.id || u.uid || "")
      if (!id) throw new Error("bulkUpdate: every update must include id or uid")
      const patch = stripLegacyIdentity(u)
      const doc = await this.lb().update<any>(collection, id, patch)
      const normalised = normaliseLightbaseDoc<T>(doc)
      out.push(normalised)
      this._audit(collection, normalised, "update")
    }
    return out
  }

  private async lbDelete<T = any>(collection: string, key: string): Promise<void> {
    await this.lb().delete(collection, key)
    this._audit(collection, { id: key, uid: key }, "delete")
  }

  private async lbBulkDelete<T = any>(collection: string, keys: string[]): Promise<T[]> {
    const deleted: any[] = []
    for (const k of keys) {
      try {
        const doc = await this.lb().getOne<any>(collection, k)
        await this.lb().delete(collection, k)
        const n = doc ? normaliseLightbaseDoc<T>(doc) : ({ id: k, uid: k } as any)
        deleted.push(n)
        this._audit(collection, n, "delete")
      } catch (e) {
        // skip not-found
      }
    }
    return deleted
  }

  private async lbCloneItem<T = any>(collection: string, key: string): Promise<T & { id: string; uid: string }> {
    const orig = await this.lbGetItem<T & { id?: string; uid?: string }>(collection, key)
    if (!orig) throw new Error("Not found")
    const core = stripLegacyIdentity(orig)
    return this.lbInsert<T>(collection, core)
  }

  // ============================
  // PUBLIC API (router for the two backends)
  // ============================

  async get<T = any>(collection: string): Promise<T[]> {
    if (this.useLightbase()) {
      try {
        return await this.lbGet<T>(collection)
      } catch (e) {
        // Surface real Lightbase errors so callers can handle 401/404/etc.
        throw e
      }
    }
    return this.ghGet<T>(collection)
  }

  async getItem<T = any>(collection: string, key: string): Promise<T | null> {
    if (this.useLightbase()) return this.lbGetItem<T>(collection, key)
    return this.ghGetOne<T>(collection, key)
  }

  async insert<T = any>(collection: string, item: Partial<T>): Promise<T & { id: string; uid: string }> {
    if (this.useLightbase()) return this.lbInsert<T>(collection, item)
    return this.ghInsert<T>(collection, item)
  }

  async bulkInsert<T = any>(
    collection: string,
    items: Partial<T>[],
  ): Promise<(T & { id: string; uid: string })[]> {
    if (this.useLightbase()) return this.lbBulkInsert<T>(collection, items)
    return this.ghBulkInsert<T>(collection, items)
  }

  async update<T = any>(collection: string, key: string, updates: Partial<T>): Promise<T> {
    if (this.useLightbase()) return this.lbUpdate<T>(collection, key, updates)
    return this.ghUpdate<T>(collection, key, updates)
  }

  async bulkUpdate<T = any>(
    collection: string,
    updates: (Partial<T> & { id?: string; uid?: string })[],
  ): Promise<T[]> {
    if (this.useLightbase()) return this.lbBulkUpdate<T>(collection, updates)
    return this.ghBulkUpdate<T>(collection, updates)
  }

  async delete<T = any>(collection: string, key: string): Promise<void> {
    if (this.useLightbase()) return this.lbDelete<T>(collection, key)
    return this.ghDelete<T>(collection, key)
  }

  async bulkDelete<T = any>(collection: string, keys: string[]): Promise<T[]> {
    if (this.useLightbase()) return this.lbBulkDelete<T>(collection, keys)
    return this.ghBulkDelete<T>(collection, keys)
  }

  async cloneItem<T = any>(collection: string, key: string): Promise<T & { id: string; uid: string }> {
    if (this.useLightbase()) return this.lbCloneItem<T>(collection, key)
    return this.ghCloneItem<T>(collection, key)
  }

  // ============================
  // Migration helper
  // ============================

  /**
   * Pulls the GitHub JSON file for `collection`, upserts every record
   * into Lightbase, and returns the count of records migrated. Use this
   * once to move data from the legacy GitHub backend into Lightbase.
   */
  async migrateGithubToJsonbase(collection: string): Promise<number> {
    if (!this.useLightbase()) {
      throw new Error("Lightbase is not enabled (LIGHTBASE_API_KEY is empty)")
    }
    const records = await this.ghGet<any>(collection)
    if (records.length === 0) return 0

    let migrated = 0
    for (const rec of records) {
      const filter: LightbaseFilterExpr = {
        field: "uid",
        op: "eq",
        value: String(rec.uid ?? rec.id ?? ""),
      }
      // Lightbase will create a new doc if the filter matches nothing.
      // The migrated record keeps its legacy id/uid values stored as
      // regular fields (we already strip them out of the document body
      // in lbInsert via stripLegacyIdentity; here we want to keep them
      // so we attach them back as legacyId/legacyUid).
      const doc: any = { ...rec }
      const legacyId = String(rec.id ?? "")
      const legacyUid = String(rec.uid ?? "")
      if (legacyId) doc.legacyId = legacyId
      if (legacyUid) doc.legacyUid = legacyUid
      const body = stripLegacyIdentity(doc)
      try {
        await this.lb().upsert(collection, filter, body)
        migrated++
      } catch (e) {
        console.error(`migrate: failed to upsert ${collection}/${legacyUid}:`, e)
      }
    }
    return migrated
  }

  // ============================
  // Schema validation (legacy, kept for backward compatibility)
  // ============================

  private validateSchema(collection: string, item: any): void {
    const schema = this.schemas[collection]
    if (!schema) return // Allow collections without schemas
    ;(schema.required || []).forEach((r) => {
      if (!(r in item)) throw new Error(`Missing required: ${r}`)
    })
    Object.entries(item).forEach(([k, v]) => {
      const t = schema.types?.[k]
      if (t) {
        const ok =
          (t === "string" && typeof v === "string") ||
          (t === "number" && typeof v === "number") ||
          (t === "boolean" && typeof v === "boolean") ||
          (t === "object" && typeof v === "object") ||
          (t === "array" && Array.isArray(v)) ||
          (t === "date" && !isNaN(Date.parse(v as string))) ||
          (t === "uuid" && typeof v === "string")
        if (!ok) throw new Error(`Field ${k} should be ${t}`)
      }
    })
  }

  // ============================
  // Email / OTP / SMTP (unchanged)
  // ============================

  async sendEmail(to: string, subject: string, html: string, smtpOverride: SMTPConfig | null = null): Promise<boolean> {
    const endpoint = smtpOverride?.endpoint || this.smtp.endpoint
    const sender = smtpOverride?.from || this.smtp.from || "no-reply@example.com"
    const payload: EmailPayload = {
      to,
      subject,
      html,
      from: sender,
      headers: { "Reply-To": sender, "List-Unsubscribe": "<mailto:unsubscribe@example.com>" },
    }
    if (!endpoint) throw new Error("SMTP endpoint is not configured")
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error("Email send failed")
    return true
  }

  // ============================
  // Authentication helpers (legacy, kept for backward compatibility)
  // ============================

  hashPassword(password: string): string {
    const salt = crypto.randomUUID()
    const hash = btoa([...(password + salt)].map((c) => c.charCodeAt(0).toString(16)).join(""))
    return `${salt}$${hash}`
  }

  verifyPassword(password: string, hashString: string): boolean {
    const [salt, hash] = hashString.split("$")
    const testHash = btoa([...(password + salt)].map((c) => c.charCodeAt(0).toString(16)).join(""))
    return testHash === hash
  }

  async register(email: string, password: string, profile: Partial<User> = {}): Promise<User> {
    if (!this.validateEmailFormat(email)) throw new Error("Invalid email format")
    const users = await this.get<User>("users")
    if (users.find((u) => u.email === email)) throw new Error("Email already registered")
    const hashed = this.hashPassword(password)
    const user = await this.insert<User>("users", { email, password: hashed, ...profile })
    return user
  }

  async login(email: string, password: string): Promise<string> {
    const user = (await this.get<User>("users")).find((u) => u.email === email)
    if (!user || !this.verifyPassword(password, user.password!)) throw new Error("Invalid credentials")
    return this.createSession(user)
  }

  createSession(user: User): string {
    const token = crypto.randomUUID()
    this.sessionStore[token] = { token, user, created: Date.now() }
    return token
  }

  getSession(token: string): Session | null {
    return this.sessionStore[token] || null
  }

  getCurrentUser(token: string): User | null {
    const session = this.getSession(token)
    return session?.user || null
  }

  validateEmailFormat(email: string): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  }

  // ============================
  // Audit log (in-memory ring buffer)
  // ============================

  private _audit(collection: string, data: any, action: string): void {
    const logs = this.auditLog[collection] || []
    logs.push({ action, data, timestamp: Date.now() })
    this.auditLog[collection] = logs.slice(-100) // keep last 100
  }

  // ============================
  // Query builder (operates on the in-memory result of get())
  // ============================

  queryBuilder<T = any>(collection: string): QueryBuilder<T> {
    let chain = Promise.resolve().then(() => this.get<T>(collection))
    const qb: QueryBuilder<T> = {
      where(fn: (item: T) => boolean) {
        chain = chain.then((arr) => arr.filter(fn))
        return qb
      },
      sort(field: string, dir: "asc" | "desc" = "asc") {
        chain = chain.then((arr) =>
          arr.sort((a: any, b: any) => (dir === "asc" ? (a[field] > b[field] ? 1 : -1) : a[field] < b[field] ? 1 : -1)),
        )
        return qb
      },
      project(fields: string[]) {
        chain = chain.then((arr) =>
          arr.map((item: any) => {
            const o: any = {}
            fields.forEach((f) => {
              if (f in item) o[f] = item[f]
            })
            return o
          }),
        )
        return qb as QueryBuilder<any>
      },
      exec() {
        return chain
      },
    }
    return qb
  }
}

export default UniversalSDK
export type {
  UniversalSDKConfig,
  CloudinaryConfig,
  SMTPConfig,
  AuthConfig,
  SchemaDefinition,
  User,
  Session,
  QueryBuilder,
  CloudinaryUploadResult,
  MediaAttachment,
}

// Re-export the Lightbase field/index types so lib/sdk.ts can build
// collection definitions from the legacy schemas without importing
// from a second path.
export type { LightbaseFieldDefinition, LightbaseIndexDefinition } from "./lightbase/client"
