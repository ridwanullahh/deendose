import { NextResponse } from 'next/server'
import { sdk } from '@/lib/sdk'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'deendose_verify_token'

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const { field, value } = change

        if (field === 'comments') {
          await handleCommentEvent(value)
        } else if (field === 'mentions') {
          await handleMentionEvent(value)
        } else if (field === 'media') {
          await handleMediaEvent(value)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Instagram webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCommentEvent(value: any) {
  const event = {
    platform: 'instagram',
    eventType: 'comment',
    postId: value.media_id,
    data: {
      commentId: value.id,
      text: value.text,
      from: value.from,
      timestamp: value.timestamp
    },
    timestamp: new Date().toISOString()
  }

  await sdk.insert('webhook-events', event)

  const posts = await sdk.get('posts')
  const post = posts.find((p: any) => 
    p.socialMediaPosts?.some((smp: any) => smp.postId === value.media_id)
  )

  if (post) {
    const currentEngagement = post.engagement || { comments: 0, likes: 0, shares: 0 }
    await sdk.update('posts', post.id, {
      engagement: {
        ...currentEngagement,
        comments: currentEngagement.comments + 1
      }
    })
  }
}

async function handleMentionEvent(value: any) {
  const event = {
    platform: 'instagram',
    eventType: 'mention',
    postId: value.media_id,
    data: {
      commentId: value.comment_id,
      from: value.from,
      timestamp: value.timestamp
    },
    timestamp: new Date().toISOString()
  }

  await sdk.insert('webhook-events', event)
}

async function handleMediaEvent(value: any) {
  const event = {
    platform: 'instagram',
    eventType: 'media',
    postId: value.media_id,
    data: {
      mediaType: value.media_type,
      caption: value.caption,
      timestamp: value.timestamp
    },
    timestamp: new Date().toISOString()
  }

  await sdk.insert('webhook-events', event)
}
