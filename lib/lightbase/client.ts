// Lightbase SDK client. Production-grade HTTP client for the Lightbase BaaS.
// No external dependencies — uses fetch only.
// Activates the moment valid credentials are supplied via env vars.

export interface LightbaseClientConfig {
  baseUrl: string
  apiKey: string
  project: string
  tenant?: string
}

export type LightbaseFieldType =
  | "string"
  | "text"
  | "number"
  | "integer"
  | "boolean"
  | "date"
  | "datetime"
  | "json"
  | "array"
  | "uuid"
  | "url"
  | "email"
  | "phone"
  | "ip"
  | "color"
  | "decimal"
  | "currency"
  | "duration"
  | "point"
  | "polygon"
  | "binary"
  | "vector"
  | "reference"

export interface LightbaseFieldDefinition {
  name: string
  type: LightbaseFieldType
  required?: boolean
  unique?: boolean
  indexed?: boolean
  default?: any
  maxLength?: number
  minimum?: number
  maximum?: number
  enum?: any[]
  precision?: number
  currency?: string
  dimensions?: number
  refCollection?: string
  cascade?: boolean
  maxBytes?: number
  searchable?: boolean
  of?: LightbaseFieldType
  description?: string
}

export interface LightbaseIndexDefinition {
  name: string
  fields: string[]
  unique?: boolean
}

export interface LightbaseCollectionDefinition {
  name: string
  fields: LightbaseFieldDefinition[]
  indexes?: LightbaseIndexDefinition[]
}

export interface LightbaseFilterExpr {
  field?: string
  op?: string
  value?: any
  and?: LightbaseFilterExpr[]
  or?: LightbaseFilterExpr[]
}

export interface LightbaseQueryParams {
  filter?: LightbaseFilterExpr
  sort?: string
  limit?: number
  cursor?: any
  after?: string
  count?: boolean
  select?: string
}

export interface LightbaseQueryResponse<T = any> {
  data: T[]
  nextCursor?: any
  total?: number
  hasMore?: boolean
  count?: number
}

export interface LightbaseSearchResponse<T = any> {
  data: T[]
  total?: number
}

export interface LightbaseUpsertResponse<T = any> {
  document: T
  created: boolean
}

export interface LightbaseBulkResponse {
  inserted: number
  updated: number
  deleted: number
  errors: any[]
}

export interface LightbaseSeedResponse {
  inserted: number
  skipped: number
  errors: any[]
}

export class LightbaseError extends Error {
  public readonly status: number
  public readonly code: string
  public readonly domain: string
  public readonly correlationId?: string
  public readonly details?: any

  constructor(message: string, opts: {
    status: number
    code: string
    domain: string
    correlationId?: string
    details?: any
  }) {
    super(message)
    this.name = "LightbaseError"
    this.status = opts.status
    this.code = opts.code
    this.domain = opts.domain
    this.correlationId = opts.correlationId
    this.details = opts.details
  }
}

export class LightbaseAuthError extends LightbaseError {
  constructor(message: string, details?: any) {
    super(message, {
      status: 401,
      code: "auth.invalid_credentials",
      domain: "auth",
      details,
    })
    this.name = "LightbaseAuthError"
  }
}

export class LightbaseForbiddenError extends LightbaseError {
  constructor(message: string, details?: any) {
    super(message, {
      status: 403,
      code: "authz.forbidden",
      domain: "authz",
      details,
    })
    this.name = "LightbaseForbiddenError"
  }
}

export class LightbaseNotFoundError extends LightbaseError {
  constructor(message: string, details?: any) {
    super(message, {
      status: 404,
      code: "not_found",
      domain: "not_found",
      details,
    })
    this.name = "LightbaseNotFoundError"
  }
}

export class LightbaseConflictError extends LightbaseError {
  public readonly revision?: number
  constructor(message: string, details?: any, revision?: number) {
    super(message, {
      status: 409,
      code: "storage.conflict",
      domain: "storage",
      details,
    })
    this.name = "LightbaseConflictError"
    this.revision = revision
  }
}

