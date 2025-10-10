"use client"

import { useState, useEffect } from "react"
import { getSetting, setSetting } from "@/lib/sdk"

export default function SocialMediaSettings() {
  const [settings, setSettings] = useState({
    facebook: {
      appId: "",
      appSecret: "",
      accessToken: "",
      pageId: "",
    },
    twitter: {
      apiKey: "",
      apiSecret: "",
      accessToken: "",
      accessTokenSecret: "",
    },
    instagram: {
      accessToken: "",
      businessAccountId: "",
    },
    telegram: {
      botToken: "",
      chatId: "",
    },
    whatsapp: {
      phoneNumberId: "",
      accessToken: "",
    },
    linkedin: {
      clientId: "",
      clientSecret: "",
      accessToken: "",
    },
  })

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("facebook")

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const socialSettings = await getSetting("social_media_config")
      if (socialSettings) {
        setSettings(JSON.parse(socialSettings))
      }
    } catch (error) {
      console.error("Failed to load social media settings:", error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await setSetting("social_media_config", JSON.stringify(settings))
      alert("Settings saved successfully!")
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const updatePlatformSetting = (platform: string, field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform as keyof typeof prev],
        [field]: value,
      },
    }))
  }

  const platforms = [
    { id: "facebook", name: "Facebook", icon: "📘", color: "blue" },
    { id: "twitter", name: "Twitter", icon: "🐦", color: "sky" },
    { id: "instagram", name: "Instagram", icon: "📷", color: "pink" },
    { id: "telegram", name: "Telegram", icon: "✈️", color: "blue" },
    { id: "whatsapp", name: "WhatsApp", icon: "💬", color: "green" },
    { id: "linkedin", name: "LinkedIn", icon: "💼", color: "blue" },
  ]

  const renderPlatformSettings = (platformId: string) => {
    const platform = settings[platformId as keyof typeof settings]

    switch (platformId) {
      case "facebook":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">App ID</label>
                <input
                  type="text"
                  value={platform.appId}
                  onChange={(e) => updatePlatformSetting("facebook", "appId", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Facebook App ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">App Secret</label>
                <input
                  type="password"
                  value={platform.appSecret}
                  onChange={(e) => updatePlatformSetting("facebook", "appSecret", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Facebook App Secret"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
                <input
                  type="password"
                  value={platform.accessToken}
                  onChange={(e) => updatePlatformSetting("facebook", "accessToken", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Facebook Access Token"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Page ID (Optional)</label>
                <input
                  type="text"
                  value={platform.pageId}
                  onChange={(e) => updatePlatformSetting("facebook", "pageId", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Facebook Page ID"
                />
              </div>
            </div>
          </div>
        )

      case "telegram":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bot Token</label>
                <input
                  type="password"
                  value={platform.botToken}
                  onChange={(e) => updatePlatformSetting("telegram", "botToken", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Telegram Bot Token"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chat ID</label>
                <input
                  type="text"
                  value={platform.chatId}
                  onChange={(e) => updatePlatformSetting("telegram", "chatId", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Telegram Chat ID"
                />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Setup Instructions:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Create a bot by messaging @BotFather on Telegram</li>
                <li>2. Get your bot token from BotFather</li>
                <li>3. Add your bot to your channel/group</li>
                <li>4. Get the chat ID using @userinfobot</li>
              </ol>
            </div>
          </div>
        )

      case "whatsapp":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number ID</label>
                <input
                  type="text"
                  value={platform.phoneNumberId}
                  onChange={(e) => updatePlatformSetting("whatsapp", "phoneNumberId", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter WhatsApp Phone Number ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
                <input
                  type="password"
                  value={platform.accessToken}
                  onChange={(e) => updatePlatformSetting("whatsapp", "accessToken", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter WhatsApp Access Token"
                />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">WhatsApp Business API Required:</h4>
              <p className="text-sm text-green-700">
                You need a WhatsApp Business API account to use this feature. Get your credentials from the Meta
                Business platform.
              </p>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Settings for {platformId} coming soon...</p>
          </div>
        )
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-800 to-blue-700 text-white p-6">
        <h2 className="text-2xl font-bold">Social Media Settings</h2>
        <p className="text-blue-100 mt-2">Configure your social media platform credentials</p>
      </div>

      <div className="flex border-b border-gray-200">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => setActiveTab(platform.id)}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === platform.id
                ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <span className="text-lg">{platform.icon}</span>
            <span>{platform.name}</span>
          </button>
        ))}
      </div>

      <div className="p-6">
        {renderPlatformSettings(activeTab)}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  )
}
