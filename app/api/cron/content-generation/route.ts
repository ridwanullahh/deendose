import { NextResponse } from 'next/server'
import { generateAndQueueContent } from '@/lib/services/content-pipeline'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Content generation cron job triggered')
    
    const generatedContent = await generateAndQueueContent()

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedContent.length} new content items`,
      data: {
        count: generatedContent.length,
        items: generatedContent.map(c => ({
          id: c.id,
          scheduledFor: c.scheduledFor,
          status: c.status
        }))
      }
    })
  } catch (error) {
    console.error('Content generation cron failed:', error)
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
