"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Trash2, Download, Loader2 } from "lucide-react"

interface User {
  username: string
  lastTimestampScrape: string | null
}

interface UserSidebarProps {
  onUserSelect: (username: string) => void
}

export function UserSidebar({ onUserSelect }: UserSidebarProps) {
  const [users, setUsers] = useState<User[]>([])
  const [newUsername, setNewUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/users")
      if (!response.ok) {
        throw new Error(`Failed to load users: ${response.status}`)
      }
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addUser = async () => {
    if (!newUsername.trim()) return

    try {
      setIsAddingUser(true)
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: newUsername.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add user")
      }

      setNewUsername("")
      await loadUsers()
      onUserSelect(newUsername.trim())
    } catch (error) {
      console.error("Error adding user:", error)
      alert(error instanceof Error ? error.message : "Failed to add user")
    } finally {
      setIsAddingUser(false)
    }
  }

  const deleteUser = async (username: string) => {
    if (!confirm(`Remove @${username} from tracked users?`)) return

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(username)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      await loadUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Failed to remove user")
    }
  }

  const exportTweets = async (username: string) => {
    try {
      const response = await fetch(`/api/tweets/${encodeURIComponent(username)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      if (data.success && data.tweets && data.tweets.length > 0) {
        // Convert to CSV
        const flatTweets = data.tweets.map((tweet: any) => ({
          id: tweet.id,
          text: tweet.text?.replace(/[\n\r]+/g, " ") || "",
          createdAt: tweet.createdAt,
          likes: tweet.likeCount || 0,
          retweets: tweet.retweetCount || 0,
          replies: tweet.replyCount || 0,
          url: `https://twitter.com/${tweet.author?.userName}/status/${tweet.id}`,
          author: tweet.author?.name || "",
          username: tweet.author?.userName || "",
        }))

        const csv = convertToCSV(flatTweets)
        downloadCSV(csv, `${username}_tweets_${new Date().toISOString().split("T")[0]}.csv`)
      } else {
        alert("No tweets found to export")
      }
    } catch (error) {
      console.error("Error exporting CSV:", error)
      alert("Failed to export tweets")
    }
  }

  const convertToCSV = (items: any[]) => {
    if (!items || !items.length) return ""

    const headers = Object.keys(items[0])
    const csvRows = [headers.join(",")]

    for (const item of items) {
      const values = headers.map((header) => {
        const value = item[header] !== undefined ? item[header] : ""
        const escaped = String(value).replace(/"/g, '""')
        return `"${escaped}"`
      })
      csvRows.push(values.join(","))
    }

    return csvRows.join("\n")
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="w-64 p-4 bg-card border-border">
      <div className="space-y-4">
        <div className="text-center">
          <Button
            onClick={() => (window.location.href = "/dashboard")}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Go to Engagement Dashboard
          </Button>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-foreground">Manage Users</h3>
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Enter username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addUser()}
              className="flex-1"
            />
            <Button onClick={addUser} disabled={isAddingUser || !newUsername.trim()} size="sm">
              {isAddingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2 text-muted-foreground">Tracked Users</h4>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No users found</div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                >
                  <button
                    onClick={() => onUserSelect(user.username)}
                    className="flex-1 text-left hover:text-primary cursor-pointer"
                  >
                    @{user.username}
                  </button>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exportTweets(user.username)}
                      className="h-6 w-6 p-0"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteUser(user.username)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
