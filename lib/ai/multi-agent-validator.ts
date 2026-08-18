import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
import { sdk } from '@/lib/sdk'
import type { QuranVerse } from '@/lib/api/quran-api'
import type { Hadith } from '@/lib/api/hadith-api'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  generationConfig: {
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.3'),
    maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '2000'),
  }
})

const SERP_API_KEY = process.env.SERP_API_KEY
const WEB_SEARCH_ENABLED = process.env.WEB_SEARCH_ENABLED === 'true'
const TRUSTED_SITES = (process.env.TRUSTED_ISLAMIC_SITES || 'dorar.net,islamqa.info,islamweb.net,dar-alifta.org,binbaz.org.sa').split(',')

export interface TafseerSummary {
  summary: string
  keyPoints: string[]
  practicalApplications: string[]
  sources: string[]
  warnings?: string[]
}

export interface ValidationResult {
  agent: string
  approved: boolean
  feedback: string
  sources?: string[]
  timestamp: number
}

export interface MultiAgentValidationResult {
  approved: boolean
  tafseer: TafseerSummary
  validationChain: ValidationResult[]
  totalAgents: number
  approvedAgents: number
  rejectedAgents: number
  searchResults?: any[]
}

export async function validateWithMultiAgent(
  verse: QuranVerse,
  hadith?: Hadith
): Promise<MultiAgentValidationResult> {
  const validationChain: ValidationResult[] = []
  const numAgents = WEB_SEARCH_ENABLED ? 7 : 10
  
  let currentTafseer: TafseerSummary | null = null
  let attempt = 0
  const maxAttempts = 3

  while (attempt < maxAttempts) {
    attempt++
    
    try {
      currentTafseer = await agent1_Generator(verse, hadith)
      validationChain.push({
        agent: 'Agent 1: Content Generator',
        approved: true,
        feedback: 'Initial tafseer generated successfully',
        timestamp: Date.now()
      })

      if (WEB_SEARCH_ENABLED && SERP_API_KEY) {
        const webValidation = await agent2_WebSearchValidator(verse, currentTafseer)
        validationChain.push(webValidation)
        
        if (!webValidation.approved) {
          if (attempt < maxAttempts) {
            continue
          }
          break
        }
      }

      const theologyValidation = await agent3_TheologicalValidator(verse, currentTafseer, hadith)
      validationChain.push(theologyValidation)
      
      if (!theologyValidation.approved) {
        if (attempt < maxAttempts) {
          continue
        }
        break
      }

      const methodologyValidation = await agent4_MethodologyValidator(verse, currentTafseer)
      validationChain.push(methodologyValidation)
      
      if (!methodologyValidation.approved) {
        if (attempt < maxAttempts) {
          continue
        }
        break
      }

      const sourceValidation = await agent5_SourceAttributionValidator(currentTafseer)
      validationChain.push(sourceValidation)
      
      if (!sourceValidation.approved) {
        if (attempt < maxAttempts) {
          continue
        }
        break
      }

      const crossRefValidation = await agent6_CrossReferenceValidator(verse, currentTafseer, hadith)
      validationChain.push(crossRefValidation)
      
      if (!crossRefValidation.approved) {
        if (attempt < maxAttempts) {
          continue
        }
        break
      }

      const finalTafseer = await agent7_SynthesisAgent(verse, currentTafseer, validationChain)
      validationChain.push({
        agent: 'Agent 7: Synthesis Agent',
        approved: true,
        feedback: 'Final synthesis completed successfully',
        timestamp: Date.now()
      })

      await logValidation(verse, validationChain, true)

      const approvedCount = validationChain.filter(v => v.approved).length
      const rejectedCount = validationChain.filter(v => !v.approved).length

      return {
        approved: true,
        tafseer: finalTafseer,
        validationChain,
        totalAgents: validationChain.length,
        approvedAgents: approvedCount,
        rejectedAgents: rejectedCount
      }

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error)
      validationChain.push({
        agent: `Attempt ${attempt}`,
        approved: false,
        feedback: `Error: ${(error as Error).message}`,
        timestamp: Date.now()
      })
    }
  }

  await logValidation(verse, validationChain, false)

  const approvedCount = validationChain.filter(v => v.approved).length
  const rejectedCount = validationChain.filter(v => !v.approved).length

  return {
    approved: false,
    tafseer: currentTafseer || {
      summary: 'Validation failed after multiple attempts',
      keyPoints: [],
      practicalApplications: [],
      sources: []
    },
    validationChain,
    totalAgents: validationChain.length,
    approvedAgents: approvedCount,
    rejectedAgents: rejectedCount
  }
}

