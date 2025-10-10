import { NextResponse } from 'next/server'
import { sdk } from '@/lib/sdk'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 'deendose_verify_token'

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

        if (field === 'feed') {
          await handleFeedEvent(value)
        } else if (field === 'comments') {
          await handleCommentEvent(value)
        } else if (field === 'reactions') {
          await handleReactionEvent(value)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Facebook webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleFeedEvent(value: any) {
  const event = {
    platform: 'facebook',
    eventType: 'feed_event',
    postId: value.post_id,
    data: {
      verb: value.verb,
      item: value.item,
      senderId: value.sender_id,
      created: value.created_time
    },
    timestamp: new Date().toISOString()
  }

  await sdk.insert('webhook-events', event)

  if (value.verb === 'add' && value.item === 'post') {
    console.log(`Facebook post published: ${value.post_id}`)
  }
}

async function handleCommentEvent(value: any) {
  const event = {
    platform: 'facebook',
    eventType: 'comment',
    postId: value.post_id,
    data: {
      commentId: value.comment_id,
      message: value.message,
      from: value.from,
      created: value.created_time
    },
    timestamp: new Date().toISOString()
  }

  await sdk.insert('webhook-events', event)

  const posts = await sdk.get('posts')
  const post = posts.find((p: any) => 
    p.socialMediaPosts?.some((smp: any) => smp.postId === value.post_id)
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

async function handleReactionEvent(value: any) {
  const event = {
    platform: 'facebook',
    eventType: 'reaction',
    postId: value.post_id,
    data: {
      reactionType: value.reaction_type,
      from: value.from,
      created: value.created_time
    },
    timestamp: new Date().toISOString()
  }

  await sdk.insert('webhook-events', event)

  const posts = await sdk.get('posts')
  const post = posts.find((p: any) => 
    p.socialMediaPosts?.some((smp: any) => smp.postId === value.post_id)
  )

  if (post) {
    const currentEngagement = post.engagement || { comments: 0, likes: 0, shares: 0 }
    await sdk.update('posts', post.id, {
      engagement: {
        ...currentEngagement,
        likes: currentEngagement.likes + 1
      }
    })
  }
}
