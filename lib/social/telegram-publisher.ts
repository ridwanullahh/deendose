import axios from 'axios'
import type { QueuedContent } from '@/lib/services/content-pipeline'

interface TelegramPublishResult {
  success: boolean
  postId?: string
  error?: string
  timestamp: string
}

export async function publishToTelegram(content: QueuedContent): Promise<TelegramPublishResult> {
  const startTime = new Date().toISOString()

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!botToken || !chatId) {
      throw new Error('Telegram credentials not configured')
    }

    const formattedContent = formatTelegramContent(content)

    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: formattedContent,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      }
    )

    if (response.data.ok) {
      return {
        success: true,
        postId: response.data.result.message_id.toString(),
        timestamp: startTime
      }
    } else {
      throw new Error(response.data.description || 'Telegram API returned not ok')
    }
  } catch (error: any) {
    console.error('Telegram publishing failed:', error)
    return {
      success: false,
      error: error.response?.data?.description || error.message,
      timestamp: startTime
    }
  }
}

function formatTelegramContent(content: QueuedContent): string {
  const { verse, hadith, tafseer } = content

  let message = `🕌 <b>Daily Islamic Inspiration</b>\n\n`
  
  message += `📖 <b>${verse.surah.englishName} ${verse.surah.number}:${verse.numberInSurah}</b>\n\n`
  
  message += `<i>${verse.text}</i>\n\n`
  
  message += `📝 <b>Translation:</b>\n${verse.translation}\n\n`
  
  message += `💡 <b>Key Insights:</b>\n`
  tafseer.keyPoints.slice(0, 3).forEach((point, index) => {
    message += `${index + 1}. ${point}\n`
  })
  message += `\n`
  
  if (hadith) {
    message += `🔆 <b>Related Hadith:</b>\n<i>${hadith.translation}</i>\n`
    message += `📚 ${hadith.reference}\n\n`
  }
  
  message += `🎯 <b>Practical Applications:</b>\n`
  tafseer.practicalApplications.slice(0, 2).forEach((app) => {
    message += `• ${app}\n`
  })
  message += `\n`
  
  if (tafseer.sources.length > 0) {
    message += `📚 <b>Sources:</b> ${tafseer.sources.join(', ')}\n\n`
  }
  
  if (verse.audio) {
    message += `🔊 <a href="${verse.audio}">Listen to Recitation</a>\n\n`
  }
  
  message += `#Islam #Quran #Hadith #DeenDose #IslamicReminder`

  return message
}

export async function sendTelegramNotification(
  message: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<boolean> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!botToken || !chatId) {
      return false
    }

    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: parseMode
      }
    )

    return response.data.ok
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
    return false
  }
}
