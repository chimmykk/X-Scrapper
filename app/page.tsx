"use client"

import { useState } from "react"
import { UserSidebar } from "@/components/user-sidebar"
import { TweetDisplay } from "@/components/tweet-display"
import { CronControl } from "@/components/cron-control"

export default function HomePage() {
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center">Twitter Scraper Dashboard</h1>
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
