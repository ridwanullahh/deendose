import { describe, it, expect, vi } from 'vitest'
import { getQueueStats } from '@/lib/services/content-pipeline'

vi.mock('@/lib/sdk', () => ({
  sdk: {
    get: vi.fn().mockResolvedValue([
      { id: '1', status: 'approved', scheduledFor: '2025-01-15T06:00:00Z' },
      { id: '2', status: 'pending_review', scheduledFor: '2025-01-16T06:00:00Z' },
      { id: '3', status: 'approved', scheduledFor: '2025-01-17T06:00:00Z' }
    ]),
    insert: vi.fn(),
    update: vi.fn()
  }
}))

describe('Content Pipeline', () => {
  it('should get queue stats', async () => {
    const stats = await getQueueStats()
    
    expect(stats.total).toBe(3)
    expect(stats.approved).toBe(2)
    expect(stats.pending).toBe(1)
  })
})
