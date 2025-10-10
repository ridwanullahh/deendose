import { NextResponse } from 'next/server'
import { sdk } from '@/lib/sdk'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cronJobs = await sdk.get('cron-jobs').catch(() => [])
    
    const dailyPublishJob = cronJobs.find((j: any) => j.name === 'daily-publish')
    const contentGenerationJob = cronJobs.find((j: any) => j.name === 'content-generation')

    const now = Date.now()
    const oneDayMs = 24 * 60 * 60 * 1000
    const sixHoursMs = 6 * 60 * 60 * 1000

    const status = {
      overall: 'healthy',
      jobs: {
        dailyPublish: {
          name: 'Daily Publishing',
          status: 'unknown',
          lastRun: dailyPublishJob?.lastRun || null,
          nextRun: dailyPublishJob?.nextRun || null,
          lastStatus: dailyPublishJob?.lastStatus || 'never_run',
          timeSinceLastRun: dailyPublishJob?.lastRun 
            ? now - new Date(dailyPublishJob.lastRun).getTime()
            : null
        },
        contentGeneration: {
          name: 'Content Generation',
          status: 'unknown',
          lastRun: contentGenerationJob?.lastRun || null,
          nextRun: contentGenerationJob?.nextRun || null,
          lastStatus: contentGenerationJob?.lastStatus || 'never_run',
          timeSinceLastRun: contentGenerationJob?.lastRun
            ? now - new Date(contentGenerationJob.lastRun).getTime()
            : null
        }
      },
      warnings: [] as string[],
      errors: [] as string[]
    }

    if (dailyPublishJob?.lastRun) {
      const timeSince = now - new Date(dailyPublishJob.lastRun).getTime()
      if (timeSince > oneDayMs * 1.5) {
        status.errors.push('Daily publishing has not run in over 36 hours')
        status.jobs.dailyPublish.status = 'error'
        status.overall = 'unhealthy'
      } else if (timeSince > oneDayMs) {
        status.warnings.push('Daily publishing has not run in over 24 hours')
        status.jobs.dailyPublish.status = 'warning'
        if (status.overall === 'healthy') status.overall = 'degraded'
      } else {
        status.jobs.dailyPublish.status = 'healthy'
      }
    } else {
      status.warnings.push('Daily publishing has never run')
      status.jobs.dailyPublish.status = 'warning'
      if (status.overall === 'healthy') status.overall = 'degraded'
    }

    if (contentGenerationJob?.lastRun) {
      const timeSince = now - new Date(contentGenerationJob.lastRun).getTime()
      if (timeSince > sixHoursMs * 2) {
        status.warnings.push('Content generation has not run in over 12 hours')
        status.jobs.contentGeneration.status = 'warning'
        if (status.overall === 'healthy') status.overall = 'degraded'
      } else {
        status.jobs.contentGeneration.status = 'healthy'
      }
    } else {
      status.warnings.push('Content generation has never run')
      status.jobs.contentGeneration.status = 'warning'
      if (status.overall === 'healthy') status.overall = 'degraded'
    }

    if (dailyPublishJob?.lastStatus === 'failed' || contentGenerationJob?.lastStatus === 'failed') {
      status.errors.push('One or more cron jobs failed on last execution')
      status.overall = 'unhealthy'
    }

    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json({
      overall: 'error',
      error: (error as Error).message
    }, { status: 500 })
  }
}
