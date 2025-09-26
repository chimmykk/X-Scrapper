"use client"

import { useState } from "react"
import { UserSidebar } from "@/components/user-sidebar"
import { TweetDisplay } from "@/components/tweet-display"
import { CronControl } from "@/components/cron-control"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)

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
