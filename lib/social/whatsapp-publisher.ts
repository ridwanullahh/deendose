import axios from 'axios'
import type { QueuedContent } from '@/lib/services/content-pipeline'

interface WhatsAppPublishResult {
  success: boolean
  postId?: string
  error?: string
  timestamp: string
}

export async function publishToWhatsApp(content: QueuedContent): Promise<WhatsAppPublishResult> {
  const startTime = new Date().toISOString()

  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const broadcastListId = process.env.WHATSAPP_BROADCAST_LIST_ID

    if (!accessToken || !phoneNumberId) {
      throw new Error('WhatsApp credentials not configured')
    }

    const formattedContent = formatWhatsAppContent(content)

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: broadcastListId || 'status',
        type: 'text',
        text: {
          body: formattedContent
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.data.messages && response.data.messages.length > 0) {
      return {
        success: true,
        postId: response.data.messages[0].id,
        timestamp: startTime
      }
    } else {
      throw new Error('No message ID returned from WhatsApp API')
    }
  } catch (error: any) {
    console.error('WhatsApp publishing failed:', error)
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      timestamp: startTime
    }
  }
}

function formatWhatsAppContent(content: QueuedContent): string {
  const { verse, hadith, tafseer } = content

  let message = `🕌 *Daily Islamic Inspiration*\n\n`
  
  message += `📖 *${verse.surah.englishName} ${verse.surah.number}:${verse.numberInSurah}*\n\n`
  
  message += `${verse.text}\n\n`
  
  message += `📝 *Translation:*\n${verse.translation}\n\n`
  
  message += `💡 *Key Insights:*\n`
  tafseer.keyPoints.slice(0, 3).forEach((point, index) => {
    message += `${index + 1}. ${point}\n`
  })
  message += `\n`
  
  if (hadith) {
    message += `🔆 *Related Hadith:*\n${hadith.translation}\n`
    message += `📚 ${hadith.reference}\n\n`
  }
  
  message += `🎯 *Practical Applications:*\n`
  tafseer.practicalApplications.slice(0, 2).forEach((app) => {
    message += `• ${app}\n`
  })
  message += `\n`
  
  if (tafseer.sources.length > 0) {
    message += `📚 *Sources:* ${tafseer.sources.join(', ')}\n\n`
  }
  
  message += `_May Allah grant us understanding and the ability to implement these teachings._\n\n`
  
  message += `#Islam #Quran #Hadith #DeenDose`

  return message
}

export async function sendWhatsAppNotification(
  message: string,
  recipients?: string[]
): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!accessToken || !phoneNumberId) {
    return { success: false, sentCount: 0, errors: ['WhatsApp credentials not configured'] }
  }

  const errors: string[] = []
  let sentCount = 0

  const targets = recipients || [process.env.WHATSAPP_BROADCAST_LIST_ID || 'status']

  for (const recipient of targets) {
    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      sentCount++
    } catch (error: any) {
      errors.push(`Failed to send to ${recipient}: ${error.message}`)
    }
  }

  return {
    success: sentCount > 0,
    sentCount,
    errors
  }
}
