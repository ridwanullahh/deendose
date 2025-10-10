import axios from 'axios'
import type { QueuedContent } from '@/lib/services/content-pipeline'

interface FacebookPublishResult {
  success: boolean
  postId?: string
  error?: string
  timestamp: string
}

export async function publishToFacebook(content: QueuedContent): Promise<FacebookPublishResult> {
  const startTime = new Date().toISOString()

  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN
    const pageId = process.env.FACEBOOK_PAGE_ID

    if (!accessToken || !pageId) {
      throw new Error('Facebook credentials not configured')
    }

    const formattedContent = formatFacebookContent(content)

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        message: formattedContent,
        access_token: accessToken
      }
    )

    return {
      success: true,
      postId: response.data.id,
      timestamp: startTime
    }
  } catch (error: any) {
    console.error('Facebook publishing failed:', error)
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      timestamp: startTime
    }
  }
}

function formatFacebookContent(content: QueuedContent): string {
  const { verse, hadith, tafseer } = content

  let post = `🕌 Daily Islamic Inspiration\n\n`
  
  post += `📖 ${verse.surah.englishName} (${verse.surah.number}:${verse.numberInSurah})\n\n`
  
  post += `${verse.text}\n\n`
  
  post += `📝 Translation:\n${verse.translation}\n\n`
  
  post += `💡 Key Insights:\n`
  tafseer.keyPoints.slice(0, 3).forEach((point, index) => {
    post += `${index + 1}. ${point}\n`
  })
  post += `\n`
  
  if (hadith) {
    post += `🔆 Related Hadith:\n${hadith.translation}\n`
    post += `📚 ${hadith.reference}\n\n`
  }
  
  post += `🎯 Practical Applications:\n`
  tafseer.practicalApplications.slice(0, 2).forEach((app, index) => {
    post += `• ${app}\n`
  })
  post += `\n`
  
  if (tafseer.sources.length > 0) {
    post += `📚 Sources: ${tafseer.sources.join(', ')}\n\n`
  }
  
  post += `#Islam #Quran #Hadith #DeenDose #IslamicQuotes #DailyIslam #MuslimCommunity #IslamicReminder`

  return post
}

export async function refreshFacebookToken(): Promise<{ success: boolean; newToken?: string; error?: string }> {
  try {
    const currentToken = process.env.FACEBOOK_ACCESS_TOKEN
    const appId = process.env.FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET

    if (!currentToken || !appId || !appSecret) {
      throw new Error('Facebook credentials incomplete')
    }

    const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: currentToken
      }
    })

    return {
      success: true,
      newToken: response.data.access_token
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    }
  }
}
