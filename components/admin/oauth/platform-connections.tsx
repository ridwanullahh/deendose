"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RefreshCw, ExternalLink } from "lucide-react"

interface PlatformStatus {
  platform: string
  connected: boolean
  tokenExpiry: string | null
  lastChecked: string
  scope?: string
}

export default function PlatformConnections() {
  const [platforms, setPlatforms] = useState<PlatformStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlatformStatus()
  }, [])

  const loadPlatformStatus = async () => {
    try {
      const response = await fetch('/api/admin/oauth/status')
      const data = await response.json()
      setPlatforms(data.platforms)
    } catch (error) {
      console.error('Failed to load platform status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (platform: string) => {
    try {
      const response = await fetch(`/api/admin/oauth/connect/${platform}`)
      const { authUrl } = await response.json()
      
      window.open(authUrl, 'oauth', 'width=600,height=700')
      
      window.addEventListener('message', (event) => {
        if (event.data.type === 'oauth-success') {
          loadPlatformStatus()
        }
      })
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error)
    }
  }

  const handleRefresh = async (platform: string) => {
    try {
      await fetch(`/api/admin/oauth/refresh/${platform}`, { method: 'POST' })
      loadPlatformStatus()
    } catch (error) {
      console.error(`Failed to refresh ${platform}:`, error)
    }
  }

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Disconnect ${platform}?`)) return
    
    try {
      await fetch(`/api/admin/oauth/disconnect/${platform}`, { method: 'POST' })
      loadPlatformStatus()
    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error)
    }
  }

  if (loading) {
    return <div>Loading platform status...</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.platform}
            platform={platform}
            onConnect={handleConnect}
            onRefresh={handleRefresh}
            onDisconnect={handleDisconnect}
          />
        ))}
      </div>
    </div>
  )
}

function PlatformCard({
  platform,
  onConnect,
  onRefresh,
  onDisconnect
}: {
  platform: PlatformStatus
  onConnect: (platform: string) => void
  onRefresh: (platform: string) => void
  onDisconnect: (platform: string) => void
}) {
  const isExpiringSoon = platform.tokenExpiry 
    ? new Date(platform.tokenExpiry).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false

  const isExpired = platform.tokenExpiry
    ? new Date(platform.tokenExpiry).getTime() < Date.now()
    : false

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="capitalize">{platform.platform}</CardTitle>
            <CardDescription>
              {platform.connected ? 'Connected' : 'Not connected'}
            </CardDescription>
          </div>
          {platform.connected ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {platform.connected && platform.tokenExpiry && (
          <div className="text-sm">
            <p className="text-muted-foreground">Token expires:</p>
            <p className={isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : ''}>
              {new Date(platform.tokenExpiry).toLocaleDateString()}
            </p>
            {isExpiringSoon && !isExpired && (
              <Badge variant="warning" className="mt-1">Expiring Soon</Badge>
            )}
            {isExpired && (
              <Badge variant="destructive" className="mt-1">Expired</Badge>
            )}
          </div>
        )}

        {platform.scope && (
          <div className="text-sm">
            <p className="text-muted-foreground">Permissions:</p>
            <p className="text-xs">{platform.scope}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!platform.connected ? (
            <Button
              onClick={() => onConnect(platform.platform)}
              className="flex-1"
              size="sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect
            </Button>
          ) : (
            <>
              <Button
                onClick={() => onRefresh(platform.platform)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => onDisconnect(platform.platform)}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
