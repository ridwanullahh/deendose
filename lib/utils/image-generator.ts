import type { QuranVerse } from '@/lib/api/quran-api'

export interface ImageGenerationOptions {
  verse: QuranVerse
  template?: 'classic' | 'modern' | 'minimalist' | 'calligraphy'
  backgroundColor?: string
  textColor?: string
  accentColor?: string
}

export interface GeneratedImage {
  url: string
  publicId: string
  width: number
  height: number
}

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

export async function generateInstagramImage(
  options: ImageGenerationOptions
): Promise<GeneratedImage> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return generateFallbackImage(options)
  }

  try {
    const { verse, template = 'classic' } = options
    const reference = `${verse.surah.englishName} ${verse.surah.number}:${verse.numberInSurah}`

    // Check cache first
    const cached = await getCachedImage(reference)
    if (cached) return { url: cached, publicId: reference, width: 1080, height: 1080 }

    // Generate with Cloudinary transformations
    const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`
    
    const arabicText = wrapText(verse.text, 35)
    const englishText = wrapText(verse.translation, 45)
    
    const transformations = [
      'w_1080,h_1080',
      'c_fill',
      'b_rgb:2D5016',
      `l_text:Arial_48_bold:${encodeURIComponent(arabicText)},co_rgb:FFFFFF,g_north,y_150`,
      `l_text:Arial_28:${encodeURIComponent(englishText)},co_rgb:FFFFFF,g_center`,
      `l_text:Arial_24:${encodeURIComponent(reference)},co_rgb:D4AF37,g_south,y_100`,
      'q_auto:best'
    ].join('/')

    const imageUrl = `${baseUrl}/${transformations}/deendose_base.png`
    
    await cacheGeneratedImage(reference, imageUrl, reference)

    return {
      url: imageUrl,
      publicId: reference,
      width: 1080,
      height: 1080
    }
  } catch (error) {
    console.error('Cloudinary generation failed:', error)
    return generateFallbackImage(options)
  }
}

function wrapText(text: string, maxChars: number): string {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    if ((line + ' ' + word).length <= maxChars) {
      line += (line ? ' ' : '') + word
    } else {
      if (line) lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  
  return lines.slice(0, 4).join('%0A')
}

function generateFallbackImage(options: ImageGenerationOptions): GeneratedImage {
  const { verse } = options
  const reference = `${verse.surah.englishName} ${verse.surah.number}:${verse.numberInSurah}`
  const bg = options.backgroundColor?.replace('#', '') || '2D5016'
  const text = options.textColor?.replace('#', '') || 'FFFFFF'
  
  return {
    url: `https://placehold.co/1080x1080/${bg}/${text}/png?text=${encodeURIComponent(reference)}`,
    publicId: `fallback_${Date.now()}`,
    width: 1080,
    height: 1080
  }
}

async function cacheGeneratedImage(ref: string, url: string, id: string): Promise<void> {
  try {
    const { sdk } = await import('@/lib/sdk')
    await sdk.insert('image-cache', {
      verseReference: ref,
      imageUrl: url,
      publicId: id,
      generatedAt: new Date().toISOString()
    })
  } catch {}
}

async function getCachedImage(ref: string): Promise<string | null> {
  try {
    const { sdk } = await import('@/lib/sdk')
    const cache = await sdk.get('image-cache')
    const item = cache.find((c: any) => c.verseReference === ref)
    
    if (item) {
      const age = Date.now() - new Date(item.generatedAt).getTime()
      if (age < 30 * 24 * 60 * 60 * 1000) return item.imageUrl
    }
  } catch {}
  return null
}
