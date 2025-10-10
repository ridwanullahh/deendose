import axios from 'axios'
import type { QueuedContent } from '@/lib/services/content-pipeline'

interface InstagramPublishResult {
  success: boolean
  postId?: string
  error?: string
  timestamp: string
}

export async function publishToInstagram(content: QueuedContent): Promise<InstagramPublishResult> {
  const startTime = new Date().toISOString()

  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
    const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID

    if (!accessToken || !businessAccountId) {
      throw new Error('Instagram credentials not configured')
    }

    const imageUrl = await generateInstagramImage(content)
    
    const caption = formatInstagramCaption(content)

    const createMediaResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${businessAccountId}/media`,
      {
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken
      }
    )

    const creationId = createMediaResponse.data.id

    await new Promise(resolve => setTimeout(resolve, 3000))

    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${businessAccountId}/media_publish`,
      {
        creation_id: creationId,
        access_token: accessToken
      }
    )

    return {
      success: true,
      postId: publishResponse.data.id,
      timestamp: startTime
    }
  } catch (error: any) {
    console.error('Instagram publishing failed:', error)
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      timestamp: startTime
    }
  }
}

function formatInstagramCaption(content: QueuedContent): string {
  const { verse, hadith, tafseer } = content

  let caption = `🕌 ${verse.surah.englishName} ${verse.surah.number}:${verse.numberInSurah}\n\n`
  
  caption += `"${verse.translation}"\n\n`
  
  caption += `💡 ${tafseer.summary.substring(0, 300)}${tafseer.summary.length > 300 ? '...' : ''}\n\n`
  
  if (hadith) {
    caption += `🔆 Related Hadith:\n"${hadith.translation.substring(0, 200)}${hadith.translation.length > 200 ? '...' : ''}"\n\n`
  }
  
  caption += `#Islam #Quran #Hadith #DeenDose #IslamicQuotes #DailyIslam #MuslimCommunity #IslamicReminder #IslamicArt #QuranVerses #ProphetMuhammad #Sunnah #Iman #Taqwa #Dua #IslamicPost`

  return caption
}

async function generateInstagramImage(content: QueuedContent): Promise<string> {
  const { generateInstagramImage: generateImage } = await import('@/lib/utils/image-generator')
  
  try {
    const result = await generateImage({
      verse: content.verse,
      template: 'classic',
      backgroundColor: '#2D5016',
      textColor: '#FFFFFF',
      accentColor: '#D4AF37'
    })
    
    return result.url
  } catch (error) {
    console.error('Failed to generate Instagram image:', error)
    return generateFallbackImageUrl(content)
  }
}

function generateFallbackImageUrl(content: QueuedContent): string {
  const { verse } = content
  const text = encodeURIComponent(`${verse.surah.englishName} ${verse.surah.number}:${verse.numberInSurah}`)
  return `https://placehold.co/1080x1080/2D5016/FFFFFF/png?text=${text}`
}

export async function refreshInstagramToken(): Promise<{ success: boolean; newToken?: string; error?: string }> {
  try {
    const currentToken = process.env.INSTAGRAM_ACCESS_TOKEN

    if (!currentToken) {
      throw new Error('Instagram access token not configured')
    }

    const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: process.env.FACEBOOK_APP_SECRET,
        access_token: currentToken
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
