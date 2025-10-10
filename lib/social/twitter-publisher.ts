import axios from 'axios'
import type { QueuedContent } from '@/lib/services/content-pipeline'

interface TwitterPublishResult {
  success: boolean
  postId?: string
  threadIds?: string[]
  error?: string
  timestamp: string
}

export async function publishToTwitter(content: QueuedContent): Promise<TwitterPublishResult> {
  const startTime = new Date().toISOString()

  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN
    const apiKey = process.env.TWITTER_API_KEY
    const apiSecret = process.env.TWITTER_API_SECRET
    const accessToken = process.env.TWITTER_ACCESS_TOKEN
    const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET

    if (!bearerToken || !apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      throw new Error('Twitter credentials not configured')
    }

    const threadTweets = formatTwitterThread(content)
    
    const threadIds: string[] = []
    let previousTweetId: string | undefined

    for (const tweet of threadTweets) {
      const tweetData: any = {
        text: tweet
      }

      if (previousTweetId) {
        tweetData.reply = {
          in_reply_to_tweet_id: previousTweetId
        }
      }

      const response = await postTweet(tweetData, accessToken, accessTokenSecret, apiKey, apiSecret)
      
      if (response.success && response.data?.id) {
        threadIds.push(response.data.id)
        previousTweetId = response.data.id
      } else {
        throw new Error(response.error || 'Failed to post tweet')
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return {
      success: true,
      postId: threadIds[0],
      threadIds,
      timestamp: startTime
    }
  } catch (error: any) {
    console.error('Twitter publishing failed:', error)
    return {
      success: false,
      error: error.message,
      timestamp: startTime
    }
  }
}

function formatTwitterThread(content: QueuedContent): string[] {
  const { verse, hadith, tafseer } = content
  const tweets: string[] = []

  const tweet1 = `🕌 ${verse.surah.englishName} ${verse.surah.number}:${verse.numberInSurah}\n\n${verse.text}\n\n"${verse.translation}"\n\n🧵 Thread ↓`
  tweets.push(truncateToTwitterLimit(tweet1))

  if (tafseer.keyPoints.length > 0) {
    const tweet2 = `💡 Key Insights:\n\n${tafseer.keyPoints.slice(0, 2).map((p, i) => `${i + 1}. ${p}`).join('\n\n')}`
    tweets.push(truncateToTwitterLimit(tweet2))
  }

  if (hadith) {
    const tweet3 = `🔆 Related Hadith:\n\n"${hadith.translation}"\n\n📚 ${hadith.reference}`
    tweets.push(truncateToTwitterLimit(tweet3))
  }

  if (tafseer.practicalApplications.length > 0) {
    const tweet4 = `🎯 Apply this today:\n\n${tafseer.practicalApplications.slice(0, 2).map(a => `• ${a}`).join('\n\n')}`
    tweets.push(truncateToTwitterLimit(tweet4))
  }

  const finalTweet = `#Islam #Quran #Hadith #DeenDose #IslamicQuotes #DailyIslam #MuslimCommunity #IslamicReminder #Iman #Taqwa`
  tweets.push(finalTweet)

  return tweets
}

function truncateToTwitterLimit(text: string, maxLength: number = 280): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength - 3) + '...'
}

async function postTweet(
  tweetData: any,
  accessToken: string,
  accessTokenSecret: string,
  apiKey: string,
  apiSecret: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const OAuth = require('oauth-1.0a')
    const crypto = require('crypto')

    const oauth = OAuth({
      consumer: { key: apiKey, secret: apiSecret },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string: string, key: string) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64')
      },
    })

    const requestData = {
      url: 'https://api.twitter.com/2/tweets',
      method: 'POST',
    }

    const token = {
      key: accessToken,
      secret: accessTokenSecret,
    }

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token))

    const response = await axios.post(
      'https://api.twitter.com/2/tweets',
      tweetData,
      {
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
      }
    )

    return {
      success: true,
      data: response.data.data
    }
  } catch (error: any) {
    console.error('Twitter API error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.detail || error.message
    }
  }
}
