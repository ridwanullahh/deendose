import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchQuranVerse, searchVersesByKeyword } from '@/lib/api/quran-api'

vi.mock('@/lib/sdk', () => ({
  sdk: {
    get: vi.fn().mockResolvedValue([]),
    insert: vi.fn(),
    update: vi.fn()
  }
}))

describe('Quran API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchQuranVerse', () => {
    it('should fetch a verse with theme', async () => {
      const verse = await fetchQuranVerse('TAWHEED')
      
      expect(verse).toBeDefined()
      expect(verse.text).toBeDefined()
      expect(verse.translation).toBeDefined()
      expect(verse.surah).toBeDefined()
    })

    it('should fallback to backup on API failure', async () => {
      process.env.QURAN_API_KEY = undefined
      
      const verse = await fetchQuranVerse()
      
      expect(verse).toBeDefined()
      expect(verse.text).toBeTruthy()
    })
  })

  describe('searchVersesByKeyword', () => {
    it('should search verses by keyword', async () => {
      const results = await searchVersesByKeyword('Allah')
      expect(Array.isArray(results)).toBe(true)
    })
  })
})
