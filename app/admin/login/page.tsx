"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

// Inline SVG line icon (no emoji). A simple dome/minaret mark.
function AdminMarkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2c1.5 2 3 3 3 5a3 3 0 0 1-6 0c0-2 1.5-3 3-5Z" />
      <path d="M5 22V11a7 7 0 0 1 14 0v11" />
      <path d="M5 22h14" />
      <path d="M10 22v-4a2 2 0 0 1 4 0v4" />
    </svg>
  )
}

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const from = searchParams.get("from")
    if (from) {
      setError(`Please sign in to continue to ${from}`)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const from = searchParams.get("from")
        router.push(from && from.startsWith("/admin") ? from : "/admin")
        return
      }
      const data = await response.json().catch(() => ({}))
      setError(data.error || "Invalid username or password")
    } catch (err) {
      setError("Login failed. Please check your network and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <AdminMarkIcon className="w-10 h-10 text-green-800" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-800">
            DeenDose Admin
          </CardTitle>
          <CardDescription>
            Enter your administrator credentials to access the control panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-md text-sm"
              >
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Bismillah Ar-Rahman Ar-Roheem
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
