/**
 * Bismillah Ar-Rahman Ar-Roheem.
 *
 * LightbaseClient — a typed HTTP client for the Lightbase BaaS REST API.
 *
 * Env vars consumed (see .env.example):
 *   LIGHTBASE_API_KEY    — required to enable Lightbase; when empty the
 *                          caller falls back to the legacy GitHub JSON
 *                          backend (dev only).
 *   LIGHTBASE_BASE_URL   — e.g. http://lightbase.80.225.189.74.sslip.io
 *   LIGHTBASE_PROJECT    — e.g. deendose | deenqa
 *   LIGHTBASE_TENANT     — defaults to "default"
 *
 * The client is dependency-free (uses the platform `fetch`). It throws
 * `LightbaseApiError` on non-2xx responses so callers can branch on
 * `error.code` (e.g. "auth.invalid_credentials", "validation.failed",
 * "not_found").
 */

export interface LightbaseConfig {
  baseUrl: string
  apiKey: string
  project: string
  tenant?: string
  /** Optional fetch override (for tests). */
  fetchImpl?: typeof fetch
}

/** Alias names kept for back-compat with universal-sdk.ts. */
export interface LightbaseFieldDefinition {
  name: string
  type:
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
  required?: boolean
  unique?: boolean
  indexed?: boolean
  default?: unknown
  maxLength?: number
  minimum?: number
  maximum?: number
  enum?: unknown[]
  precision?: number
  currency?: string
  dimensions?: number
  refCollection?: string
  cascade?: boolean
  maxBytes?: number
  searchable?: boolean
  /** For array fields: the element type (e.g. "string", "json"). */
  of?: string
  description?: string
}

export interface LightbaseIndexDefinition {
  name: string
  fields: string[]
  unique?: boolean
}

export interface LightbaseCollectionSchema {
  name: string
  fields: LightbaseFieldDefinition[]
  indexes?: LightbaseIndexDefinition[]
}

/** Filter expression — see Lightbase API doc §7. */
export type LightbaseFilterExpr =
  | { field: string; op: string; value: unknown }
  | { and: LightbaseFilterExpr[] }
  | { or: LightbaseFilterExpr[] }

export interface LightbaseQueryOptions {
  filter?: LightbaseFilterExpr
  sort?: string // e.g. "age:desc,name:asc"
  limit?: number // 1..1000
  cursor?: { limit: number; offset: number }
  after?: string // ULID for keyset pagination
  count?: boolean
  select?: string // comma-separated fields, dot-notation supported
}

export interface LightbaseQueryResult<T = unknown> {
  data: T[]
  nextCursor?: { limit: number; offset: number }
  total?: number
  hasMore?: boolean
  count?: number
}

export interface LightbaseDocument<T = Record<string, unknown>> {
  document: T & {
    id: string
    _created_at: string
    _updated_at: string
    _revision: number
    _deleted: boolean
    _checksum: string
  }
}

export class LightbaseApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly domain: string,
    public readonly details?: unknown,
    public readonly correlationId?: string,
  ) {
    super(message)
    this.name = "LightbaseApiError"
  }
}

export class LightbaseClient {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly project: string
  private readonly tenant: string
  private readonly fetchImpl: typeof fetch

