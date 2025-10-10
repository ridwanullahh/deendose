import UniversalSDK, { type UniversalSDKConfig } from "./universal-sdk"

// SDK Configuration
const sdkConfig: UniversalSDKConfig = {
  owner: process.env.GITHUB_OWNER!,
  repo: process.env.GITHUB_REPO!,
  token: process.env.GITHUB_TOKEN!,
  branch: process.env.GITHUB_BRANCH || "main",
  basePath: "db",
  mediaPath: "media",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  smtp: {
    endpoint: process.env.SMTP_ENDPOINT,
    from: process.env.SMTP_FROM,
  },
  templates: {
    otp: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2D5016; margin: 0;">DeenDose</h1>
          <p style="color: #666; margin: 5px 0;">Daily Islamic Inspiration</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h2 style="color: #2D5016; margin-bottom: 20px;">Verification Code</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #2D5016; letter-spacing: 5px;">{{otp}}</span>
          </div>
          <p style="color: #666; margin-top: 20px;">This code will expire in 10 minutes.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
          <p>Barakallahu feeki - May Allah bless you</p>
        </div>
      </div>
    `,
    welcome: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2D5016; margin: 0;">Welcome to DeenDose</h1>
          <p style="color: #666; margin: 5px 0;">Your Daily Islamic Inspiration</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #2D5016; margin-bottom: 20px;">Assalamu Alaikum {{name}}!</h2>
          <p style="color: #333; line-height: 1.6;">
            Welcome to DeenDose, your daily source of Quranic verses and authentic Hadith. 
            May Allah bless your journey of seeking knowledge and spiritual growth.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{appUrl}}" style="background: #2D5016; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Start Your Journey
            </a>
          </div>
        </div>
      </div>
    `,
  },
  schemas: {
    users: {
      required: ["email"],
      types: {
        email: "string",
        name: "string",
        avatar: "string",
        role: "string",
        preferences: "object",
        verified: "boolean",
        createdAt: "date",
        lastLogin: "date",
      },
      defaults: {
        role: "user",
        verified: false,
        preferences: {
          language: "en",
          notifications: true,
          dailyReminder: true,
          timezone: "UTC",
        },
        createdAt: new Date().toISOString(),
      },
    },
    posts: {
      required: ["title", "content", "type", "status"],
      types: {
        title: "string",
        content: "object",
        type: "string",
        status: "string",
        scheduledFor: "date",
        publishedAt: "date",
        author: "string",
        tags: "array",
        category: "string",
        hijriDate: "object",
        socialMediaPosts: "array",
        views: "number",
        likes: "number",
        shares: "number",
      },
      defaults: {
        status: "draft",
        views: 0,
        likes: 0,
        shares: 0,
        tags: [],
        socialMediaPosts: [],
        createdAt: new Date().toISOString(),
      },
    },
    "content-queue": {
      required: ["verse", "status", "scheduledFor"],
      types: {
        verse: "object",
        hadith: "object",
        tafseer: "object",
        status: "string",
        scheduledFor: "date",
        createdAt: "date",
        approvedAt: "date",
        publishedAt: "date",
        rejectionReason: "string",
        regenerationAttempts: "number",
        validationLog: "array",
      },
      defaults: {
        status: "pending_review",
        regenerationAttempts: 0,
        validationLog: [],
        createdAt: new Date().toISOString(),
      },
    },
    "api-cache": {
      required: ["key", "value"],
      types: {
        key: "string",
        value: "object",
        ttl: "number",
        timestamp: "date",
      },
      defaults: {
        timestamp: new Date().toISOString(),
      },
    },
    "ai-validation-logs": {
      required: ["verseReference", "timestamp"],
      types: {
        verseReference: "string",
        timestamp: "date",
        approved: "boolean",
        validationChain: "array",
        totalAgents: "number",
        approvedAgents: "number",
        rejectedAgents: "number",
      },
    },
    "publishing-history": {
      required: ["contentId", "publishedAt"],
      types: {
        contentId: "string",
        verseReference: "string",
        scheduledFor: "date",
        publishedAt: "date",
        platforms: "array",
        successCount: "number",
        failureCount: "number",
      },
    },
    "cron-jobs": {
      required: ["name"],
      types: {
        name: "string",
        lastRun: "date",
        nextRun: "date",
        lastStatus: "string",
        errors: "array",
      },
    },
    "error-logs": {
      required: ["type", "timestamp"],
      types: {
        type: "string",
        severity: "string",
        message: "string",
        timestamp: "date",
        stack: "string",
      },
    },
    "admin-audit-logs": {
      required: ["action", "timestamp"],
      types: {
        action: "string",
        userId: "string",
        timestamp: "date",
        data: "object",
      },
    },
    "image-cache": {
      required: ["verseReference", "imageUrl"],
      types: {
        verseReference: "string",
        imageUrl: "string",
        publicId: "string",
        generatedAt: "date",
        template: "string",
      },
      defaults: {
        generatedAt: new Date().toISOString(),
        template: "classic",
      },
    },
    "oauth-tokens": {
      required: ["platform", "accessToken"],
      types: {
        platform: "string",
        accessToken: "string",
        refreshToken: "string",
        expiresAt: "date",
        scope: "string",
        userId: "string",
      },
    },
    "webhook-events": {
      required: ["platform", "eventType", "timestamp"],
      types: {
        platform: "string",
        eventType: "string",
        postId: "string",
        data: "object",
        timestamp: "date",
      },
    },
    schedules: {
      required: ["postId", "scheduledFor", "platforms"],
      types: {
        postId: "string",
        scheduledFor: "date",
        platforms: "array",
        status: "string",
        attempts: "number",
        lastAttempt: "date",
        errors: "array",
      },
      defaults: {
        status: "pending",
        attempts: 0,
        errors: [],
      },
    },
    categories: {
      required: ["name", "slug"],
      types: {
        name: "string",
        slug: "string",
        description: "string",
        color: "string",
        icon: "string",
        order: "number",
      },
      defaults: {
        order: 0,
        color: "#2D5016",
      },
    },
    settings: {
      required: ["key", "value"],
      types: {
        key: "string",
        value: "string",
        description: "string",
        type: "string",
      },
    },
  },
  auth: {
    requireEmailVerification: true,
    otpTriggers: ["register", "login"],
  },
}

// Initialize SDK
export const sdk = new UniversalSDK(sdkConfig)

// Initialize schemas and default data
export async function initializeDatabase() {
  try {
    // Check if categories exist, if not create default ones
    const categories = await sdk.get("categories")
    if (categories.length === 0) {
      await sdk.bulkInsert("categories", [
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
      ])
    }

    // Initialize default settings
    const settings = await sdk.get("settings")
    if (settings.length === 0) {
      await sdk.bulkInsert("settings", [
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
      ])
    }

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Database initialization error:", error)
  }
}

// Helper functions
export async function getSetting(key: string): Promise<string | null> {
  const settings = await sdk.get("settings")
  const setting = settings.find((s: any) => s.key === key)
  return setting?.value || null
}

export async function setSetting(key: string, value: string): Promise<void> {
  const settings = await sdk.get("settings")
  const existingIndex = settings.findIndex((s: any) => s.key === key)

  if (existingIndex >= 0) {
    await sdk.update("settings", settings[existingIndex].id, { value })
  } else {
    await sdk.insert("settings", { key, value })
  }
}

export default sdk
