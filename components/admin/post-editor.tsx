"use client"

import type React from "react"

import { useState } from "react"
import { sdk } from "@/lib/sdk"
import { getCurrentHijriDate } from "@/lib/hijri-calendar"

interface PostEditorProps {
  onPostSaved: () => void
  editingPost?: any
}

export default function PostEditor({ onPostSaved, editingPost }: PostEditorProps) {
  const [formData, setFormData] = useState({
    title: editingPost?.title || "",
    quranVerse: {
      arabic: editingPost?.content?.quranVerse?.arabic || "",
      translation: editingPost?.content?.quranVerse?.translation || "",
      reference: editingPost?.content?.quranVerse?.reference || "",
      tafsir: editingPost?.content?.quranVerse?.tafsir || "",
    },
    hadith: {
      arabic: editingPost?.content?.hadith?.arabic || "",
      translation: editingPost?.content?.hadith?.translation || "",
      reference: editingPost?.content?.hadith?.reference || "",
      narrator: editingPost?.content?.hadith?.narrator || "",
    },
    category: editingPost?.category || "daily-dose",
    tags: editingPost?.tags?.join(", ") || "",
    scheduledFor: editingPost?.scheduledFor || "",
    status: editingPost?.status || "draft",
  })

  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const postData = {
        title: formData.title,
        content: {
          quranVerse: formData.quranVerse.arabic ? formData.quranVerse : undefined,
          hadith: formData.hadith.arabic ? formData.hadith : undefined,
        },
        category: formData.category,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        scheduledFor: formData.scheduledFor || new Date().toISOString(),
        publishedAt: formData.status === "published" ? new Date().toISOString() : undefined,
        status: formData.status,
        hijriDate: getCurrentHijriDate(),
        type: "daily-dose",
      }

      if (editingPost) {
        await sdk.update("posts", editingPost.id, postData)
      } else {
        await sdk.insert("posts", postData)
      }

      // Reset form
      setFormData({
        title: "",
        quranVerse: { arabic: "", translation: "", reference: "", tafsir: "" },
        hadith: { arabic: "", translation: "", reference: "", narrator: "" },
        category: "daily-dose",
        tags: "",
        scheduledFor: "",
        status: "draft",
      })

      onPostSaved()
    } catch (error) {
      console.error("Failed to save post:", error)
      alert("Failed to save post. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{editingPost ? "Edit Post" : "Create New Post"}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Post Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter post title..."
            required
          />
        </div>

        {/* Quran Verse Section */}
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Quran Verse</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Arabic Text</label>
              <textarea
                value={formData.quranVerse.arabic}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quranVerse: { ...formData.quranVerse, arabic: e.target.value },
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Enter Arabic verse..."
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Translation</label>
              <textarea
                value={formData.quranVerse.translation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quranVerse: { ...formData.quranVerse, translation: e.target.value },
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Enter English translation..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reference (Surah:Ayah)</label>
              <input
                type="text"
                value={formData.quranVerse.reference}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quranVerse: { ...formData.quranVerse, reference: e.target.value },
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Al-Baqarah 2:255"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brief Tafsir (Optional)</label>
              <input
                type="text"
                value={formData.quranVerse.tafsir}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quranVerse: { ...formData.quranVerse, tafsir: e.target.value },
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Brief explanation..."
              />
            </div>
          </div>
        </div>

        {/* Hadith Section */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Hadith</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Arabic Text</label>
              <textarea
                value={formData.hadith.arabic}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hadith: { ...formData.hadith, arabic: e.target.value },
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter Arabic hadith..."
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Translation</label>
              <textarea
                value={formData.hadith.translation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hadith: { ...formData.hadith, translation: e.target.value },
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter English translation..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
              <input
                type="text"
                value={formData.hadith.reference}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hadith: { ...formData.hadith, reference: e.target.value },
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Sahih Bukhari 1:1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Narrator</label>
              <input
                type="text"
                value={formData.hadith.narrator}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hadith: { ...formData.hadith, narrator: e.target.value },
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Abu Huraira (RA)"
              />
            </div>
          </div>
        </div>

        {/* Post Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="daily-dose">Daily Dose</option>
              <option value="quran-verses">Quran Verses</option>
              <option value="hadith">Hadith</option>
              <option value="islamic-calendar">Islamic Calendar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled For</label>
            <input
              type="datetime-local"
              value={formData.scheduledFor}
              onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="islam, quran, hadith, daily, inspiration"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-800 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? "Saving..." : editingPost ? "Update Post" : "Create Post"}
          </button>

          {editingPost && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
