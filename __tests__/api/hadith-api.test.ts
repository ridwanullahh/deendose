import { describe, it, expect, vi } from 'vitest'
import { fetchHadith } from '@/lib/api/hadith-api'

vi.mock('@/lib/sdk', () => ({
  sdk: {
    get: vi.fn().mockResolvedValue([]),
    insert: vi.fn()
  }
}))

describe('Hadith API', () => {
  it('should fetch a hadith', async () => {
    const hadith = await fetchHadith()
    
    expect(hadith).toBeDefined()
    expect(hadith.translation).toBeDefined()
    expect(hadith.narrator).toBeDefined()
  })

  it('should fetch themed hadith', async () => {
    const hadith = await fetchHadith('SALAH')
    expect(hadith).toBeDefined()
  })
})
