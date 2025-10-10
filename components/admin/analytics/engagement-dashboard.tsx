"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface EngagementData {
  platform: string
  posts: number
  likes: number
  comments: number
  shares: number
  reach: number
}

interface TimeSeriesData {
  date: string
  posts: number
  engagement: number
}

export default function EngagementDashboard() {
  const [platformData, setPlatformData] = useState<EngagementData[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`)
      const data = await response.json()
      
      setPlatformData(data.platforms || [])
      setTimeSeriesData(data.timeSeries || [])
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalEngagement = platformData.reduce((sum, p) => sum + p.likes + p.comments + p.shares, 0)
  const totalPosts = platformData.reduce((sum, p) => sum + p.posts, 0)
  const avgEngagementPerPost = totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0

  if (loading) {
    return <div>Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPosts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEngagement.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg per Post</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgEngagementPerPost}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {platformData.length > 0
                ? platformData.reduce((best, current) => 
                    (current.likes + current.comments + current.shares) > 
                    (best.likes + best.comments + best.shares) ? current : best
                  ).platform
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTimeRange('7d')}
          className={`px-4 py-2 rounded ${timeRange === '7d' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
        >
          7 Days
        </button>
        <button
          onClick={() => setTimeRange('30d')}
          className={`px-4 py-2 rounded ${timeRange === '30d' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
        >
          30 Days
        </button>
        <button
          onClick={() => setTimeRange('90d')}
          className={`px-4 py-2 rounded ${timeRange === '90d' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
        >
          90 Days
        </button>
      </div>

      <Tabs defaultValue="platforms">
        <TabsList>
          <TabsTrigger value="platforms">Platform Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Trends Over Time</TabsTrigger>
          <TabsTrigger value="engagement">Engagement Types</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
              <CardDescription>Posts and engagement by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="posts" fill="#2D5016" name="Posts" />
                  <Bar dataKey="likes" fill="#4ADE80" name="Likes" />
                  <Bar dataKey="comments" fill="#3B82F6" name="Comments" />
                  <Bar dataKey="shares" fill="#F59E0B" name="Shares" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trends</CardTitle>
              <CardDescription>Daily engagement over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="posts" stroke="#2D5016" name="Posts" />
                  <Line type="monotone" dataKey="engagement" stroke="#4ADE80" name="Engagement" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformData.map((platform) => (
                  <div key={platform.platform} className="border-b pb-4">
                    <h3 className="font-semibold capitalize mb-2">{platform.platform}</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Likes</p>
                        <p className="text-2xl font-bold">{platform.likes.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Comments</p>
                        <p className="text-2xl font-bold">{platform.comments.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Shares</p>
                        <p className="text-2xl font-bold">{platform.shares.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
