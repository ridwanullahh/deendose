import { NextResponse } from 'next/server'
import { getPublishingStats } from '@/lib/services/auto-publisher'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await getPublishingStats()
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
