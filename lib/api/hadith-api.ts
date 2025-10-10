import axios from 'axios'
import { sdk } from '@/lib/sdk'

export interface Hadith {
  id: string
  collection: string
  bookNumber: string
  hadithNumber: string
  arabic: string
  translation: string
  narrator: string
  grade: string
  chapter: string
  reference: string
}

const HADITH_API_BASE = process.env.HADITH_API_BASE_URL || 'https://api.sunnah.com/v1'
const HADITH_API_KEY = process.env.HADITH_API_KEY

const COLLECTIONS = ['bukhari', 'muslim', 'abudawud', 'tirmidhi', 'nasai', 'ibnmajah']

const THEMES = {
  TAWHEED: ['bukhari:1', 'muslim:1', 'bukhari:50'],
  SALAH: ['bukhari:574', 'muslim:252', 'abudawud:425'],
  RAMADAN: ['bukhari:1901', 'bukhari:1904', 'muslim:1079'],
  HAJJ: ['bukhari:1513', 'bukhari:1520', 'muslim:1218'],
  CHARACTER: ['bukhari:6018', 'muslim:2564', 'tirmidhi:1987'],
  FAMILY: ['bukhari:5186', 'muslim:1468', 'abudawud:2142'],
  PATIENCE: ['bukhari:5645', 'muslim:2999', 'tirmidhi:2398'],
  GRATITUDE: ['bukhari:52', 'muslim:2586', 'tirmidhi:1954'],
  FORGIVENESS: ['bukhari:6307', 'muslim:2687', 'tirmidhi:2398'],
  KNOWLEDGE: ['bukhari:67', 'muslim:2699', 'tirmidhi:2682']
}

export async function fetchHadith(theme?: keyof typeof THEMES): Promise<Hadith> {
  try {
    const cached = await getCachedHadith()
    if (cached && shouldUseCached(cached.timestamp)) {
      return cached.hadith
    }

    let hadith: Hadith
    
    try {
      hadith = await fetchFromAPI(theme)
    } catch (apiError) {
      console.warn('Hadith API failed, using backup:', apiError)
      hadith = await fetchFromBackup(theme)
    }

    await cacheHadith(hadith)
    return hadith
  } catch (error) {
    console.error('Failed to fetch Hadith:', error)
    return await fetchFromBackup(theme)
  }
}

async function fetchFromAPI(theme?: keyof typeof THEMES): Promise<Hadith> {
  if (!HADITH_API_KEY) {
    throw new Error('Hadith API key not configured')
  }

  const reference = theme ? selectThemeHadith(theme) : await selectRandomHadith()
  const [collection, number] = reference.split(':')

  const headers = {
    'X-API-Key': HADITH_API_KEY
  }

  const response = await axios.get(
    `${HADITH_API_BASE}/hadiths/${collection}/${number}`,
    { headers }
  )

  const data = response.data.hadith

  return {
    id: data.hadithNumber,
    collection: collection,
    bookNumber: data.book?.number || '',
    hadithNumber: data.hadithNumber,
    arabic: data.hadithArabic,
    translation: data.hadithEnglish,
    narrator: data.narrator || extractNarrator(data.hadithEnglish),
    grade: data.grade || 'Sahih',
    chapter: data.book?.name || '',
    reference: `${collection.charAt(0).toUpperCase() + collection.slice(1)} ${data.hadithNumber}`
  }
}

async function fetchFromBackup(theme?: keyof typeof THEMES): Promise<Hadith> {
  const backupData = await import('@/public/data/hadith-backup.json')
  const hadiths = backupData.default || backupData
  
  let selectedHadith
  if (theme) {
    const themeHadiths = hadiths.filter((h: any) => h.themes?.includes(theme.toLowerCase()))
    selectedHadith = themeHadiths[Math.floor(Math.random() * themeHadiths.length)]
  }
  
  if (!selectedHadith) {
    selectedHadith = hadiths[Math.floor(Math.random() * hadiths.length)]
  }
  
  return selectedHadith
}

function selectThemeHadith(theme: keyof typeof THEMES): string {
  const hadiths = THEMES[theme]
  return hadiths[Math.floor(Math.random() * hadiths.length)]
}

async function selectRandomHadith(): Promise<string> {
  const collection = COLLECTIONS[Math.floor(Math.random() * COLLECTIONS.length)]
  const maxNumbers: { [key: string]: number } = {
    bukhari: 7563,
    muslim: 7563,
    abudawud: 5274,
    tirmidhi: 3956,
    nasai: 5758,
    ibnmajah: 4341
  }
  
  const number = Math.floor(Math.random() * maxNumbers[collection]) + 1
  return `${collection}:${number}`
}

function extractNarrator(hadithText: string): string {
  const match = hadithText.match(/^Narrated\s+([^:]+):/i) || 
                hadithText.match(/^([A-Za-z\s]+)\s+narrated:/i) ||
                hadithText.match(/^On the authority of\s+([^:,]+)/i)
  
  if (match && match[1]) {
    return match[1].trim()
  }
  
  return 'Companion of the Prophet'
}

async function getCachedHadith(): Promise<{ hadith: Hadith; timestamp: number } | null> {
  try {
    const cache = await sdk.get('api-cache')
    const hadithCache = cache.find((c: any) => c.key === 'hadith_latest')
    return hadithCache?.value || null
  } catch {
    return null
  }
}

async function cacheHadith(hadith: Hadith): Promise<void> {
  try {
    const cache = await sdk.get('api-cache')
    const existingIndex = cache.findIndex((c: any) => c.key === 'hadith_latest')
    
    const cacheData = {
      key: 'hadith_latest',
      value: { hadith, timestamp: Date.now() },
      ttl: 24 * 60 * 60 * 1000
    }
    
    if (existingIndex >= 0) {
      await sdk.update('api-cache', cache[existingIndex].id, cacheData)
    } else {
      await sdk.insert('api-cache', cacheData)
    }
  } catch (error) {
    console.error('Failed to cache hadith:', error)
  }
}

function shouldUseCached(timestamp: number): boolean {
  const ONE_HOUR = 60 * 60 * 1000
  return Date.now() - timestamp < ONE_HOUR
}

export async function searchHadithsByKeyword(keyword: string): Promise<Hadith[]> {
  try {
    const backupData = await import('@/public/data/hadith-backup.json')
    const hadiths = backupData.default || backupData
    
    return hadiths.filter((h: any) => 
      h.translation.toLowerCase().includes(keyword.toLowerCase()) ||
      h.narrator.toLowerCase().includes(keyword.toLowerCase()) ||
      h.chapter.toLowerCase().includes(keyword.toLowerCase())
    )
  } catch (error) {
    console.error('Search failed:', error)
    return []
  }
}

export async function getHadithByReference(reference: string): Promise<Hadith | null> {
  try {
    const [collection, number] = reference.toLowerCase().split(':')
    
    try {
      return await fetchFromAPI()
    } catch {
      const backupData = await import('@/public/data/hadith-backup.json')
      const hadiths = backupData.default || backupData
      return hadiths.find((h: any) => 
        h.collection.toLowerCase() === collection && 
        h.hadithNumber === number
      ) || null
    }
  } catch (error) {
    console.error('Failed to get hadith by reference:', error)
    return null
  }
}