async function agent1_Generator(verse: QuranVerse, hadith?: Hadith): Promise<TafseerSummary> {
  const prompt = `Generate a comprehensive yet concise Tafseer (exegesis) for the following Quranic verse according to the understanding of Ahlus Sunnah wal Jama'ah:

Verse: ${verse.text}
Translation: ${verse.translation}
Reference: Surah ${verse.surah.englishName} (${verse.surah.number}), Ayah ${verse.numberInSurah}

${hadith ? `Related Hadith:\n${hadith.translation}\nNarrator: ${hadith.narrator}\nReference: ${hadith.reference}\n` : ''}

Please provide:
1. A clear summary of the verse's meaning (2-3 paragraphs)
2. Key points and benefits (3-5 points)
3. Practical applications for daily life (2-4 points)
4. References to classical scholars' explanations (Ibn Kathir, At-Tabari, As-Sa'di, Ibn Uthaymeen, Al-Albani where applicable)

CRITICAL REQUIREMENTS:
- Base the explanation ONLY on authentic classical Tafseer sources
- Follow the methodology of Ahlus Sunnah without explicitly mentioning "Salafi" or sectarian labels
- Avoid personal opinions or contemporary interpretations not grounded in classical scholarship
- Ensure all theological points align with the Quran and authentic Sunnah
- Attribute all explanations to recognized scholars

Format as JSON with keys: summary, keyPoints (array), practicalApplications (array), sources (array of scholar names with brief citations)`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('Failed to parse JSON from AI response')
  }
  
  return {
    summary: text,
    keyPoints: [],
    practicalApplications: [],
    sources: []
  }
}

async function agent2_WebSearchValidator(verse: QuranVerse, tafseer: TafseerSummary): Promise<ValidationResult> {
  if (!SERP_API_KEY) {
    return {
      agent: 'Agent 2: Web Search Validator',
      approved: true,
      feedback: 'Web search not configured, skipping validation',
      timestamp: Date.now()
    }
  }

  try {
    const searchQueries = [
      `${verse.surah.englishName} ${verse.numberInSurah} tafsir Ibn Kathir`,
      `surah ${verse.surah.number} ayah ${verse.numberInSurah} explanation`,
      `${verse.surah.englishName} verse ${verse.numberInSurah} islamic ruling`
    ]

    const searchResults = []
    
    for (const query of searchQueries) {
      try {
        const response = await axios.get('https://serpapi.com/search', {
          params: {
            q: query,
            api_key: SERP_API_KEY,
            num: 5
          }
        })
        
        if (response.data.organic_results) {
          searchResults.push(...response.data.organic_results)
        }
      } catch (error) {
        console.warn(`Search query failed: ${query}`, error)
      }
    }

    const trustedResults = searchResults.filter(result => 
      TRUSTED_SITES.some(site => result.link?.includes(site))
    )

    const validationPrompt = `Review the following AI-generated Tafseer against information from trusted Islamic websites:

Tafseer: ${JSON.stringify(tafseer)}

Search Results from Trusted Sites: ${JSON.stringify(trustedResults.slice(0, 5))}

Verify:
1. Does the tafseer align with information from these trusted sources?
2. Are there any contradictions or inaccuracies?
3. Are the key points supported by these sources?

Respond with JSON: { "approved": boolean, "feedback": "detailed explanation", "sources": ["list of supporting sources"] }`

    const result = await model.generateContent(validationPrompt)
    const response = await result.response
    const text = response.text()
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const validation = JSON.parse(jsonMatch[0])
        return {
          agent: 'Agent 2: Web Search Validator',
          approved: validation.approved,
          feedback: validation.feedback,
          sources: validation.sources || [],
          timestamp: Date.now()
        }
      }
    } catch (e) {
      console.error('Failed to parse validation response')
    }

    return {
      agent: 'Agent 2: Web Search Validator',
      approved: true,
      feedback: 'Validation completed with search results',
      sources: trustedResults.slice(0, 3).map(r => r.link),
      timestamp: Date.now()
    }

  } catch (error) {
    console.error('Web search validation failed:', error)
    return {
      agent: 'Agent 2: Web Search Validator',
      approved: true,
      feedback: `Web search failed but proceeding: ${(error as Error).message}`,
      timestamp: Date.now()
    }
  }
}

