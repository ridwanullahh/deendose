"use client"

import { useEffect, useState } from "react"
import { sdk, initializeDatabase } from "@/lib/sdk"
import DailyPostCard from "@/components/daily-post-card"
import HijriCalendar from "@/components/hijri-calendar"
import Navigation from "@/components/navigation"
import SearchBar from "@/components/search-bar"
import CategoryFilter from "@/components/category-filter"
import LoadingSpinner from "@/components/loading-spinner"
import { getCurrentHijriDate } from "@/lib/hijri-calendar"

interface Post {
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
  status: string
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      await initializeDatabase()
      await loadPosts()
      await loadCategories()
    } catch (error) {
      console.error("Failed to initialize app:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async () => {
    try {
      const allPosts = await sdk
        .queryBuilder<Post>("posts")
        .where((post) => post.status === "published")
        .sort("publishedAt", "desc")
        .exec()
      setPosts(allPosts)
    } catch (error) {
      console.error("Failed to load posts:", error)
    }
  }

  const loadCategories = async () => {
    try {
      const allCategories = await sdk.queryBuilder("categories").sort("order", "asc").exec()
      setCategories(allCategories)
    } catch (error) {
      console.error("Failed to load categories:", error)
    }
  }

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = !selectedCategory || post.category === selectedCategory
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.quranVerse?.translation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.hadith?.translation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId)
      if (post) {
        await sdk.update("posts", postId, { likes: (post.likes || 0) + 1 })
        setPosts(posts.map((p) => (p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p)))
      }
    } catch (error) {
      console.error("Failed to like post:", error)
    }
  }

  const handleShare = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId)
      if (post) {
        await sdk.update("posts", postId, { shares: (post.shares || 0) + 1 })
        setPosts(posts.map((p) => (p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p)))
      }
    } catch (error) {
      console.error("Failed to update share count:", error)
    }
  }

  const todaysHijriDate = getCurrentHijriDate()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-green-800/10 to-blue-800/10"></div>
        <div className="relative max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Welcome to <span className="text-green-800">DeenDose</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your daily source of Quranic verses and authentic Hadith. Strengthen your faith with daily Islamic
            inspiration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="bg-white rounded-lg px-6 py-3 shadow-md">
              <p className="text-sm text-gray-500">Today's Hijri Date</p>
              <p className="font-semibold text-green-800">{todaysHijriDate.formatted}</p>
              <p className="text-sm text-gray-600">{todaysHijriDate.formattedArabic}</p>
            </div>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="bg-green-800 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              View Islamic Calendar
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search posts, verses, hadith..." />

            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            {showCalendar && <HijriCalendar className="sticky top-4" showEvents={true} />}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Posts Found</h3>
                <p className="text-gray-600">
                  {searchQuery || selectedCategory
                    ? "Try adjusting your search or filter criteria."
                    : "No posts have been published yet. Check back soon for daily Islamic inspiration!"}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredPosts.map((post) => (
                  <DailyPostCard key={post.id} post={post} onLike={handleLike} onShare={handleShare} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
