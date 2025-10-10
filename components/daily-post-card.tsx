"use client"

import { useState } from "react"
import { getHijriDateString } from "@/lib/hijri-calendar"

interface DailyPost {
  id: string
  title: string
  content: {
    quranVerse?: {
      arabic: string
      translation: string
      reference: string
      tafsir?: string
    }
    hadith?: {
      arabic: string
      translation: string
      reference: string
      narrator: string
    }
  }
  publishedAt: string
  hijriDate: any
  category: string
  tags: string[]
  views: number
  likes: number
  shares: number
}

interface DailyPostCardProps {
  post: DailyPost
  onLike?: (postId: string) => void
  onShare?: (postId: string) => void
  className?: string
}

export default function DailyPostCard({ post, onLike, onShare, className = "" }: DailyPostCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [showFullContent, setShowFullContent] = useState(false)

  // Add null checks and default values
  if (!post) {
    return <div className="bg-gray-100 rounded-2xl p-6 text-center">Loading...</div>
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    onLike?.(post.id)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || "DeenDose Daily Post",
          text: `${post.content?.quranVerse?.translation || post.content?.hadith?.translation || "Daily Islamic inspiration"}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback to clipboard
      const shareText = `${post.title || "DeenDose Daily Post"}\n\n${post.content?.quranVerse?.translation || post.content?.hadith?.translation || "Daily Islamic inspiration"}\n\nFrom DeenDose - ${window.location.href}`
      navigator.clipboard.writeText(shareText)
    }
    onShare?.(post.id)
  }

  const publishDate = post.publishedAt ? new Date(post.publishedAt) : new Date()
  const hijriDateString = getHijriDateString(publishDate)

  return (
    <article
      className={`bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-800 to-green-700 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.09-.21 2.09-.64 3-1.22 1.09.58 2.09 1.01 3 1.22 5.16-1 9-5.45 9-11V7l-10-5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Daily DeenDose</h2>
              <p className="text-green-100 text-sm">{hijriDateString}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-sm">
              {publishDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Quran Verse */}
        {post.content.quranVerse && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Quran Verse</h3>
              <span className="text-sm text-gray-500">({post.content.quranVerse.reference})</span>
            </div>

            <div className="bg-green-50 rounded-xl p-6 mb-4">
              <div className="text-right mb-4">
                <p className="text-2xl leading-relaxed text-gray-800 font-arabic">{post.content.quranVerse.arabic}</p>
              </div>
              <div className="border-t border-green-200 pt-4">
                <p className="text-gray-700 leading-relaxed italic">"{post.content.quranVerse.translation}"</p>
                <p className="text-sm text-gray-500 mt-2 font-medium">- {post.content.quranVerse.reference}</p>
              </div>
            </div>

            {post.content.quranVerse.tafsir && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Brief Explanation:</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {showFullContent
                    ? post.content.quranVerse.tafsir
                    : `${post.content.quranVerse.tafsir.substring(0, 150)}...`}
                </p>
                {post.content.quranVerse.tafsir.length > 150 && (
                  <button
                    onClick={() => setShowFullContent(!showFullContent)}
                    className="text-blue-600 text-sm font-medium mt-2 hover:underline"
                  >
                    {showFullContent ? "Show Less" : "Read More"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hadith */}
        {post.content.hadith && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Hadith</h3>
              <span className="text-sm text-gray-500">({post.content.hadith.reference})</span>
            </div>

            <div className="bg-green-50 rounded-xl p-6 mb-4">
              <div className="text-right mb-4">
                <p className="text-2xl leading-relaxed text-gray-800 font-arabic">{post.content.hadith.arabic}</p>
              </div>
              <div className="border-t border-green-200 pt-4">
                <p className="text-gray-700 leading-relaxed italic">"{post.content.hadith.translation}"</p>
                <p className="text-sm text-gray-500 mt-2 font-medium">
                  - Narrated by {post.content.hadith.narrator}, {post.content.hadith.reference}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-4 flex items-center justify-between border-t border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors ${isLiked ? "text-green-700" : ""}`}
          >
            <svg
              className={`w-5 h-5 ${isLiked ? "fill-green-500" : "fill-none"}`}
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.341 0-2.518.603-3.305 1.606-.787-1.003-1.964-1.606-3.305-1.606C5.099 3.75 3 5.765 3 8.25c0 7.229 9 12 18 12"
              />
            </svg>
            <span>Like</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 100 3.186m0-3.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-3.186l9.566-5.314m-9.566 5.314l-2.23 2.23m2.23-2.23l3.1 3.1m-3.1-3.1l2.864-1.591M21 11.5a8.38 8.38 0 01-.9 3.378c-.8.382-1.6.684-2.4.901-1.8.452-3.4.729-4.8.925l-1.5-.5a8.364 8.364 0 01-1.03-.21m0 0a8.392 8.392 0 01-.43.05C13.633 10.784 12.808 10.387 12 10c-1.852.246-3.418.52-4.8.924-1.033.26-2.055.58-3.055.924m-1.5 2.626c.452-1.8.729-3.4.925-4.8a8.344 8.344 0 01.21-1.03m0 0L10.499 15.31l3.1 3.1L21 11.5z"
              />
            </svg>
            <span>Share</span>
          </button>
        </div>
        <div>
          <span className="text-gray-500 text-sm">Views: {post.views}</span>
        </div>
      </div>
    </article>
  )
}
