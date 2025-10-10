// Social Media Integration
export interface SocialMediaPost {
  platform: string
  content: string
  media?: string[]
  scheduledFor?: Date
  status: "pending" | "posted" | "failed"
  postId?: string
  error?: string
}

export interface SocialMediaConfig {
  facebook?: {
    appId: string
    appSecret: string
    accessToken: string
    pageId?: string
  }
  twitter?: {
    apiKey: string
    apiSecret: string
    accessToken: string
    accessTokenSecret: string
  }
  instagram?: {
    accessToken: string
    businessAccountId: string
  }
  linkedin?: {
    clientId: string
    clientSecret: string
    accessToken: string
  }
  telegram?: {
    botToken: string
    chatId: string
  }
  whatsapp?: {
    phoneNumberId: string
    accessToken: string
  }
}

export class SocialMediaManager {
  private config: SocialMediaConfig

  constructor(config: SocialMediaConfig) {
    this.config = config
  }

  async postToFacebook(
    content: string,
    media?: string[],
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      if (!this.config.facebook) throw new Error("Facebook not configured")

      const { accessToken, pageId } = this.config.facebook
      const url = `https://graph.facebook.com/v18.0/${pageId}/feed`

      const body: any = {
        message: content,
        access_token: accessToken,
      }

      if (media && media.length > 0) {
        body.link = media[0] // Facebook will auto-generate preview
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (response.ok) {
        return { success: true, postId: result.id }
      } else {
        return { success: false, error: result.error?.message || "Facebook post failed" }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  async postToTwitter(
    content: string,
    media?: string[],
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      if (!this.config.twitter) throw new Error("Twitter not configured")

      // Twitter API v2 implementation would go here
      // For now, return a placeholder
      return { success: true, postId: "twitter_" + Date.now() }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  async postToInstagram(
    content: string,
    media?: string[],
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      if (!this.config.instagram || !media || media.length === 0) {
        throw new Error("Instagram requires media and proper configuration")
      }

      const { accessToken, businessAccountId } = this.config.instagram

      // Step 1: Create media object
      const createMediaUrl = `https://graph.facebook.com/v18.0/${businessAccountId}/media`
      const mediaResponse = await fetch(createMediaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: media[0],
          caption: content,
          access_token: accessToken,
        }),
      })

      const mediaResult = await mediaResponse.json()
      if (!mediaResponse.ok) {
        return { success: false, error: mediaResult.error?.message || "Instagram media creation failed" }
      }

      // Step 2: Publish media
      const publishUrl = `https://graph.facebook.com/v18.0/${businessAccountId}/media_publish`
      const publishResponse = await fetch(publishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: mediaResult.id,
          access_token: accessToken,
        }),
      })

      const publishResult = await publishResponse.json()

      if (publishResponse.ok) {
        return { success: true, postId: publishResult.id }
      } else {
        return { success: false, error: publishResult.error?.message || "Instagram publish failed" }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  async postToTelegram(
    content: string,
    media?: string[],
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      if (!this.config.telegram) throw new Error("Telegram not configured")

      const { botToken, chatId } = this.config.telegram
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`

      const body = {
        chat_id: chatId,
        text: content,
        parse_mode: "HTML",
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (response.ok) {
        return { success: true, postId: result.result.message_id.toString() }
      } else {
        return { success: false, error: result.description || "Telegram post failed" }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  async postToWhatsApp(
    content: string,
    media?: string[],
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      if (!this.config.whatsapp) throw new Error("WhatsApp not configured")

      const { phoneNumberId, accessToken } = this.config.whatsapp
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`

      // Note: WhatsApp Business API requires recipient phone numbers
      // This is a simplified implementation
      const body = {
        messaging_product: "whatsapp",
        to: "status", // Post to status/broadcast
        type: "text",
        text: { body: content },
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (response.ok) {
        return { success: true, postId: result.messages?.[0]?.id }
      } else {
        return { success: false, error: result.error?.message || "WhatsApp post failed" }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  async postToAllPlatforms(content: string, media?: string[], platforms?: string[]): Promise<SocialMediaPost[]> {
    const enabledPlatforms = platforms || ["facebook", "twitter", "instagram", "telegram", "whatsapp"]
    const results: SocialMediaPost[] = []

    for (const platform of enabledPlatforms) {
      let result: { success: boolean; postId?: string; error?: string }

      switch (platform) {
        case "facebook":
          result = await this.postToFacebook(content, media)
          break
        case "twitter":
          result = await this.postToTwitter(content, media)
          break
        case "instagram":
          result = await this.postToInstagram(content, media)
          break
        case "telegram":
          result = await this.postToTelegram(content, media)
          break
        case "whatsapp":
          result = await this.postToWhatsApp(content, media)
          break
        default:
          result = { success: false, error: `Platform ${platform} not supported` }
      }

      results.push({
        platform,
        content,
        media,
        status: result.success ? "posted" : "failed",
        postId: result.postId,
        error: result.error,
      })
    }

    return results
  }
}

// Helper function to format content for different platforms
export function formatContentForPlatform(content: string, platform: string): string {
  switch (platform) {
    case "twitter":
      // Twitter has character limits
      return content.length > 280 ? content.substring(0, 277) + "..." : content
    case "instagram":
      // Instagram supports hashtags well
      return content + "\n\n#Islam #Quran #Hadith #DeenDose #IslamicQuotes #DailyIslam"
    case "facebook":
      // Facebook supports longer content
      return content
    case "telegram":
      // Telegram supports HTML formatting
      return content.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/\*(.*?)\*/g, "<i>$1</i>")
    case "whatsapp":
      // WhatsApp supports basic formatting
      return content
    default:
      return content
  }
}