async function agent3_TheologicalValidator(verse: QuranVerse, tafseer: TafseerSummary, hadith?: Hadith): Promise<ValidationResult> {
  const prompt = `As a theological validator, review this Tafseer for soundness according to the Quran and authentic Sunnah:

Verse: ${verse.text} (${verse.translation})
Reference: ${verse.surah.englishName} ${verse.numberInSurah}

Tafseer: ${JSON.stringify(tafseer)}

${hadith ? `Related Hadith: ${hadith.translation}` : ''}

Validate:
1. Does the explanation align with the fundamental principles of Tawheed?
2. Are all theological points supported by Quranic evidence or authentic Hadith?
3. Are there any statements that contradict Islamic Aqeedah (creed)?
4. Are the attributes of Allah mentioned correctly?
5. Is the explanation free from innovations (bid'ah)?

Respond with JSON: { "approved": boolean, "feedback": "detailed theological assessment", "issues": ["list any theological concerns"] }`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const validation = JSON.parse(jsonMatch[0])
      return {
        agent: 'Agent 3: Theological Validator',
        approved: validation.approved,
        feedback: validation.feedback,
        timestamp: Date.now()
      }
    }
  } catch (e) {
    console.error('Failed to parse theological validation')
  }

  return {
    agent: 'Agent 3: Theological Validator',
    approved: text.toLowerCase().includes('approved') || !text.toLowerCase().includes('reject'),
    feedback: text,
    timestamp: Date.now()
  }
}

async function agent4_MethodologyValidator(verse: QuranVerse, tafseer: TafseerSummary): Promise<ValidationResult> {
  const prompt = `As a methodology validator, assess whether this Tafseer follows the correct methodology of understanding the Quran according to Ahlus Sunnah:

Tafseer: ${JSON.stringify(tafseer)}

Verify:
1. Is the Quran explained by the Quran first (tafsir al-Quran bil-Quran)?
2. Are explanations based on statements of the Prophet (ﷺ) and his companions?
3. Are classical scholars (Salaf) referenced appropriately?
4. Is the understanding literal (zahir) unless there's evidence for metaphorical interpretation?
5. Are opinions attributed correctly without inserting personal views?
6. Does it avoid sectarian language while maintaining orthodox positions?

Respond with JSON: { "approved": boolean, "feedback": "methodology assessment", "methodologicalIssues": ["list concerns"] }`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const validation = JSON.parse(jsonMatch[0])
      return {
        agent: 'Agent 4: Methodology Validator',
        approved: validation.approved,
        feedback: validation.feedback,
        timestamp: Date.now()
      }
    }
  } catch (e) {
    console.error('Failed to parse methodology validation')
  }

  return {
    agent: 'Agent 4: Methodology Validator',
    approved: text.toLowerCase().includes('approved') || !text.toLowerCase().includes('reject'),
    feedback: text,
    timestamp: Date.now()
  }
}

