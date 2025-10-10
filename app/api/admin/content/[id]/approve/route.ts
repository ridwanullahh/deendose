import { NextResponse } from 'next/server'
import { approveContent } from '@/lib/services/content-pipeline'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await approveContent(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
