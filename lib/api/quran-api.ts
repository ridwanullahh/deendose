import axios from 'axios'
import { sdk } from '@/lib/sdk'

export interface QuranVerse {
  number: number
  text: string
  numberInSurah: number
  juz: number
  surah: {
    number: number
    name: string
    englishName: string
    numberOfAyahs: number
  }
  translation: string
  transliteration?: string
  audio?: string
  tafsir?: string
}

export interface QuranAPIResponse {
  data: {
    number: number
    text: string
    numberInSurah: number
    juz: number
    surah: {
      number: number
      name: string
      englishName: string
      numberOfAyahs: number
    }
  }
}

const QURAN_API_BASE = process.env.QURAN_API_BASE_URL || 'https://api.quran.com/api/v4'
const QURAN_API_KEY = process.env.QURAN_API_KEY

const THEMES = {
  TAWHEED: ['2:163', '2:255', '3:18', '6:102', '20:14', '37:35', '47:19', '59:22-24', '112:1-4'],
  SALAH: ['2:45', '2:238', '4:103', '20:14', '29:45', '70:22-23', '107:4-5'],
  RAMADAN: ['2:183', '2:185', '2:187', '97:1-5'],
  HAJJ: ['2:196', '2:197', '2:203', '3:97', '22:27-28'],
  CHARACTER: ['3:134', '4:36', '17:23', '17:37', '25:63', '31:18-19', '49:11-13'],
  FAMILY: ['2:233', '4:1', '17:23-24', '30:21', '46:15'],
  PATIENCE: ['2:153', '2:155-157', '3:200', '16:127', '39:10'],
  GRATITUDE: ['2:152', '14:7', '16:78', '31:12', '39:66'],
  FORGIVENESS: ['3:133-134', '7:199', '24:22', '39:53', '42:40'],
  KNOWLEDGE: ['20:114', '35:28', '39:9', '58:11', '96:1-5']
}

export async function fetchQuranVerse(theme?: keyof typeof THEMES): Promise<QuranVerse> {
  try {
    const cached = await getCachedVerse()
    if (cached && shouldUseCached(cached.timestamp)) {
      return cached.verse
    }

    let verse: QuranVerse
    
    try {
      verse = await fetchFromAPI(theme)
    } catch (apiError) {
      console.warn('Quran API failed, using backup:', apiError)
      verse = await fetchFromBackup(theme)
    }

    await cacheVerse(verse)
    return verse
  } catch (error) {
    console.error('Failed to fetch Quran verse:', error)
    return await fetchFromBackup(theme)
  }
}

async function fetchFromAPI(theme?: keyof typeof THEMES): Promise<QuranVerse> {
  const reference = theme ? selectThemeVerse(theme) : await selectRandomVerse()
  
  const [surahNum, ayahRange] = reference.split(':')
  const ayahNum = ayahRange.includes('-') ? ayahRange.split('-')[0] : ayahRange

  const headers = QURAN_API_KEY ? { 'X-API-Key': QURAN_API_KEY } : {}
  
  const [verseResponse, translationResponse, audioResponse] = await Promise.all([
    axios.get(`${QURAN_API_BASE}/verses/by_key/${surahNum}:${ayahNum}`, { 
      headers,
      params: { 
        language: 'ar',
        words: false,
        translations: '131',
        fields: 'text_uthmani'
      }
    }),
    axios.get(`${QURAN_API_BASE}/quran/translations/131`, {
      headers,
      params: { verse_key: `${surahNum}:${ayahNum}` }
    }),
    axios.get(`${QURAN_API_BASE}/chapter_recitations/7/${surahNum}`, {
      headers
    }).catch(() => null)
  ])

  const verseData = verseResponse.data.verse
  const translationData = translationResponse.data.translations[0]
  
  return {
    number: verseData.verse_number,
    text: verseData.text_uthmani,
    numberInSurah: verseData.verse_key.split(':')[1],
    juz: verseData.juz_number,
    surah: {
      number: parseInt(surahNum),
      name: verseData.chapter?.name_arabic || '',
      englishName: verseData.chapter?.name_simple || '',
      numberOfAyahs: verseData.chapter?.verses_count || 0
    },
    translation: translationData.text,
    audio: audioResponse?.data?.audio_file?.audio_url
  }
}

async function fetchFromBackup(theme?: keyof typeof THEMES): Promise<QuranVerse> {
  const backupData = await import('@/public/data/quran-backup.json')
  const verses = backupData.default || backupData
  
  let selectedVerse
  if (theme) {
    const themeVerses = verses.filter((v: any) => v.themes?.includes(theme.toLowerCase()))
    selectedVerse = themeVerses[Math.floor(Math.random() * themeVerses.length)]
  }
  
  if (!selectedVerse) {
    selectedVerse = verses[Math.floor(Math.random() * verses.length)]
  }
  
  return selectedVerse
}

function selectThemeVerse(theme: keyof typeof THEMES): string {
  const verses = THEMES[theme]
  return verses[Math.floor(Math.random() * verses.length)]
}

async function selectRandomVerse(): Promise<string> {
  const surah = Math.floor(Math.random() * 114) + 1
  const versesInSurah = await getSurahVerseCount(surah)
  const verse = Math.floor(Math.random() * versesInSurah) + 1
  return `${surah}:${verse}`
}

async function getSurahVerseCount(surah: number): Promise<number> {
  const verseCounts = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6]
  return verseCounts[surah - 1] || 10
}

async function getCachedVerse(): Promise<{ verse: QuranVerse; timestamp: number } | null> {
  try {
    const cache = await sdk.get('api-cache')
    const quranCache = cache.find((c: any) => c.key === 'quran_verse_latest')
    return quranCache?.value || null
  } catch {
    return null
  }
}

async function cacheVerse(verse: QuranVerse): Promise<void> {
  try {
    const cache = await sdk.get('api-cache')
    const existingIndex = cache.findIndex((c: any) => c.key === 'quran_verse_latest')
    
    const cacheData = {
      key: 'quran_verse_latest',
      value: { verse, timestamp: Date.now() },
      ttl: 24 * 60 * 60 * 1000
    }
    
    if (existingIndex >= 0) {
      await sdk.update('api-cache', cache[existingIndex].id, cacheData)
    } else {
      await sdk.insert('api-cache', cacheData)
    }
  } catch (error) {
    console.error('Failed to cache verse:', error)
  }
}

function shouldUseCached(timestamp: number): boolean {
  const ONE_HOUR = 60 * 60 * 1000
  return Date.now() - timestamp < ONE_HOUR
}

export async function searchVersesByKeyword(keyword: string): Promise<QuranVerse[]> {
  try {
    const backupData = await import('@/public/data/quran-backup.json')
    const verses = backupData.default || backupData
    
    return verses.filter((v: any) => 
      v.translation.toLowerCase().includes(keyword.toLowerCase()) ||
      v.surah.englishName.toLowerCase().includes(keyword.toLowerCase())
    )
  } catch (error) {
    console.error('Search failed:', error)
    return []
  }
}
