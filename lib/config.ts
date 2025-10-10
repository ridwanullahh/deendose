import { z } from 'zod'

const configSchema = z.object({
  // GitHub Database
  github: z.object({
    owner: z.string().min(1, 'GITHUB_OWNER is required'),
    repo: z.string().min(1, 'GITHUB_REPO is required'),
    token: z.string().min(1, 'GITHUB_TOKEN is required'),
    branch: z.string().default('main'),
  }),

  // Islamic Content APIs
  quran: z.object({
    apiKey: z.string().optional(),
    baseUrl: z.string().url().default('https://api.quran.com/api/v4'),
  }),

  hadith: z.object({
    apiKey: z.string().optional(),
    baseUrl: z.string().url().default('https://api.sunnah.com/v1'),
  }),

  // AI Configuration
  ai: z.object({
    geminiApiKey: z.string().min(1, 'GEMINI_API_KEY is required'),
    model: z.string().default('gemini-1.5-pro'),
    temperature: z.number().min(0).max(1).default(0.3),
    maxTokens: z.number().positive().default(2000),
    critiqueAgents: z.number().int().min(5).max(10).default(7),
  }),

  // Web Search
  search: z.object({
    enabled: z.boolean().default(true),
    serpApiKey: z.string().optional(),
    trustedSites: z.array(z.string()).default([
      'dorar.net',
      'islamqa.info',
      'islamweb.net',
      'dar-alifta.org',
      'binbaz.org.sa',
    ]),
  }),

  // Social Media Platforms
  facebook: z.object({
    appId: z.string().optional(),
    appSecret: z.string().optional(),
    accessToken: z.string().optional(),
    pageId: z.string().optional(),
  }).optional(),

  twitter: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    accessToken: z.string().optional(),
    accessTokenSecret: z.string().optional(),
    bearerToken: z.string().optional(),
  }).optional(),

  instagram: z.object({
    accessToken: z.string().optional(),
    businessAccountId: z.string().optional(),
  }).optional(),

  telegram: z.object({
    botToken: z.string().optional(),
    chatId: z.string().optional(),
  }).optional(),

  whatsapp: z.object({
    phoneNumberId: z.string().optional(),
    accessToken: z.string().optional(),
    broadcastListId: z.string().optional(),
  }).optional(),

  linkedin: z.object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    accessToken: z.string().optional(),
    personId: z.string().optional(),
    refreshToken: z.string().optional(),
  }).optional(),

  // Cloudinary
  cloudinary: z.object({
    cloudName: z.string().optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    uploadPreset: z.string().optional(),
  }).optional(),

  // Automation Settings
  automation: z.object({
    enabled: z.boolean().default(true),
    publishTime: z.string().regex(/^\d{2}:\d{2}$/).default('06:00'),
    timezone: z.string().default('UTC'),
    contentBufferDays: z.number().int().min(7).max(30).default(14),
    enabledPlatforms: z.array(z.enum([
      'facebook',
      'twitter',
      'instagram',
      'telegram',
      'whatsapp',
      'linkedin'
    ])).default(['facebook', 'twitter', 'telegram']),
  }),

  // Security
  security: z.object({
    cronSecret: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),
    adminSecret: z.string().optional(),
  }),

  // App Configuration
  app: z.object({
    url: z.string().url().optional(),
    name: z.string().default('DeenDose'),
  }),
})

export type AppConfig = z.infer<typeof configSchema>

function loadConfig(): AppConfig {
  const rawConfig = {
    github: {
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      token: process.env.GITHUB_TOKEN,
      branch: process.env.GITHUB_BRANCH || 'main',
    },
    quran: {
      apiKey: process.env.QURAN_API_KEY,
      baseUrl: process.env.QURAN_API_BASE_URL || 'https://api.quran.com/api/v4',
    },
    hadith: {
      apiKey: process.env.HADITH_API_KEY,
      baseUrl: process.env.HADITH_API_BASE_URL || 'https://api.sunnah.com/v1',
    },
    ai: {
      geminiApiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.3'),
      maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '2000'),
      critiqueAgents: parseInt(process.env.AI_CRITIQUE_AGENTS || '7'),
    },
    search: {
      enabled: process.env.WEB_SEARCH_ENABLED !== 'false',
      serpApiKey: process.env.SERP_API_KEY,
      trustedSites: process.env.TRUSTED_ISLAMIC_SITES?.split(',') || [
        'dorar.net',
        'islamqa.info',
        'islamweb.net',
        'dar-alifta.org',
        'binbaz.org.sa',
      ],
    },
    facebook: process.env.FACEBOOK_ACCESS_TOKEN ? {
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
      accessToken: process.env.FACEBOOK_ACCESS_TOKEN,
      pageId: process.env.FACEBOOK_PAGE_ID,
    } : undefined,
    twitter: process.env.TWITTER_BEARER_TOKEN ? {
      apiKey: process.env.TWITTER_API_KEY,
      apiSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      bearerToken: process.env.TWITTER_BEARER_TOKEN,
    } : undefined,
    instagram: process.env.INSTAGRAM_ACCESS_TOKEN ? {
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
      businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
    } : undefined,
    telegram: process.env.TELEGRAM_BOT_TOKEN ? {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
    } : undefined,
    whatsapp: process.env.WHATSAPP_ACCESS_TOKEN ? {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      broadcastListId: process.env.WHATSAPP_BROADCAST_LIST_ID,
    } : undefined,
    linkedin: process.env.LINKEDIN_ACCESS_TOKEN ? {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
      personId: process.env.LINKEDIN_PERSON_ID,
      refreshToken: process.env.LINKEDIN_REFRESH_TOKEN,
    } : undefined,
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
    } : undefined,
    automation: {
      enabled: process.env.AUTO_PUBLISH_ENABLED !== 'false',
      publishTime: process.env.DAILY_PUBLISH_TIME || '06:00',
      timezone: process.env.TIMEZONE || 'UTC',
      contentBufferDays: parseInt(process.env.CONTENT_BUFFER_DAYS || '14'),
      enabledPlatforms: process.env.SOCIAL_PLATFORMS?.split(',') as any || [
        'facebook',
        'twitter',
        'telegram',
      ],
    },
    security: {
      cronSecret: process.env.CRON_SECRET || '',
      adminSecret: process.env.ADMIN_SECRET,
    },
    app: {
      url: process.env.NEXT_PUBLIC_APP_URL,
      name: process.env.NEXT_PUBLIC_APP_NAME || 'DeenDose',
    },
  }

  try {
    return configSchema.parse(rawConfig)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n')
      
      throw new Error(
        `Configuration validation failed:\n${errorMessages}\n\n` +
        `Please check your environment variables in .env.local`
      )
    }
    throw error
  }
}

export const config = loadConfig()

export function validateConfig(): { valid: boolean; errors: string[] } {
  try {
    configSchema.parse(config)
    return { valid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return { valid: false, errors: ['Unknown validation error'] }
  }
}