  constructor(config: LightbaseConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "")
    this.apiKey = config.apiKey
    this.project = config.project
    this.tenant = config.tenant ?? "default"
    this.fetchImpl = config.fetchImpl ?? fetch
  }

  /** True when the env config indicates Lightbase should be used. */
  static isEnabled(): boolean {
    return Boolean(
      process.env.LIGHTBASE_API_KEY &&
        process.env.LIGHTBASE_BASE_URL &&
        process.env.LIGHTBASE_PROJECT,
    )
  }

  /** Build a client from the current process env. Returns null if disabled. */
  static fromEnv(): LightbaseClient | null {
    if (!LightbaseClient.isEnabled()) return null
    return new LightbaseClient({
      baseUrl: process.env.LIGHTBASE_BASE_URL!,
      apiKey: process.env.LIGHTBASE_API_KEY!,
      project: process.env.LIGHTBASE_PROJECT!,
      tenant: process.env.LIGHTBASE_TENANT ?? "default",
    })
  }

  // -----------------------------------------------------------------------
  // Low-level request helper
  // -----------------------------------------------------------------------

  private async request<T = unknown>(
    path: string,
    init: {
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
      body?: unknown
      headers?: Record<string, string>
      searchParams?: Record<string, string | undefined>
    } = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`)
    if (init.searchParams) {
      for (const [k, v] of Object.entries(init.searchParams)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, v)
      }
    }
    const headers: Record<string, string> = {
      apikey: this.apiKey,
      "x-lightbase-project": this.project,
      "x-lightbase-tenant": this.tenant,
      ...init.headers,
    }
    if (init.body !== undefined) {
      headers["Content-Type"] = "application/json"
    }
    const res = await this.fetchImpl(url.toString(), {
      method: init.method ?? "GET",
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
    const text = await res.text()
    let parsed: any = null
    if (text) {
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = { raw: text }
      }
    }
    if (!res.ok) {
      const err = parsed?.error
      if (err) {
        throw new LightbaseApiError(
          err.code ?? "http.error",
          err.message ?? `HTTP ${res.status}`,
          res.status,
          err.domain ?? "http",
          err.details,
          parsed?.correlationId,
        )
      }
      throw new LightbaseApiError(
        "http.error",
        `HTTP ${res.status}: ${text.slice(0, 200)}`,
        res.status,
        "http",
      )
    }
    return parsed as T
  }

  // -----------------------------------------------------------------------
  // Collections — schema management
  // -----------------------------------------------------------------------

  async listCollections(): Promise<LightbaseCollectionSchema[]> {
    const res = await this.request<
      { collections?: LightbaseCollectionSchema[] } | LightbaseCollectionSchema[]
    >(`/api/v1/projects/${this.project}/collections`)
    if (Array.isArray(res)) return res
    return res.collections ?? []
  }

  async getCollectionSchema(name: string): Promise<LightbaseCollectionSchema | null> {
    try {
      const res = await this.request<LightbaseCollectionSchema>(
        `/api/v1/projects/${this.project}/collections/${name}`,
      )
      return res
    } catch (e) {
      if (e instanceof LightbaseApiError && e.status === 404) return null
      throw e
    }
  }

  // Alias for back-compat.
  async getCollectionInfo(name: string): Promise<LightbaseCollectionSchema | null> {
    return this.getCollectionSchema(name)
  }

  /**
   * Create a collection. Accepts either a single schema object
   * ({name, fields, indexes}) or three separate args (name, fields,
   * indexes) for back-compat with callers in lib/sdk.ts and
   * scripts/seed-lightbase.ts.
   */
  async createCollection(
    nameOrSchema: string | LightbaseCollectionSchema,
    fieldsArg?: LightbaseFieldDefinition[],
    indexesArg?: LightbaseIndexDefinition[],
  ): Promise<LightbaseCollectionSchema> {
    const schema: LightbaseCollectionSchema =
      typeof nameOrSchema === "string"
        ? {
            name: nameOrSchema,
            fields: fieldsArg ?? [],
            ...(indexesArg && indexesArg.length ? { indexes: indexesArg } : {}),
          }
        : nameOrSchema
    return this.request<LightbaseCollectionSchema>(
      `/api/v1/projects/${this.project}/collections`,
      { method: "POST", body: schema },
    )
  }

  async upsertCollection(schema: LightbaseCollectionSchema): Promise<LightbaseCollectionSchema> {
    const existing = await this.getCollectionSchema(schema.name)
    if (existing) return existing
    return this.createCollection(schema)
  }

  async deleteCollection(name: string): Promise<void> {
    await this.request(`/api/v1/projects/${this.project}/collections/${name}`, {
      method: "DELETE",
    })
  }

  // -----------------------------------------------------------------------
  // Documents — CRUD
  //
  // NOTE: `getCollection(name)` is the "list documents" method that
  // universal-sdk.ts and the rest of the app expect (returning T[]).
  // For schema introspection use `getCollectionSchema(name)` instead.
  // -----------------------------------------------------------------------

  /**
   * List documents in `collection`. Returns up to `limit` rows
   * (default 1000). This is the method callers use to read everything
   * in a collection.
   */
  async getCollection<T = Record<string, unknown>>(
    collection: string,
    opts: { limit?: number; sort?: string; filter?: LightbaseFilterExpr } = {},
  ): Promise<(T & { id: string })[]> {
    const res = await this.query<T>(collection, {
      limit: opts.limit ?? 1000,
      sort: opts.sort,
      filter: opts.filter,
    })
    return (res.data ?? []) as (T & { id: string })[]
  }

  async insert<T = Record<string, unknown>>(
    collection: string,
    doc: T,
  ): Promise<T & { id: string }> {
    const res = await this.request<LightbaseDocument<T>>(
      `/api/v1/projects/${this.project}/collections/${collection}`,
      { method: "POST", body: doc },
    )
    return res.document as T & { id: string }
  }

  async getOne<T = Record<string, unknown>>(
    collection: string,
    id: string,
  ): Promise<(T & { id: string }) | null> {
    try {
      const res = await this.request<LightbaseDocument<T>>(
        `/api/v1/projects/${this.project}/collections/${collection}/${id}`,
      )
      return res.document as T & { id: string }
    } catch (e) {
      if (e instanceof LightbaseApiError && e.status === 404) return null
      throw e
    }
  }

  async update<T = Record<string, unknown>>(
    collection: string,
    id: string,
    patch: Partial<T>,
  ): Promise<T & { id: string }> {
    // Fetch current revision for optimistic concurrency.
    const current = await this.getOne<T & { _revision?: number }>(collection, id)
    if (!current) {
      throw new LightbaseApiError(
        "not_found",
        `Document ${id} not found in ${collection}`,
        404,
        "client",
      )
    }
    const res = await this.request<LightbaseDocument<T>>(
      `/api/v1/projects/${this.project}/collections/${collection}/${id}`,
      {
        method: "PATCH",
        body: patch,
        headers: { "If-Match": String(current._revision ?? 1) },
      },
    )
    return res.document as T & { id: string }
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.request(`/api/v1/projects/${this.project}/collections/${collection}/${id}`, {
      method: "DELETE",
    })
  }

  async query<T = Record<string, unknown>>(
    collection: string,
    opts: LightbaseQueryOptions = {},
  ): Promise<LightbaseQueryResult<T>> {
    const searchParams: Record<string, string | undefined> = {}
    if (opts.filter) searchParams.filter = JSON.stringify(opts.filter)
    if (opts.sort) searchParams.sort = opts.sort
    if (opts.limit !== undefined) searchParams.limit = String(opts.limit)
    if (opts.cursor) searchParams.cursor = JSON.stringify(opts.cursor)
    if (opts.after) searchParams.after = opts.after
    if (opts.count) searchParams.count = "true"
    if (opts.select) searchParams.select = opts.select
    return this.request<LightbaseQueryResult<T>>(
      `/api/v1/projects/${this.project}/collections/${collection}/docs`,
      { searchParams },
    )
  }

  async count(collection: string, filter?: LightbaseFilterExpr): Promise<number> {
    const res = await this.query<unknown>(collection, { filter, limit: 1, count: true })
    return res.count ?? res.total ?? 0
  }

  async search<T = Record<string, unknown>>(
    collection: string,
    query: string,
    limit = 25,
  ): Promise<T[]> {
    const res = await this.request<{ data: T[]; total?: number }>(
      `/api/v1/projects/${this.project}/collections/${collection}/search`,
      { method: "POST", body: { query, limit } },
    )
    return res.data ?? []
  }

  async upsert<T = Record<string, unknown>>(
    collection: string,
    filter: LightbaseFilterExpr,
    document: T,
  ): Promise<{ document: T & { id: string }; created: boolean }> {
    const res = await this.request<{ document: T & { id: string }; created: boolean }>(
      `/api/v1/projects/${this.project}/collections/${collection}/upsert`,
      { method: "PUT", body: { filter, document } },
    )
    return res
  }

  // -----------------------------------------------------------------------
  // Bulk / Seed
  //
  // `bulkInsert` inserts one document at a time in parallel so the
  // returned array contains the actual inserted rows (the /seed
  // endpoint only returns counts, which is not enough for callers
  // that need the new ids).
  // -----------------------------------------------------------------------

  async bulkInsert<T = Record<string, unknown>>(
    collection: string,
    docs: T[],
  ): Promise<(T & { id: string })[]> {
    if (docs.length === 0) return []
    const results: Array<(T & { id: string }) | null> = await Promise.all(
      docs.map((d) =>
        this.insert<T>(collection, d).catch((e) => {
          console.error(`[LightbaseClient.bulkInsert ${collection}]`, e)
          return null as (T & { id: string }) | null
        }),
      ),
    )
    return results.filter((r): r is T & { id: string } => r !== null)
  }

  /** Seed endpoint — bulk insert with dedup. Returns counts only. */
  async seed<T = Record<string, unknown>>(
    collection: string,
    documents: T[],
    dedupOn: string[] = ["id"],
  ): Promise<{ inserted: number; skipped: number; errors: string[] }> {
    const res = await this.request<{ inserted: number; skipped: number; errors: string[] }>(
      `/api/v1/projects/${this.project}/seed`,
      { method: "POST", body: { collection, documents, dedupOn } },
    )
    return res
  }

  // -----------------------------------------------------------------------
  // Aggregations
  // -----------------------------------------------------------------------

  async aggregate<T = Record<string, unknown>>(
    collection: string,
    body: { groupBy?: string[]; aggregations: Array<{ op: string; field?: string; as: string }> },
  ): Promise<T[]> {
    const res = await this.request<{ results: T[] }>(
      `/api/v1/projects/${this.project}/collections/${collection}/aggregate`,
      { method: "POST", body },
    )
    return res.results ?? []
  }

  // -----------------------------------------------------------------------
  // Health (unauthenticated)
  // -----------------------------------------------------------------------

  async health(): Promise<{ status: string; version?: string; timestamp?: string }> {
    return this.request<{ status: string; version?: string; timestamp?: string }>(`/health`)
  }
}

/**
 * Singleton — initialised from process.env at module load. Null when
 * LIGHTBASE_API_KEY is unset, so callers can branch to the legacy
 * GitHub JSON backend for local dev.
 */
export const lightbaseClient: LightbaseClient | null = LightbaseClient.fromEnv()

export default LightbaseClient
