import { NextResponse } from 'next/server'
import { executeDailyPublishing } from '@/lib/services/auto-publisher'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const result = await executeDailyPublishing()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
