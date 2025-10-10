import axios from 'axios'
import type { QueuedContent } from '@/lib/services/content-pipeline'

interface LinkedInPublishResult {
  success: boolean
  postId?: string
  error?: string
  timestamp: string
}

export async function publishToLinkedIn(content: QueuedContent): Promise<LinkedInPublishResult> {
  const startTime = new Date().toISOString()

  try {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
    const personId = process.env.LINKEDIN_PERSON_ID || 'me'

    if (!accessToken) {
      throw new Error('LinkedIn credentials not configured')
    }

    const formattedContent = formatLinkedInContent(content)

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: `urn:li:person:${personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: formattedContent
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    )

    return {
      success: true,
      postId: response.data.id,
      timestamp: startTime
    }
  } catch (error: any) {
    console.error('LinkedIn publishing failed:', error)
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      timestamp: startTime
    }
  }
}

function formatLinkedInContent(content: QueuedContent): string {
  const { verse, hadith, tafseer } = content

  let post = `🕌 Daily Islamic Reflection\n\n`
  
  post += `📖 ${verse.surah.englishName} (${verse.surah.number}:${verse.numberInSurah})\n\n`
  
  post += `"${verse.translation}"\n\n`
  
  post += `💡 Professional & Personal Insights:\n\n`
  post += `${tafseer.summary.substring(0, 500)}${tafseer.summary.length > 500 ? '...' : ''}\n\n`
  
  post += `Key Takeaways:\n`
  tafseer.keyPoints.slice(0, 3).forEach((point, index) => {
    post += `\n${index + 1}. ${point}`
  })
  post += `\n\n`
  
  if (hadith) {
    post += `🔆 Complementary Teaching:\n\n`
    post += `"${hadith.translation.substring(0, 300)}${hadith.translation.length > 300 ? '...' : ''}"\n\n`
    post += `— ${hadith.reference}\n\n`
  }
  
  post += `🎯 Practical Applications in Daily Life:\n`
  tafseer.practicalApplications.slice(0, 2).forEach((app, index) => {
    post += `\n• ${app}`
  })
  post += `\n\n`
  
  if (tafseer.sources.length > 0) {
    post += `📚 References: ${tafseer.sources.slice(0, 3).join(', ')}\n\n`
  }
  
  post += `In our fast-paced professional lives, moments of spiritual reflection ground us and provide moral clarity for ethical decision-making.\n\n`
  
  post += `#IslamicWisdom #SpiritualGrowth #LeadershipLessons #EthicsInBusiness #PersonalDevelopment #Mindfulness #Islam #ProfessionalGrowth`

  if (post.length > 3000) {
    post = post.substring(0, 2997) + '...'
  }

  return post
}

export async function refreshLinkedInToken(): Promise<{ success: boolean; newToken?: string; error?: string }> {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    const refreshToken = process.env.LINKEDIN_REFRESH_TOKEN

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('LinkedIn OAuth credentials incomplete')
    }

    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      null,
      {
        params: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    return {
      success: true,
      newToken: response.data.access_token
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error_description || error.message
    }
  }
}
