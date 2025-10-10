import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const platforms = [
    {
      platform: 'facebook',
      connected: !!process.env.FACEBOOK_ACCESS_TOKEN,
      tokenExpiry: null,
      lastChecked: new Date().toISOString(),
      scope: 'pages_manage_posts,pages_read_engagement'
    },
    {
      platform: 'twitter',
      connected: !!process.env.TWITTER_BEARER_TOKEN,
      tokenExpiry: null,
      lastChecked: new Date().toISOString(),
      scope: 'tweet.read,tweet.write,users.read'
    },
    {
      platform: 'instagram',
      connected: !!process.env.INSTAGRAM_ACCESS_TOKEN,
      tokenExpiry: null,
      lastChecked: new Date().toISOString(),
      scope: 'instagram_basic,instagram_content_publish'
    },
    {
      platform: 'telegram',
      connected: !!process.env.TELEGRAM_BOT_TOKEN,
      tokenExpiry: null,
      lastChecked: new Date().toISOString(),
      scope: 'bot'
    },
    {
      platform: 'whatsapp',
      connected: !!process.env.WHATSAPP_ACCESS_TOKEN,
      tokenExpiry: null,
      lastChecked: new Date().toISOString(),
      scope: 'whatsapp_business_messaging'
    },
    {
      platform: 'linkedin',
      connected: !!process.env.LINKEDIN_ACCESS_TOKEN,
      tokenExpiry: null,
      lastChecked: new Date().toISOString(),
      scope: 'w_member_social'
    }
  ]

  return NextResponse.json({ platforms })
}
