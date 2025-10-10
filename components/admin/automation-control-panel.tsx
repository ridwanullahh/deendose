"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  PlayCircle, 
  PauseCircle, 
  RefreshCw, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  BarChart3,
  Settings,
  LogOut
} from "lucide-react"
import ContentReviewQueue from "./content-review-queue"
import PlatformConnections from "./oauth/platform-connections"
import EngagementDashboard from "./analytics/engagement-dashboard"

interface QueueStats {
  total: number
  pending: number
  approved: number
  rejected: number
  published: number
  nextScheduled: string | null
  bufferDays: number
}

interface PublishingStats {
  total: number
  successful: number
  failed: number
  lastPublished: string | null
  platformSuccess: Record<string, { total: number; successful: number }>
}

export default function AutomationControlPanel() {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null)
  const [publishingStats, setPublishingStats] = useState<PublishingStats | null>(null)
  const [cronStatus, setCronStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const [queueRes, publishRes, cronRes] = await Promise.all([
        fetch('/api/admin/queue-stats'),
        fetch('/api/admin/publishing-stats'),
        fetch('/api/health/cron-status')
      ])

      const queueData = await queueRes.json()
      const publishData = await publishRes.json()
      const cronData = await cronRes.json()

      setQueueStats(queueData)
      setPublishingStats(publishData)
      setCronStatus(cronData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerManualPublish = async () => {
    try {
      const res = await fetch('/api/admin/manual-publish', { method: 'POST' })
      const data = await res.json()
      alert(data.success ? 'Published successfully!' : `Error: ${data.error}`)
      loadDashboardData()
    } catch (error) {
      alert('Failed to trigger publish')
    }
  }

  const triggerContentGeneration = async () => {
    try {
      const res = await fetch('/api/admin/generate-content', { method: 'POST' })
      const data = await res.json()
      alert(data.success ? `Generated ${data.count} items` : `Error: ${data.error}`)
      loadDashboardData()
    } catch (error) {
      alert('Failed to trigger generation')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Automation Control Panel</h1>
          <p className="text-muted-foreground">Monitor and manage automated content publishing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleLogout} variant="ghost" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Content Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{queueStats?.approved || 0}</div>
            <p className="text-xs text-muted-foreground">Approved posts ready</p>
            <div className="mt-2 flex gap-2">
              <Badge variant="secondary">{queueStats?.pending || 0} Pending</Badge>
              <Badge variant="outline">{queueStats?.bufferDays || 0} days buffer</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Publishing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{publishingStats?.successful || 0}</div>
            <p className="text-xs text-muted-foreground">Total successful publishes</p>
            <div className="mt-2">
              <Badge variant="destructive">{publishingStats?.failed || 0} Failed</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {cronStatus?.overall === 'healthy' ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <span className="text-2xl font-bold capitalize">{cronStatus?.overall || 'Unknown'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {cronStatus?.warnings?.length || 0} warnings, {cronStatus?.errors?.length || 0} errors
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Controls</CardTitle>
          <CardDescription>Manual overrides and emergency actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={triggerManualPublish} className="w-full">
              <PlayCircle className="w-4 h-4 mr-2" />
              Publish Now
            </Button>
            <Button onClick={triggerContentGeneration} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Content
            </Button>
            <Button variant="destructive" className="w-full">
              <PauseCircle className="w-4 h-4 mr-2" />
              Pause Automation
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Content Queue</TabsTrigger>
          <TabsTrigger value="history">Publishing History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="oauth">Platform Connections</TabsTrigger>
          <TabsTrigger value="cron">Cron Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <ContentReviewQueue />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Publishing Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Publishing history will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <EngagementDashboard />
        </TabsContent>

        <TabsContent value="oauth">
          <PlatformConnections />
        </TabsContent>

        <TabsContent value="cron">
          <Card>
            <CardHeader>
              <CardTitle>Cron Job Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cronStatus?.jobs && Object.entries(cronStatus.jobs).map(([key, job]: [string, any]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{job.name}</span>
                      <Badge variant={job.status === 'healthy' ? 'default' : 'destructive'}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Last Run: {job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}</p>
                      <p>Next Run: {job.nextRun ? new Date(job.nextRun).toLocaleString() : 'Not scheduled'}</p>
                      <p>Status: {job.lastStatus}</p>
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
