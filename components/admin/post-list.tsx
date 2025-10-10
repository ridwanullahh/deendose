"use client"

import { useState } from "react"
import { sdk } from "@/lib/sdk"

interface PostListProps {
  posts: any[]
  onPostsChange: (posts: any[]) => void
}

export default function PostList({ posts, onPostsChange }: PostListProps) {
  const [filter, setFilter] = useState("all")

  const filteredPosts = posts.filter((post) => {
    if (filter === "all") return true
    return post.status === filter
  })

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      await sdk.delete("posts", postId)
      const updatedPosts = posts.filter((p) => p.id !== postId)
      onPostsChange(updatedPosts)
    } catch (error) {
      console.error("Failed to delete post:", error)
      alert("Failed to delete post")
    }
  }

  const handleStatusChange = async (postId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus }
      if (newStatus === "published") {
        updateData.publishedAt = new Date().toISOString()
      }

      await sdk.update("posts", postId, updateData)
      const updatedPosts = posts.map((p) => (p.id === postId ? { ...p, ...updateData } : p))
      onPostsChange(updatedPosts)
    } catch (error) {
      console.error("Failed to update post status:", error)
      alert("Failed to update post status")
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Posts</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="all">All Posts</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No posts found</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-800 line-clamp-2">{post.title || "Untitled Post"}</h4>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    post.status === "published"
                      ? "bg-green-100 text-green-800"
                      : post.status === "scheduled"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {post.status}
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-3">
                <p>Category: {post.category}</p>
                {post.publishedAt && <p>Published: {new Date(post.publishedAt).toLocaleDateString()}</p>}
                {post.scheduledFor && <p>Scheduled: {new Date(post.scheduledFor).toLocaleDateString()}</p>}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={post.status}
                  onChange={(e) => handleStatusChange(post.id, e.target.value)}
                  className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>

                <button
                  onClick={() => handleDelete(post.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
