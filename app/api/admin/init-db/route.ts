import { NextResponse } from 'next/server'
import { sdk, initializeDatabase } from '@/lib/sdk'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Initialize database with default data
    await initializeDatabase()

    // Check if collections exist and are accessible
    const collections = [
      'users',
      'posts',
      'categories',
      'settings',
      'content-queue',
      'api-cache',
      'ai-validation-logs',
      'publishing-history',
      'cron-jobs',
      'error-logs',
      'admin-audit-logs',
    ]

    const status: Record<string, any> = {}

    for (const collection of collections) {
      try {
        const data = await sdk.get(collection)
        status[collection] = {
          initialized: true,
          count: Array.isArray(data) ? data.length : 0
        }
      } catch (error) {
        status[collection] = {
          initialized: false,
          error: (error as Error).message
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      status
    })
  } catch (error) {
    console.error('Database initialization failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}
