"use client"

import { useState, useEffect } from "react"
import { UserSidebar } from "@/components/user-sidebar"
import { TweetDisplay } from "@/components/tweet-display"
import { CronControl } from "@/components/cron-control"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, FileText, Calendar, Trash2 } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)
  const [trackedUsers, setTrackedUsers] = useState<string[]>([])

  // Fetch tracked users (CSV files in storecsv folder)
  useEffect(() => {
    const fetchTrackedUsers = async () => {
      try {
        const response = await fetch('/api/tracked-users')
        if (response.ok) {
          const data = await response.json()
          setTrackedUsers(data.users || [])
        }
      } catch (error) {
        console.error('Error fetching tracked users:', error)
      }
    }

    fetchTrackedUsers()
  }, [])

  const downloadUserCSV = (username: string) => {
    const link = document.createElement("a")
    link.href = `/api/bulk-scraper/download/${username}`
    link.download = `${username}_tweets.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const deleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to remove @${username} from tracked users? This will delete all their data permanently.`)) {
      return
    }

    try {
      const response = await fetch(`/api/tracked-users/${username}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove from local state
        setTrackedUsers(prev => prev.filter(user => user !== username))
        console.log(`Successfully removed ${username} from tracked users`)
      } else {
        const errorData = await response.json()
        alert(`Failed to delete: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user. Please try again.')
    }
  }

  const refreshTrackedUsers = async () => {
    try {
      const response = await fetch('/api/tracked-users')
      if (response.ok) {
        const data = await response.json()
        setTrackedUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error refreshing tracked users:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center mb-4">Twitter Scraper Dashboard</h1>

          <div className="flex justify-center mb-6">
            <Card className="p-4 max-w-md">
              <div className="text-center space-y-3">
                <h2 className="font-semibold">Quick Bulk Download</h2>
                <p className="text-sm text-muted-foreground">Download all historical tweets from any user</p>
                <Link href="/bulk-scraper">
                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Bulk Tweet Scraper
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Tracked Users Section */}
          {trackedUsers.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Tracked Users</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshTrackedUsers}
                >
                  Refresh
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trackedUsers.map((username) => (
                  <Card key={username} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">@{username}</p>
                          <p className="text-sm text-muted-foreground">CSV Available</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => downloadUserCSV(username)}
                          className="shrink-0"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteUser(username)}
                          className="shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          <div className="space-y-4">
            <UserSidebar onUserSelect={setSelectedUsername} />
            <CronControl />
          </div>
          <TweetDisplay username={selectedUsername} />
        </div>
      </div>
    </div>
  )
}
