import axios from "axios"
import type { QueuedContent } from "@/lib/services/content-pipeline"

interface TwitterPublishResult {
  success: boolean
  postId?: string
  threadIds?: string[]
  error?: string
  timestamp: string
}

// Edge-compatible HMAC-SHA1 base64 signer using the Web Crypto API.
// (No Node `crypto` or `oauth-1.0a` dependency, so this runs in the
// Cloudflare Pages edge runtime.)
async function hmacSha1Base64(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret) as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message))
  const bytes = new Uint8Array(sig)
  let bin = ""
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return typeof btoa === "function" ? btoa(bin) : Buffer.from(bytes).toString("base64")
}

// RFC 3986 unreserved characters; everything else is percent-encoded.
function rfc3986Encode(input: string): string {
  return encodeURIComponent(input).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  )
}

// Minimal OAuth 1.0a header builder for the Twitter API.
async function buildOAuth1Header(opts: {
  method: string
  url: string
  params: Record<string, string>
  consumerKey: string
  consumerSecret: string
  token: string
  tokenSecret: string
}): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2)
  const allParams: Record<string, string> = {
    oauth_consumer_key: opts.consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: opts.token,
    oauth_version: "1.0",
    ...opts.params,
  }
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${rfc3986Encode(k)}=${rfc3986Encode(allParams[k])}`)
    .join("&")
  const baseUrl = opts.url.split("?")[0]
  const signingString = `${opts.method.toUpperCase()}&${rfc3986Encode(baseUrl)}&${rfc3986Encode(
    paramString,
  )}`
  const signingKey = `${rfc3986Encode(opts.consumerSecret)}&${rfc3986Encode(opts.tokenSecret)}`
  const signature = await hmacSha1Base64(signingKey, signingString)
  const headerParams: Record<string, string> = {
    oauth_consumer_key: opts.consumerKey,
    oauth_nonce: nonce,
    oauth_signature: signature,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: opts.token,
    oauth_version: "1.0",
  }
  const headerStr = Object.keys(headerParams)
    .sort()
    .map((k) => `${rfc3986Encode(k)}="${rfc3986Encode(headerParams[k])}"`)
    .join(", ")
  return `OAuth ${headerStr}`
}

export async function publishToTwitter(content: QueuedContent): Promise<TwitterPublishResult> {
  const startTime = new Date().toISOString()

  try {
    const apiKey = process.env.TWITTER_API_KEY
    const apiSecret = process.env.TWITTER_API_SECRET
    const accessToken = process.env.TWITTER_ACCESS_TOKEN
    const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      throw new Error("Twitter credentials not configured")
    }

    const threadTweets = formatTwitterThread(content)

    const threadIds: string[] = []
    let previousTweetId: string | undefined

    for (const tweet of threadTweets) {
      const tweetData: any = { text: tweet }
      if (previousTweetId) {
        tweetData.reply = { in_reply_to_tweet_id: previousTweetId }
      }
      const response = await postTweet(tweetData, {
        accessToken,
        accessTokenSecret,
        apiKey,
        apiSecret,
      })
      if (response.success && response.data?.id) {
        threadIds.push(response.data.id)
        previousTweetId = response.data.id
      } else {
        throw new Error(response.error || "Failed to post tweet")
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return {
      success: true,
      postId: threadIds[0],
      threadIds,
      timestamp: startTime,
    }
  } catch (error: any) {
    console.error("Twitter publishing failed:", error)
    return {
      success: false,
      error: error.message,
      timestamp: startTime,
    }
  }
}

function formatTwitterThread(content: QueuedContent): string[] {
  const { verse, hadith, tafseer } = content
  const tweets: string[] = []

  const tweet1 =
    `${verse.surah.englishName} ${verse.surah.number}:${verse.numberInSurah}\n\n` +
    `${verse.text}\n\n"${verse.translation}"\n\nThread:`
  tweets.push(truncateToTwitterLimit(tweet1))

  if (tafseer.keyPoints.length > 0) {
    const tweet2 = `Key Insights:\n\n${tafseer.keyPoints
      .slice(0, 2)
      .map((p, i) => `${i + 1}. ${p}`)
      .join("\n\n")}`
    tweets.push(truncateToTwitterLimit(tweet2))
  }

  if (hadith) {
    const tweet3 = `Related Hadith:\n\n"${hadith.translation}"\n\nReference: ${hadith.reference}`
    tweets.push(truncateToTwitterLimit(tweet3))
  }

  if (tafseer.practicalApplications.length > 0) {
    const tweet4 = `Apply this today:\n\n${tafseer.practicalApplications
      .slice(0, 2)
      .map((a) => `- ${a}`)
      .join("\n\n")}`
    tweets.push(truncateToTwitterLimit(tweet4))
  }

  const finalTweet = "#Islam #Quran #Hadith #DeenDose #IslamicQuotes #DailyIslam #MuslimCommunity #IslamicReminder #Iman #Taqwa"
  tweets.push(finalTweet)

  return tweets
}

function truncateToTwitterLimit(text: string, maxLength: number = 280): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + "..."
}

async function postTweet(
  tweetData: any,
  creds: { accessToken: string; accessTokenSecret: string; apiKey: string; apiSecret: string },
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const url = "https://api.twitter.com/2/tweets"
    const authHeader = await buildOAuth1Header({
      method: "POST",
      url,
      params: {},
      consumerKey: creds.apiKey,
      consumerSecret: creds.apiSecret,
      token: creds.accessToken,
      tokenSecret: creds.accessTokenSecret,
    })

    const response = await axios.post(url, tweetData, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    })

    return {
      success: true,
      data: response.data.data,
    }
  } catch (error: any) {
    console.error("Twitter API error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
    }
  }
}
