import { NextResponse } from "next/server"
import { sdk } from "@/lib/sdk"

export const runtime = "edge"
export const dynamic = "force-dynamic"

// Edge-compatible HMAC-SHA256 base64 using the Web Crypto API.
// (Replaces Node's crypto.createHmac so this route runs in the
// Cloudflare Pages edge runtime.)
async function hmacSha256Base64(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret) as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message))
  // base64 encode
  const bytes = new Uint8Array(sig)
  let bin = ""
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return typeof btoa === "function" ? btoa(bin) : Buffer.from(bytes).toString("base64")
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const crc_token = searchParams.get("crc_token")

  if (!crc_token) {
    return NextResponse.json({ error: "No CRC token" }, { status: 400 })
  }

  const consumer_secret = process.env.TWITTER_API_SECRET || ""
  const response_token = "sha256=" + (await hmacSha256Base64(consumer_secret, crc_token))

  return NextResponse.json({ response_token })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.tweet_create_events) {
      for (const tweet of body.tweet_create_events) {
        await handleTweetEvent(tweet)
      }
    }

    if (body.favorite_events) {
      for (const favorite of body.favorite_events) {
        await handleFavoriteEvent(favorite)
      }
    }

    if (body.follow_events) {
      for (const follow of body.follow_events) {
        await handleFollowEvent(follow)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Twitter webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleTweetEvent(tweet: any) {
  const event = {
    platform: "twitter",
    eventType: "tweet",
    postId: tweet.id_str,
    data: {
      text: tweet.text,
      userId: tweet.user.id_str,
      username: tweet.user.screen_name,
      created: tweet.created_at,
      retweetCount: tweet.retweet_count,
      favoriteCount: tweet.favorite_count,
    },
    timestamp: new Date().toISOString(),
  }

  await sdk.insert("webhook-events", event)
}

async function handleFavoriteEvent(favorite: any) {
  const event = {
    platform: "twitter",
    eventType: "favorite",
    postId: favorite.favorited_status.id_str,
    data: {
      userId: favorite.user.id_str,
      username: favorite.user.screen_name,
      created: favorite.created_at,
    },
    timestamp: new Date().toISOString(),
  }

  await sdk.insert("webhook-events", event)

  const posts = await sdk.get("posts")
  const post = posts.find((p: any) =>
    p.socialMediaPosts?.some((smp: any) => smp.postId === favorite.favorited_status.id_str),
  )

  if (post) {
    const currentEngagement = post.engagement || { comments: 0, likes: 0, shares: 0 }
    await sdk.update("posts", post.id, {
      engagement: {
        ...currentEngagement,
        likes: currentEngagement.likes + 1,
      },
    })
  }
}

async function handleFollowEvent(follow: any) {
  const event = {
    platform: "twitter",
    eventType: "follow",
    postId: null,
    data: {
      follower: follow.source.id_str,
      following: follow.target.id_str,
      created: follow.created_at,
    },
    timestamp: new Date().toISOString(),
  }

  await sdk.insert("webhook-events", event)
}
