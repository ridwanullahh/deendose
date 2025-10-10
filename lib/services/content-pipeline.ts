import { sdk } from '@/lib/sdk'
import { fetchQuranVerse } from '@/lib/api/quran-api'
import { fetchHadith } from '@/lib/api/hadith-api'
import { validateWithMultiAgent } from '@/lib/ai/multi-agent-validator'
import { getCurrentHijriDate } from '@/lib/hijri-calendar'
import type { QuranVerse } from '@/lib/api/quran-api'
import type { Hadith } from '@/lib/api/hadith-api'
import type { TafseerSummary } from '@/lib/ai/multi-agent-validator'

export interface QueuedContent {
  id: string
  status: 'pending_review' | 'approved' | 'rejected' | 'published'
  verse: QuranVerse
  hadith?: Hadith
  tafseer: TafseerSummary
  scheduledFor: string
  createdAt: string
  approvedAt?: string
  publishedAt?: string
  rejectionReason?: string
  regenerationAttempts: number
  validationLog: any[]
}

const CONTENT_BUFFER_DAYS = parseInt(process.env.CONTENT_BUFFER_DAYS || '14')
const MAX_REGENERATION_ATTEMPTS = 3

export async function generateAndQueueContent(): Promise<QueuedContent[]> {
  const queue = await getContentQueue()
  const existingScheduled = queue.filter(c => c.status === 'approved' || c.status === 'pending_review')
  
  const daysNeeded = CONTENT_BUFFER_DAYS - existingScheduled.length
  const generatedContent: QueuedContent[] = []

  if (daysNeeded <= 0) {
    console.log(`Queue is full. ${existingScheduled.length} posts already scheduled.`)
    return generatedContent
  }

  console.log(`Generating ${daysNeeded} new posts to maintain ${CONTENT_BUFFER_DAYS}-day buffer`)

  const lastScheduledDate = existingScheduled.length > 0
    ? new Date(existingScheduled[existingScheduled.length - 1].scheduledFor)
    : new Date()

  for (let i = 0; i < daysNeeded; i++) {
    try {
      const scheduledDate = new Date(lastScheduledDate)
      scheduledDate.setDate(scheduledDate.getDate() + i + 1)
      scheduledDate.setHours(6, 0, 0, 0)

      const theme = selectDailyTheme(scheduledDate)
      
      console.log(`Generating content for ${scheduledDate.toISOString()} (Theme: ${theme})`)

      const verse = await fetchQuranVerse(theme as any)
      const hadith = await fetchHadith(theme as any)

      const validationResult = await validateWithMultiAgent(verse, hadith)

      if (!validationResult.approved) {
        console.warn(`Content validation failed for ${scheduledDate.toISOString()}. Will retry.`)
        
        let retryAttempt = 1
        let retrySuccess = false

        while (retryAttempt < MAX_REGENERATION_ATTEMPTS && !retrySuccess) {
          console.log(`Retry attempt ${retryAttempt} for ${scheduledDate.toISOString()}`)
          
          const retryVerse = await fetchQuranVerse()
          const retryHadith = await fetchHadith()
          const retryValidation = await validateWithMultiAgent(retryVerse, retryHadith)

          if (retryValidation.approved) {
            retrySuccess = true
            const content = await createQueuedContent(
              retryVerse,
              retryHadith,
              retryValidation.tafseer,
              scheduledDate,
              retryAttempt,
              retryValidation.validationChain
            )
            generatedContent.push(content)
            await saveToQueue(content)
          }
          
          retryAttempt++
        }

        if (!retrySuccess) {
          console.error(`Failed to generate valid content after ${MAX_REGENERATION_ATTEMPTS} attempts`)
          await logGenerationFailure(scheduledDate, validationResult.validationChain)
        }
        
        continue
      }

      const content = await createQueuedContent(
        verse,
        hadith,
        validationResult.tafseer,
        scheduledDate,
        0,
        validationResult.validationChain
      )
      
      generatedContent.push(content)
      await saveToQueue(content)

      console.log(`Successfully generated content for ${scheduledDate.toISOString()}`)

      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
      console.error(`Failed to generate content for day ${i + 1}:`, error)
      await logGenerationError(error as Error)
    }
  }

  return generatedContent
}

function selectDailyTheme(date: Date): string {
  const themes = [
    'TAWHEED', 'SALAH', 'CHARACTER', 'FAMILY', 
    'PATIENCE', 'GRATITUDE', 'FORGIVENESS', 'KNOWLEDGE'
  ]
  
  const hijriDate = getCurrentHijriDate(date)
  
  if (hijriDate.month === 9) {
    return 'RAMADAN'
  }
  
  if (hijriDate.month === 12) {
    return 'HAJJ'
  }
  
  const dayOfWeek = date.getDay()
  return themes[dayOfWeek % themes.length]
}

