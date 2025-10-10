"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { sdk } from "@/lib/sdk"
import { SocialMediaManager } from "@/lib/social-media"

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [schedulesData, postsData] = await Promise.all([sdk.get("schedules"), sdk.get("posts")])
      setSchedules(schedulesData)
      setPosts(postsData)
    } catch (error) {
      console.error("Failed to load schedule data:", error)
    } finally {
      setLoading(false)
    }
  }

  const createSchedule = async (postId: string, scheduledFor: string, platforms: string[]) => {
    try {
      await sdk.insert("schedules", {
        postId,
        scheduledFor,
        platforms,
        status: "pending",
      })
      loadData()
    } catch (error) {
      console.error("Failed to create schedule:", error)
      alert("Failed to create schedule")
    }
  }

  const executeSchedule = async (scheduleId: string) => {
    try {
      const schedule = schedules.find((s: any) => s.id === scheduleId)
      const post = posts.find((p: any) => p.id === schedule.postId)

      if (!schedule || !post) return

      // Initialize social media manager (you'd get these from settings)
      const socialConfig = {
        facebook: {
          appId: process.env.FACEBOOK_APP_ID || "",
          appSecret: process.env.FACEBOOK_APP_SECRET || "",
          accessToken: process.env.FACEBOOK_ACCESS_TOKEN || "",
        },
        telegram: {
          botToken: process.env.TELEGRAM_BOT_TOKEN || "",
          chatId: process.env.TELEGRAM_CHAT_ID || "",
        },
        // Add other platforms...
      }

      const socialManager = new SocialMediaManager(socialConfig)

      // Format content for posting
      const content = `${post.title}\n\n${post.content.quranVerse?.translation || ""}\n\n${post.content.hadith?.translation || ""}`

      // Post to selected platforms
      const results = await socialManager.postToAllPlatforms(content, [], schedule.platforms)

      // Update schedule status
      await sdk.update("schedules", scheduleId, {
        status: "completed",
        lastAttempt: new Date().toISOString(),
        results,
      })

      loadData()
    } catch (error) {
      console.error("Failed to execute schedule:", error)
      await sdk.update("schedules", scheduleId, {
        status: "failed",
        lastAttempt: new Date().toISOString(),
        errors: [error.message],
      })
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading schedules...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Schedule Manager</h2>

        {/* Create New Schedule */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Schedule</h3>
          <ScheduleForm posts={posts} onScheduleCreate={createSchedule} />
        </div>

        {/* Existing Schedules */}
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No schedules found</p>
            </div>
          ) : (
            schedules.map((schedule: any) => {
              const post = posts.find((p: any) => p.id === schedule.postId)
              return (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-800">{post?.title || "Unknown Post"}</h4>
                      <p className="text-sm text-gray-600">
                        Scheduled for: {new Date(schedule.scheduledFor).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Platforms: {schedule.platforms.join(", ")}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        schedule.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : schedule.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {schedule.status}
                    </span>
                  </div>

                  {schedule.status === "pending" && (
                    <button
                      onClick={() => executeSchedule(schedule.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Execute Now
                    </button>
                  )}

                  {schedule.errors && schedule.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-800 font-medium">Errors:</p>
                      <ul className="text-sm text-red-700 mt-1">
                        {schedule.errors.map((error: string, index: number) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

interface ScheduleFormProps {
  posts: any[]
  onScheduleCreate: (postId: string, scheduledFor: string, platforms: string[]) => void
}

function ScheduleForm({ posts, onScheduleCreate }: ScheduleFormProps) {
  const [selectedPost, setSelectedPost] = useState("")
  const [scheduledFor, setScheduledFor] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  const platforms = [
    { id: "facebook", name: "Facebook", icon: "📘" },
    { id: "twitter", name: "Twitter", icon: "🐦" },
    { id: "instagram", name: "Instagram", icon: "📷" },
    { id: "telegram", name: "Telegram", icon: "✈️" },
    { id: "whatsapp", name: "WhatsApp", icon: "💬" },
    { id: "linkedin", name: "LinkedIn", icon: "💼" },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPost || !scheduledFor || selectedPlatforms.length === 0) {
      alert("Please fill all fields")
      return
    }

    onScheduleCreate(selectedPost, scheduledFor, selectedPlatforms)

    // Reset form
    setSelectedPost("")
    setScheduledFor("")
    setSelectedPlatforms([])
  }

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId],
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Post</label>
          <select
            value={selectedPost}
            onChange={(e) => setSelectedPost(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Choose a post...</option>
            {posts
              .filter((p) => p.status === "published")
              .map((post) => (
                <option key={post.id} value={post.id}>
                  {post.title || "Untitled Post"}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Schedule For</label>
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Platforms</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              type="button"
              onClick={() => togglePlatform(platform.id)}
              className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                selectedPlatforms.includes(platform.id)
                  ? "border-blue-500 bg-blue-50 text-blue-800"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-lg">{platform.icon}</span>
              <span className="font-medium">{platform.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
        Create Schedule
      </button>
    </form>
  )
}
