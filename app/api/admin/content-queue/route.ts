import { NextResponse } from 'next/server'
import { getContentQueue } from '@/lib/services/content-pipeline'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const queue = await getContentQueue()
    return NextResponse.json(queue)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
