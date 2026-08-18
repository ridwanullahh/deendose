"use client"

import { useEffect, useState } from "react"
import { sdk } from "@/lib/sdk"
import Navigation from "@/components/navigation"
import DailyPostCard from "@/components/daily-post-card"
import SearchBar from "@/components/search-bar"
import CategoryFilter from "@/components/category-filter"
import LoadingSpinner from "@/components/loading-spinner"

export default function ArchivePage() {
  const [posts, setPosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState("newest")

  const postsPerPage = 6

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [postsData, categoriesData] = await Promise.all([
        sdk
          .queryBuilder("posts")
          .where((post: any) => post.status === "published")
          .sort("publishedAt", "desc")
          .exec(),
        sdk.get("categories"),
      ])
      setPosts(postsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Failed to load archive data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts
    .filter((post: any) => {
      const matchesCategory = !selectedCategory || post.category === selectedCategory
      const matchesSearch =
        !searchQuery ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.quranVerse?.translation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.hadith?.translation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesCategory && matchesSearch
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
        case "popular":
          return (b.views || 0) - (a.views || 0)
        case "newest":
        default:
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      }
    })

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)
  const startIndex = (currentPage - 1) * postsPerPage
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage)

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find((p: any) => p.id === postId)
      if (post) {
        await sdk.update("posts", postId, { likes: (post.likes || 0) + 1 })
        setPosts(posts.map((p: any) => (p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p)))
      }
    } catch (error) {
      console.error("Failed to like post:", error)
    }
  }

  const handleShare = async (postId: string) => {
    try {
      const post = posts.find((p: any) => p.id === postId)
      if (post) {
        await sdk.update("posts", postId, { shares: (post.shares || 0) + 1 })
        setPosts(posts.map((p: any) => (p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p)))
      }
    } catch (error) {
      console.error("Failed to update share count:", error)
    }
  }

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

      {/* Header */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Archive</h1>
          <p className="text-xl text-gray-600 mb-8">Browse through our collection of daily Islamic inspiration</p>
          <div className="bg-white rounded-lg p-4 inline-block shadow-md">
            <p className="text-sm text-gray-500">Total Posts</p>
            <p className="text-2xl font-bold text-green-800">{posts.length}</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search archive..." />

            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            {/* Sort Options */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-800 to-blue-700 text-white">
                <h3 className="font-semibold">Sort By</h3>
              </div>
              <div className="p-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
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
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Posts Found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <>
                {/* Results Info */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-gray-600">
                    Showing {startIndex + 1}-{Math.min(startIndex + postsPerPage, filteredPosts.length)} of{" "}
                    {filteredPosts.length} posts
                  </p>
                </div>

                {/* Posts Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                  {paginatedPosts.map((post: any) => (
                    <DailyPostCard key={post.id} post={post} onLike={handleLike} onShare={handleShare} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === page ? "bg-green-800 text-white" : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
