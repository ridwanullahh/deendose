import { sdk } from '@/lib/sdk'
import { getNextApprovedContent, markContentAsPublished } from '@/lib/services/content-pipeline'
import { publishToFacebook } from '@/lib/social/facebook-publisher'
import { publishToTwitter } from '@/lib/social/twitter-publisher'
import { publishToInstagram } from '@/lib/social/instagram-publisher'
import { publishToTelegram, sendTelegramNotification } from '@/lib/social/telegram-publisher'
import { publishToWhatsApp } from '@/lib/social/whatsapp-publisher'
import { publishToLinkedIn } from '@/lib/social/linkedin-publisher'
import type { QueuedContent } from '@/lib/services/content-pipeline'

const AUTO_PUBLISH_ENABLED = process.env.AUTO_PUBLISH_ENABLED !== 'false'
const ENABLED_PLATFORMS = (process.env.SOCIAL_PLATFORMS || 'facebook,twitter,instagram,telegram,whatsapp,linkedin').split(',')

export interface PublishResult {
  platform: string
  success: boolean
  postId?: string
  error?: string
  timestamp: string
}

export interface DailyPublishResult {
  success: boolean
  contentId: string
  scheduledFor: string
  publishedAt: string
  results: PublishResult[]
  successCount: number
  failureCount: number
  errors: string[]
}