interface LightbaseErrorBody {
  error: {
    code: string
    domain: string
    message: string
    timestamp?: string
    details?: any
  }
  correlationId?: string
}

export class LightbaseClient {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly project: string
  private readonly tenant: string

  constructor(config: LightbaseClientConfig) {
    if (!config.baseUrl) throw new Error("LightbaseClient: baseUrl is required")
    if (!config.apiKey) throw new Error("LightbaseClient: apiKey is required")
    if (!config.project) throw new Error("LightbaseClient: project is required")
    this.baseUrl = config.baseUrl.replace(/\/+$/, "")
    this.apiKey = config.apiKey
    this.project = config.project
    this.tenant = config.tenant || "default"
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.apiKey && this.project)
  }

  private authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return {
      apikey: this.apiKey,
      "x-lightbase-project": this.project,
      "x-lightbase-tenant": this.tenant,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...extra,
    }
  }

  private async parseError(res: Response, method: string, path: string): Promise<LightbaseError> {
    let body: LightbaseErrorBody | null = null
    let raw: string | null = null
    try {
      raw = await res.text()
      if (raw) {
        try {
          body = JSON.parse(raw) as LightbaseErrorBody
        } catch {
          // non-JSON error body
        }
      }
    } catch {
      // ignore
    }

    const errObj = body?.error
    const message = errObj?.message || raw || `HTTP ${res.status} on ${method} ${path}`
    const code = errObj?.code || "internal.error"
    const domain = errObj?.domain || "internal"

    const base = {
      code,
      domain,
      correlationId: body?.correlationId,
      details: { ...(errObj?.details || {}), method, path, raw: raw?.slice(0, 500) },
    }

    switch (res.status) {
      case 401:
        return new LightbaseAuthError(message, base.details)
      case 403:
        return new LightbaseForbiddenError(message, base.details)
      case 404:
        return new LightbaseNotFoundError(message, base.details)
      case 409:
        return new LightbaseConflictError(message, base.details)
      default:
        return new LightbaseError(message, {
          status: res.status,
          ...base,
        })
    }
  }

  private buildUrl(path: string, query?: Record<string, string | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`)
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== "") {
          url.searchParams.set(k, v)
        }
      }
    }
    return url.toString()
  }

  private async request<T>(
    method: string,
    path: string,
    opts: {
      query?: Record<string, string | undefined>
      body?: any
      extraHeaders?: Record<string, string>
      raw?: false
    } = {},
  ): Promise<T> {
    const url = this.buildUrl(path, opts.query)
    const headers = this.authHeaders(opts.extraHeaders || {})
    const init: RequestInit = {
      method,
      headers,
    }
    if (opts.body !== undefined && opts.body !== null) {
      init.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body)
    }

    let res: Response
    try {
      res = await fetch(url, init)
    } catch (e) {
      throw new LightbaseError(`Network error: ${(e as Error).message}`, {
        status: 0,
        code: "network.error",
        domain: "network",
        details: { method, path, url },
      })
    }

    if (!res.ok) {
      throw await this.parseError(res, method, path)
    }

    if (res.status === 204) return undefined as T
    const text = await res.text()
    if (!text) return undefined as T
    try {
      return JSON.parse(text) as T
    } catch {
      return text as unknown as T
    }
  }

  // ---- Collections ----

  async listCollections(): Promise<LightbaseCollectionDefinition[]> {
    const data = await this.request<{ collections?: LightbaseCollectionDefinition[] } | LightbaseCollectionDefinition[]>(
      "GET",
      `/api/v1/projects/${this.project}/collections`,
    )
    if (Array.isArray(data)) return data
    return data.collections || []
  }

  async getCollectionSchema(name: string): Promise<LightbaseCollectionDefinition | null> {
    try {
      const data = await this.request<{ collection?: LightbaseCollectionDefinition } | LightbaseCollectionDefinition>(
        "GET",
        `/api/v1/projects/${this.project}/collections/${encodeURIComponent(name)}`,
      )
      if ((data as any)?.collection) return (data as any).collection
      return data as LightbaseCollectionDefinition
    } catch (e) {
      if (e instanceof LightbaseNotFoundError) return null
      throw e
    }
  }

  async createCollection(
    name: string,
    fields: LightbaseFieldDefinition[],
    indexes?: LightbaseIndexDefinition[],
  ): Promise<LightbaseCollectionDefinition> {
    const body: LightbaseCollectionDefinition = {
      name,
      fields,
      ...(indexes && indexes.length > 0 ? { indexes } : {}),
    }
    const data = await this.request<{ collection?: LightbaseCollectionDefinition } | LightbaseCollectionDefinition>(
      "POST",
      `/api/v1/projects/${this.project}/collections`,
      { body },
    )
    if ((data as any)?.collection) return (data as any).collection
    return data as LightbaseCollectionDefinition
  }

  async deleteCollection(name: string): Promise<void> {
    await this.request<void>("DELETE", `/api/v1/projects/${this.project}/collections/${encodeURIComponent(name)}`)
  }

  // ---- Documents ----

  async getCollection<T = any>(name: string): Promise<T[]> {
    const data = await this.request<LightbaseQueryResponse<T> | T[]>(
      "GET",
      `/api/v1/projects/${this.project}/collections/${encodeURIComponent(name)}/docs`,
      { query: { limit: "1000" } },
    )
    if (Array.isArray(data)) return data
    return (data as LightbaseQueryResponse<T>).data || []
  }

  async getOne<T = any>(collection: string, id: string): Promise<T | null> {
    try {
      const data = await this.request<{ document?: T } | T>(
        "GET",
        `/api/v1/projects/${this.project}/collections/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`,
      )
      if ((data as any)?.document) return (data as any).document
      return data as T
    } catch (e) {
      if (e instanceof LightbaseNotFoundError) return null
      throw e
    }
  }

  async insert<T = any>(collection: string, doc: any): Promise<T> {
    const data = await this.request<{ document?: T } | T>(
      "POST",
      `/api/v1/projects/${this.project}/collections/${encodeURIComponent(collection)}`,
      { body: doc },
    )
    if ((data as any)?.document) return (data as any).document
    return data as T
  }

  async bulkInsert<T = any>(collection: string, docs: any[]): Promise<T[]> {
    // Prefer the seed endpoint with dedup on "id" for idempotency.
    if (docs.length === 0) return []
    try {
      const seedBody = {
        collection,
        documents: docs,
        dedupOn: ["id"],
      }
      const seedRes = await this.request<LightbaseSeedResponse>(
        "POST",
        `/api/v1/projects/${this.project}/seed`,
        { body: seedBody },
      )
      if (seedRes && typeof seedRes.inserted === "number") {
        // Seed doesn't return full documents; re-query to get them.
        const inserted = await this.getCollection<T>(collection)
        return inserted
      }
    } catch (e) {
      // Fallback to per-doc insert
      if (!(e instanceof LightbaseError) || (e as LightbaseError).status !== 404) {
        // For non-404 errors, fall through to per-doc insert
      }
    }

    const out: T[] = []
    for (const d of docs) {
      try {
        out.push(await this.insert<T>(collection, d))
      } catch (e) {
        if (e instanceof LightbaseConflictError) {
          // Skip duplicates during per-doc fallback
          continue
        }
        throw e
      }
    }
    return out
  }

  async update<T = any>(collection: string, id: string, patch: any): Promise<T> {
    // Fetch first to get _revision for If-Match optimistic concurrency.
    let revision: number | undefined
    const existing = await this.getOne<any>(collection, id)
    if (existing && typeof existing._revision === "number") {
      revision = existing._revision
    }

    const headers: Record<string, string> = {}
    if (revision !== undefined) {
      headers["If-Match"] = String(revision)
    }

    const data = await this.request<{ document?: T } | T>(
      "PATCH",
      `/api/v1/projects/${this.project}/collections/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`,
      { body: patch, extraHeaders: headers },
    )
    if ((data as any)?.document) return (data as any).document
    return data as T
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.request<void>(
      "DELETE",
      `/api/v1/projects/${this.project}/collections/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`,
    )
  }

  async query<T = any>(
    collection: string,
    params: LightbaseQueryParams = {},
  ): Promise<LightbaseQueryResponse<T>> {
    const query: Record<string, string | undefined> = {}
    if (params.filter) query.filter = JSON.stringify(params.filter)
    if (params.sort) query.sort = params.sort
    if (params.limit !== undefined) query.limit = String(params.limit)
    if (params.cursor) query.cursor = JSON.stringify(params.cursor)
    if (params.after) query.after = params.after
    if (params.count) query.count = "true"
    if (params.select) query.select = params.select

    const data = await this.request<LightbaseQueryResponse<T> | T[]>(
      "GET",
      `/api/v1/projects/${this.project}/collections/${encodeURIComponent(collection)}/docs`,
      { query },
    )
    if (Array.isArray(data)) {
      return { data, hasMore: false, count: data.length }
    }
    return data as LightbaseQueryResponse<T>
  }

  async search<T = any>(collection: string, query: string, limit: number = 25): Promise<LightbaseSearchResponse<T>> {
    const data = await this.request<LightbaseSearchResponse<T>>(
      "POST",
      `/api/v1/projects/${this.project}/collections/${encodeURIComponent(collection)}/search`,
      { body: { query, limit } },
    )
    return data
  }

  async upsert<T = any>(collection: string, filter: LightbaseFilterExpr, document: any): Promise<LightbaseUpsertResponse<T>> {
    const data = await this.request<LightbaseUpsertResponse<T>>(
      "PUT",
      `/api/v1/projects/${this.project}/collections/${encodeURIComponent(collection)}/upsert`,
      { body: { filter, document } },
    )
    return data
  }

  async count(collection: string, filter?: LightbaseFilterExpr): Promise<number> {
    const query: Record<string, string | undefined> = {
      count: "true",
      limit: "1",
    }
    if (filter) query.filter = JSON.stringify(filter)
    const data = await this.request<LightbaseQueryResponse>(
      "GET",
      `/api/v1/projects/${this.project}/collections/${encodeURIComponent(collection)}/docs`,
      { query },
    )
    if (typeof data.count === "number") return data.count
    if (typeof data.total === "number") return data.total
    if (Array.isArray(data)) return data.length
    return (data.data || []).length
  }

  // ---- Bulk Operations ----

  async bulk(
    ops: {
      inserts?: { collection: string; document: any }[]
      updates?: { collection: string; id: string; patch: any }[]
      deletes?: { collection: string; id: string }[]
    },
  ): Promise<LightbaseBulkResponse> {
    const data = await this.request<LightbaseBulkResponse>(
      "POST",
      `/api/v1/projects/${this.project}/bulk`,
      { body: ops },
    )
    return data
  }

  // ---- Health ----

  async health(): Promise<{ status: string }> {
    const data = await this.request<{ status: string }>("GET", "/health")
    return data
  }
}

// ---- Singleton initialization from env vars ----

function buildClientFromEnv(): LightbaseClient | null {
  const apiKey = process.env.LIGHTBASE_API_KEY
  const baseUrl = process.env.LIGHTBASE_BASE_URL
  const project = process.env.LIGHTBASE_PROJECT
  const tenant = process.env.LIGHTBASE_TENANT

  if (!apiKey || !baseUrl || !project) {
    return null
  }
  return new LightbaseClient({ baseUrl, apiKey, project, tenant })
}

export const lightbaseClient: LightbaseClient | null = buildClientFromEnv()

export function isLightbaseEnabled(): boolean {
  return lightbaseClient !== null
}

export default LightbaseClient
