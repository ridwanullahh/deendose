import { NextResponse } from 'next/server'
import { getQueueStats } from '@/lib/services/content-pipeline'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await getQueueStats()
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
