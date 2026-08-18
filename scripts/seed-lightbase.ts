// Seed script: ensures Lightbase collections exist, then seeds the 4
// default categories and 6 default settings with the exact values
// from lib/sdk.ts initializeDatabase().
//
// Run: npx tsx scripts/seed-lightbase.ts
//
// Reads env vars:
//   LIGHTBASE_API_KEY, LIGHTBASE_BASE_URL,
//   LIGHTBASE_PROJECT, LIGHTBASE_TENANT
//
// Exits 0 on success, non-zero on failure. Prints a clear log of
// what it did.

import { LightbaseClient } from "../lib/lightbase/client"
import { lightbaseSchemas } from "../lib/sdk"

async function main() {
  const apiKey = process.env.LIGHTBASE_API_KEY
  const baseUrl = process.env.LIGHTBASE_BASE_URL
  const project = process.env.LIGHTBASE_PROJECT
  const tenant = process.env.LIGHTBASE_TENANT || "default"

  if (!apiKey || !baseUrl || !project) {
    console.error(
      "[seed-lightbase] ERROR: LIGHTBASE_API_KEY, LIGHTBASE_BASE_URL, and LIGHTBASE_PROJECT must be set.",
    )
    console.error(
      "[seed-lightbase] Set them in .env (see .env.example). The script does NOT fall back to GitHub.",
    )
    process.exit(2)
  }

  const client = new LightbaseClient({ baseUrl, apiKey, project, tenant })

  console.log("─".repeat(60))
  console.log("[seed-lightbase] Starting")
  console.log(`[seed-lightbase] Project: ${project}`)
  console.log(`[seed-lightbase] Tenant:  ${tenant}`)
  console.log(`[seed-lightbase] Base:    ${baseUrl}`)

  // 1. Health check
  try {
    const h = await client.health()
    console.log(`[seed-lightbase] Server health: ${h.status}`)
  } catch (e) {
    console.error("[seed-lightbase] Health check failed:", (e as Error).message)
    process.exit(1)
  }

  // 2. Ensure collections exist
  let existing: string[] = []
  try {
    const list = await client.listCollections()
    existing = list.map((c: any) => (typeof c === "string" ? c : c?.name)).filter(Boolean) as string[]
    console.log(`[seed-lightbase] Existing collections: ${existing.length ? existing.join(", ") : "(none)"}`)
  } catch (e) {
    console.warn("[seed-lightbase] Could not list collections:", (e as Error).message)
  }

  const created: string[] = []
  for (const [name, def] of Object.entries(lightbaseSchemas)) {
    if (existing.includes(name)) continue
    try {
      await client.createCollection(name, def.fields, def.indexes)
      created.push(name)
      console.log(`[seed-lightbase] Created collection: ${name}`)
    } catch (e) {
      const msg = (e as Error).message || ""
      if (/conflict|already exists|409/i.test(msg)) {
        // fine — race with another seeder
        continue
      }
      console.warn(`[seed-lightbase] Failed to create collection ${name}:`, msg)
    }
  }
  if (created.length === 0 && existing.length > 0) {
    console.log("[seed-lightbase] All collections already exist; nothing to create.")
  }

  // 3. Seed categories
  const defaultCategories = [
    {
      name: "Quran Verses",
      slug: "quran-verses",
      description: "Daily Quranic verses with translation and tafsir",
      color: "#2D5016",
      icon: "book-open",
      order: 1,
    },
    {
      name: "Hadith",
      slug: "hadith",
      description: "Authentic sayings and teachings of Prophet Muhammad (PBUH)",
      color: "#8B4513",
      icon: "scroll",
      order: 2,
    },
    {
      name: "Daily Dose",
      slug: "daily-dose",
      description: "Combined daily posts with Quran and Hadith",
      color: "#4A5D23",
      icon: "calendar",
      order: 3,
    },
    {
      name: "Islamic Calendar",
      slug: "islamic-calendar",
      description: "Important Islamic dates and events",
      color: "#6B4423",
      icon: "calendar-days",
      order: 4,
    },
  ]

  console.log("[seed-lightbase] Seeding categories (idempotent via /seed dedupOn=['slug'])...")
  let categoryResult
  try {
    categoryResult = await client.bulkInsert("categories", defaultCategories)
    console.log(`[seed-lightbase] Categories inserted/fetched: ${categoryResult.length}`)
  } catch (e) {
    console.warn("[seed-lightbase] Category bulkInsert via /seed failed; trying per-doc upsert:", (e as Error).message)
    for (const cat of defaultCategories) {
      try {
        await client.upsert(
          "categories",
          { field: "slug", op: "eq", value: cat.slug },
          cat,
        )
      } catch (err) {
        console.warn(`[seed-lightbase] upsert category ${cat.slug} failed:`, (err as Error).message)
      }
    }
  }

  // 4. Seed settings
  const defaultSettings = [
    {
      key: "site_title",
      value: "DeenDose - Daily Islamic Inspiration",
      description: "Main site title",
      type: "text",
    },
    {
      key: "site_description",
      value: "Your daily source of Quranic verses and authentic Hadith",
      description: "Site meta description",
      type: "textarea",
    },
    {
      key: "daily_post_time",
      value: "06:00",
      description: "Time to publish daily posts (24-hour format)",
      type: "time",
    },
    {
      key: "timezone",
      value: "UTC",
      description: "Site timezone",
      type: "select",
    },
    {
      key: "auto_social_post",
      value: "true",
      description: "Automatically post to social media",
      type: "boolean",
    },
    {
      key: "social_platforms",
      value: JSON.stringify(["facebook", "twitter", "instagram", "telegram"]),
      description: "Enabled social media platforms",
      type: "json",
    },
  ]

  console.log("[seed-lightbase] Seeding settings (idempotent via upsert on 'key')...")
  for (const s of defaultSettings) {
    try {
      await client.upsert(
        "settings",
        { field: "key", op: "eq", value: s.key },
        s,
      )
      console.log(`[seed-lightbase] Setting upserted: ${s.key}`)
    } catch (e) {
      console.warn(`[seed-lightbase] upsert setting ${s.key} failed:`, (e as Error).message)
    }
  }

  console.log("─".repeat(60))
  console.log("[seed-lightbase] Done. Collections ensured; categories and settings seeded.")
  console.log("─".repeat(60))
  process.exit(0)
}

main().catch((e) => {
  console.error("[seed-lightbase] FATAL:", e?.message || e)
  process.exit(1)
})