async function createQueuedContent(
  verse: QuranVerse,
  hadith: Hadith,
  tafseer: TafseerSummary,
  scheduledFor: Date,
  regenerationAttempts: number,
  validationLog: any[]
): Promise<QueuedContent> {
  return {
    id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending_review',
    verse,
    hadith,
    tafseer,
    scheduledFor: scheduledFor.toISOString(),
    createdAt: new Date().toISOString(),
    regenerationAttempts,
    validationLog
  }
}

async function saveToQueue(content: QueuedContent): Promise<void> {
  try {
    await sdk.insert('content-queue', content)
  } catch (error) {
    console.error('Failed to save content to queue:', error)
    throw error
  }
}

export async function getContentQueue(): Promise<QueuedContent[]> {
  try {
    const queue = await sdk.get('content-queue')
    return queue.sort((a: QueuedContent, b: QueuedContent) => 
      new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    )
  } catch (error) {
    console.error('Failed to get content queue:', error)
    return []
  }
}

export async function getNextApprovedContent(): Promise<QueuedContent | null> {
  const queue = await getContentQueue()
  const approved = queue.filter((c: QueuedContent) => c.status === 'approved')
  
  if (approved.length === 0) {
    return null
  }

  return approved.reduce((earliest: QueuedContent, current: QueuedContent) => {
    return new Date(current.scheduledFor) < new Date(earliest.scheduledFor) 
      ? current 
      : earliest
  })
}

export async function approveContent(contentId: string): Promise<void> {
  try {
    const queue = await sdk.get('content-queue')
    const content = queue.find((c: QueuedContent) => c.id === contentId)
    
    if (!content) {
      throw new Error('Content not found')
    }

    await sdk.update('content-queue', content.id, {
      status: 'approved',
      approvedAt: new Date().toISOString()
    })

    console.log(`Content ${contentId} approved`)
  } catch (error) {
    console.error('Failed to approve content:', error)
    throw error
  }
}

export async function rejectContent(contentId: string, reason: string): Promise<void> {
  try {
    const queue = await sdk.get('content-queue')
    const content = queue.find((c: QueuedContent) => c.id === contentId)
    
    if (!content) {
      throw new Error('Content not found')
    }

    await sdk.update('content-queue', content.id, {
      status: 'rejected',
      rejectionReason: reason
    })

    console.log(`Content ${contentId} rejected: ${reason}`)
  } catch (error) {
    console.error('Failed to reject content:', error)
    throw error
  }
}

export async function markContentAsPublished(contentId: string): Promise<void> {
  try {
    const queue = await sdk.get('content-queue')
    const content = queue.find((c: QueuedContent) => c.id === contentId)
    
    if (!content) {
      throw new Error('Content not found')
    }

    await sdk.update('content-queue', content.id, {
      status: 'published',
      publishedAt: new Date().toISOString()
    })

    console.log(`Content ${contentId} marked as published`)
  } catch (error) {
    console.error('Failed to mark content as published:', error)
    throw error
  }
}

export async function injectManualContent(
  verse: QuranVerse,
  hadith: Hadith,
  tafseer: TafseerSummary,
  scheduledFor: Date
): Promise<QueuedContent> {
  const content = await createQueuedContent(
    verse,
    hadith,
    tafseer,
    scheduledFor,
    0,
    [{ agent: 'Manual Injection', approved: true, feedback: 'Manually created by admin', timestamp: Date.now() }]
  )

  content.status = 'approved'
  content.approvedAt = new Date().toISOString()

  await saveToQueue(content)
  
  console.log(`Manual content injected for ${scheduledFor.toISOString()}`)
  
  return content
}

async function logGenerationFailure(date: Date, validationChain: any[]): Promise<void> {
  try {
    const errorLog = {
      type: 'generation_failure',
      scheduledFor: date.toISOString(),
      timestamp: new Date().toISOString(),
      validationChain,
      message: 'Failed to generate valid content after maximum retry attempts'
    }

    await sdk.insert('error-logs', errorLog)
  } catch (error) {
    console.error('Failed to log generation failure:', error)
  }
}

async function logGenerationError(error: Error): Promise<void> {
  try {
    const errorLog = {
      type: 'generation_error',
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }

    await sdk.insert('error-logs', errorLog)
  } catch (err) {
    console.error('Failed to log generation error:', err)
  }
}

export async function getQueueStats(): Promise<{
  total: number
  pending: number
  approved: number
  rejected: number
  published: number
  nextScheduled: string | null
  bufferDays: number
}> {
  const queue = await getContentQueue()
  
  const stats = {
    total: queue.length,
    pending: queue.filter((c: QueuedContent) => c.status === 'pending_review').length,
    approved: queue.filter((c: QueuedContent) => c.status === 'approved').length,
    rejected: queue.filter((c: QueuedContent) => c.status === 'rejected').length,
    published: queue.filter((c: QueuedContent) => c.status === 'published').length,
    nextScheduled: null as string | null,
    bufferDays: 0
  }

  const approved = queue.filter((c: QueuedContent) => c.status === 'approved')
  if (approved.length > 0) {
    stats.nextScheduled = approved[0].scheduledFor
    stats.bufferDays = approved.length
  }

  return stats
}