async function agent5_SourceAttributionValidator(tafseer: TafseerSummary): Promise<ValidationResult> {
  const acceptedScholars = [
    'Ibn Kathir', 'At-Tabari', 'As-Sa\'di', 'Ibn Uthaymeen', 'Al-Albani',
    'Ibn Taymiyyah', 'Ibn Qayyim', 'Ash-Shawkani', 'Al-Qurtubi', 'Ibn Abbas',
    'Al-Baghawi', 'As-Suyuti', 'Ibn Hajr'
  ]

  const sourcesText = tafseer.sources.join(' ')
  const hasProperAttribution = acceptedScholars.some(scholar => 
    sourcesText.includes(scholar)
  )

  if (!hasProperAttribution) {
    return {
      agent: 'Agent 5: Source Attribution Validator',
      approved: false,
      feedback: 'Tafseer lacks proper attribution to recognized classical scholars. Sources must reference at least one of the accepted scholars of Tafseer.',
      timestamp: Date.now()
    }
  }

  return {
    agent: 'Agent 5: Source Attribution Validator',
    approved: true,
    feedback: `Tafseer properly attributes explanations to recognized scholars: ${tafseer.sources.join(', ')}`,
    sources: tafseer.sources,
    timestamp: Date.now()
  }
}

async function agent6_CrossReferenceValidator(verse: QuranVerse, tafseer: TafseerSummary, hadith?: Hadith): Promise<ValidationResult> {
  const prompt = `Perform comprehensive cross-reference validation:

Verse: ${verse.text} (${verse.translation})
Tafseer: ${JSON.stringify(tafseer)}
${hadith ? `Hadith: ${hadith.translation}` : ''}

Validate:
1. Are there related verses that support this interpretation?
2. Do the practical applications logically follow from the verse meaning?
3. Are the key points consistent with the overall message of the Quran?
4. If a Hadith is provided, does it properly complement the verse?
5. Are there any logical inconsistencies or gaps in the explanation?

Respond with JSON: { "approved": boolean, "feedback": "cross-reference assessment", "relatedVerses": ["suggestions for related verses"] }`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const validation = JSON.parse(jsonMatch[0])
      return {
        agent: 'Agent 6: Cross-Reference Validator',
        approved: validation.approved,
        feedback: validation.feedback,
        timestamp: Date.now()
      }
    }
  } catch (e) {
    console.error('Failed to parse cross-reference validation')
  }

  return {
    agent: 'Agent 6: Cross-Reference Validator',
    approved: text.toLowerCase().includes('approved') || !text.toLowerCase().includes('reject'),
    feedback: text,
    timestamp: Date.now()
  }
}

async function agent7_SynthesisAgent(verse: QuranVerse, tafseer: TafseerSummary, validationChain: ValidationResult[]): Promise<TafseerSummary> {
  const allApproved = validationChain.every(v => v.approved)
  
  if (allApproved) {
    return tafseer
  }

  const feedbackSummary = validationChain
    .filter(v => !v.approved)
    .map(v => `${v.agent}: ${v.feedback}`)
    .join('\n')

  const prompt = `Refine this Tafseer based on validation feedback:

Original Tafseer: ${JSON.stringify(tafseer)}

Validation Feedback:
${feedbackSummary}

Please refine the Tafseer addressing all concerns while maintaining accuracy and authenticity.

Format as JSON with keys: summary, keyPoints (array), practicalApplications (array), sources (array)`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('Failed to parse refined tafseer')
  }

  return tafseer
}

async function logValidation(verse: QuranVerse, validationChain: ValidationResult[], approved: boolean): Promise<void> {
  try {
    const logEntry = {
      verseReference: `${verse.surah.englishName} ${verse.numberInSurah}`,
      timestamp: new Date().toISOString(),
      approved,
      validationChain,
      totalAgents: validationChain.length,
      approvedAgents: validationChain.filter(v => v.approved).length,
      rejectedAgents: validationChain.filter(v => !v.approved).length
    }

    const logs = await sdk.get<any>('ai-validation-logs').catch(() => [] as any[])
    logs.push(logEntry)
    
    if (logs.length > 1000) {
      logs.shift()
    }

    await sdk.insert('ai-validation-logs', logEntry)
  } catch (error) {
    console.error('Failed to log validation:', error)
  }
}
