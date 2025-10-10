import { NextResponse } from 'next/server'
import { sdk } from '@/lib/sdk'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const webhookEvents = await sdk.get('webhook-events')
    const recentEvents = webhookEvents.filter((e: any) => 
      new Date(e.timestamp) >= cutoffDate
    )

    const platformStats: Record<string, any> = {}
    
    for (const event of recentEvents) {
      if (!platformStats[event.platform]) {
        platformStats[event.platform] = {
          platform: event.platform,
          posts: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0
        }
      }

      if (event.eventType === 'feed_event' || event.eventType === 'tweet' || event.eventType === 'media') {
        platformStats[event.platform].posts++
      } else if (event.eventType === 'reaction' || event.eventType === 'favorite') {
        platformStats[event.platform].likes++
      } else if (event.eventType === 'comment') {
        platformStats[event.platform].comments++
      }
    }

    const platforms = Object.values(platformStats)

    const timeSeriesData: Record<string, any> = {}
    for (const event of recentEvents) {
      const date = new Date(event.timestamp).toISOString().split('T')[0]
      
      if (!timeSeriesData[date]) {
        timeSeriesData[date] = { date, posts: 0, engagement: 0 }
      }

      if (event.eventType === 'feed_event' || event.eventType === 'tweet' || event.eventType === 'media') {
        timeSeriesData[date].posts++
      } else {
        timeSeriesData[date].engagement++
      }
    }

    const timeSeries = Object.values(timeSeriesData).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    )

    return NextResponse.json({
      platforms,
      timeSeries,
      summary: {
        totalPosts: platforms.reduce((sum, p: any) => sum + p.posts, 0),
        totalEngagement: platforms.reduce((sum, p: any) => sum + p.likes + p.comments + p.shares, 0)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
