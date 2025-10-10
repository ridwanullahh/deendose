import { NextResponse } from 'next/server'
import { generateAndQueueContent } from '@/lib/services/content-pipeline'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST() {
  try {
    const generated = await generateAndQueueContent()
    return NextResponse.json({ 
      success: true, 
      count: generated.length,
      data: generated 
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
