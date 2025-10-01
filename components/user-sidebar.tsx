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
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      // Load users only from config.json (via /api/users)
      const response = await fetch("/api/users")
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        console.error("Failed to load users from config")
        setUsers([])
      }
    } catch (error) {
      console.error("Error loading users:", error)
      setUsers([])
    } finally {
      setIsLoading(false)
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

  const downloadUserCSV = (username: string) => {
    const link = document.createElement("a")
    link.href = `/api/bulk-scraper/download/${encodeURIComponent(username)}`
    link.download = `${username}_tweets.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="w-80 p-4 bg-gray-800 border-gray-700">
      <div className="space-y-4">
        <div className="text-center">
          <Button
            onClick={() => (window.location.href = "/dashboard")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Engagement Dashboard
          </Button>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-white">Manage Users</h3>
        </div>

        <div>
          <h4 className="font-medium mb-2 text-gray-300">Tracked Users</h4>
          {isLoading ? (
            <div className="text-center py-4 text-gray-400">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-gray-400">No users found</div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0"
                >
                  <button
                    onClick={() => onUserSelect(user.username)}
                    className="flex-1 text-left hover:text-blue-400 cursor-pointer text-white"
                  >
                    @{user.username}
                  </button>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadUserCSV(user.username)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteUser(user.username)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
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