export async function executeDailyPublishing(): Promise<DailyPublishResult> {
  if (!AUTO_PUBLISH_ENABLED) {
    throw new Error('Automated publishing is disabled')
  }

  const content = await getNextApprovedContent()

  if (!content) {
    throw new Error('No approved content available in queue')
  }

  const now = new Date()
  const scheduledDate = new Date(content.scheduledFor)

  if (scheduledDate > now) {
    throw new Error(`Content is scheduled for future: ${content.scheduledFor}`)
  }

  console.log(`Publishing content ${content.id} scheduled for ${content.scheduledFor}`)

  const results: PublishResult[] = []
  const errors: string[] = []

  const publishers = getPlatformPublishers()

  for (const platform of ENABLED_PLATFORMS) {
    const publisher = publishers[platform]

    if (!publisher) {
      const error = `Platform ${platform} not supported`
      errors.push(error)
      results.push({
        platform,
        success: false,
        error,
        timestamp: new Date().toISOString()
      })
      continue
    }

    try {
      console.log(`Publishing to ${platform}...`)
      const result = await retryWithBackoff(() => publisher(content), 3)
      results.push({
        platform,
        ...result
      })

      if (!result.success) {
        errors.push(`${platform}: ${result.error}`)
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      const errorMsg = (error as Error).message
      errors.push(`${platform}: ${errorMsg}`)
      results.push({
        platform,
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString()
      })
    }
  }

  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length

  await markContentAsPublished(content.id)

  await savePublishingRecord(content, results)

  const overallSuccess = successCount > 0

  if (overallSuccess) {
    await sendSuccessNotification(content, results, successCount, failureCount)
  } else {
    await sendFailureNotification(content, errors)
  }

  return {
    success: overallSuccess,
    contentId: content.id,
    scheduledFor: content.scheduledFor,
    publishedAt: now.toISOString(),
    results,
    successCount,
    failureCount,
    errors
  }
}

function getPlatformPublishers(): Record<string, (content: QueuedContent) => Promise<any>> {
  return {
    facebook: publishToFacebook,
    twitter: publishToTwitter,
    instagram: publishToInstagram,
    telegram: publishToTelegram,
    whatsapp: publishToWhatsApp,
    linkedin: publishToLinkedIn
  }
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

async function savePublishingRecord(content: QueuedContent, results: PublishResult[]): Promise<void> {
  try {
    const record = {
      contentId: content.id,
      verseReference: `${content.verse.surah.englishName} ${content.verse.surah.number}:${content.verse.numberInSurah}`,
      scheduledFor: content.scheduledFor,
      publishedAt: new Date().toISOString(),
      platforms: results,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length
    }

    await sdk.insert('publishing-history', record)

    const posts = await sdk.get('posts')
    const existingPost = posts.find((p: any) => p.contentQueueId === content.id)

    if (existingPost) {
      await sdk.update('posts', existingPost.id, {
        status: 'published',
        publishedAt: new Date().toISOString(),
        socialMediaPosts: results
      })
    } else {
      await sdk.insert('posts', {
        contentQueueId: content.id,
        title: `${content.verse.surah.englishName} ${content.verse.surah.number}:${content.verse.numberInSurah}`,
        content: {
          quranVerse: {
            arabic: content.verse.text,
            translation: content.verse.translation,
            reference: `${content.verse.surah.englishName} ${content.verse.surah.number}:${content.verse.numberInSurah}`,
            tafsir: content.tafseer.summary
          },
          hadith: content.hadith ? {
            arabic: content.hadith.arabic,
            translation: content.hadith.translation,
            reference: content.hadith.reference,
            narrator: content.hadith.narrator
          } : undefined
        },
        type: 'daily-dose',
        status: 'published',
        publishedAt: new Date().toISOString(),
        category: 'daily-dose',
        socialMediaPosts: results,
        tags: ['daily', 'quran', 'hadith']
      })
    }
  } catch (error) {
    console.error('Failed to save publishing record:', error)
  }
}

async function sendSuccessNotification(
  content: QueuedContent,
  results: PublishResult[],
  successCount: number,
  failureCount: number
): Promise<void> {
  const message = `✅ Daily post published successfully!\n\n` +
    `📖 ${content.verse.surah.englishName} ${content.verse.surah.number}:${content.verse.numberInSurah}\n\n` +
    `✓ Successfully posted to ${successCount} platform(s)\n` +
    (failureCount > 0 ? `✗ Failed on ${failureCount} platform(s)\n\n` : '\n') +
    `Platform Status:\n` +
    results.map(r => `${r.success ? '✅' : '❌'} ${r.platform}: ${r.success ? 'Success' : r.error}`).join('\n')

  try {
    await sendTelegramNotification(message, 'HTML')
  } catch (error) {
    console.error('Failed to send success notification:', error)
  }
}

async function sendFailureNotification(content: QueuedContent, errors: string[]): Promise<void> {
  const message = `❌ Daily post publishing FAILED!\n\n` +
    `📖 ${content.verse.surah.englishName} ${content.verse.surah.number}:${content.verse.numberInSurah}\n\n` +
    `All platforms failed. Errors:\n` +
    errors.map(e => `• ${e}`).join('\n') +
    `\n\nPlease check the system immediately.`

  try {
    await sendTelegramNotification(message, 'HTML')
  } catch (error) {
    console.error('Failed to send failure notification:', error)
  }

  await logCriticalError('daily_publishing_failed', errors.join('; '))
}

async function logCriticalError(type: string, message: string): Promise<void> {
  try {
    await sdk.insert('error-logs', {
      type,
      severity: 'critical',
      message,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log critical error:', error)
  }
}

export async function getPublishingHistory(limit: number = 30): Promise<any[]> {
  try {
    const history = await sdk.get('publishing-history')
    return history
      .sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit)
  } catch (error) {
    console.error('Failed to get publishing history:', error)
    return []
  }
}

export async function getPublishingStats(): Promise<{
  total: number
  successful: number
  failed: number
  lastPublished: string | null
  platformSuccess: Record<string, { total: number; successful: number }>
}> {
  try {
    const history = await sdk.get('publishing-history')

    const stats = {
      total: history.length,
      successful: history.filter((h: any) => h.successCount > 0).length,
      failed: history.filter((h: any) => h.successCount === 0).length,
      lastPublished: history.length > 0 ? history[history.length - 1].publishedAt : null,
      platformSuccess: {} as Record<string, { total: number; successful: number }>
    }

    for (const record of history) {
      for (const platform of record.platforms) {
        if (!stats.platformSuccess[platform.platform]) {
          stats.platformSuccess[platform.platform] = { total: 0, successful: 0 }
        }
        stats.platformSuccess[platform.platform].total++
        if (platform.success) {
          stats.platformSuccess[platform.platform].successful++
        }
      }
    }

    return stats
  } catch (error) {
    console.error('Failed to get publishing stats:', error)
    return {
      total: 0,
      successful: 0,
      failed: 0,
      lastPublished: null,
      platformSuccess: {}
    }
  }
}
