import { NextResponse } from 'next/server'
import { executeDailyPublishing } from '@/lib/services/auto-publisher'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Daily publishing cron job triggered')
    
    const result = await executeDailyPublishing()

    return NextResponse.json({
      success: true,
      message: 'Daily publishing completed',
      data: result
    })
  } catch (error) {
    console.error('Daily publishing cron failed:', error)
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
