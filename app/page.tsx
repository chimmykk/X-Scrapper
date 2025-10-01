"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Search, Settings, Brain, Download, Users, Clock } from "lucide-react"
import { RealTimeDashboard } from "@/components/real-time-dashboard"
import { UserSidebar } from "@/components/user-sidebar"
import { CronControl } from "@/components/cron-control"
import Link from "next/link"

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSource, setSelectedSource] = useState("twitter")
  const [resultCount, setResultCount] = useState("10")
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)
  const [showDashboard, setShowDashboard] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false)
      setShowDashboard(true)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <X className="w-6 h-6 text-white" />
            <span className="text-xl font-bold">X Scraper</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Search live & historical data</h1>
            <p className="text-gray-400 text-lg">Get live or archived results from X — ready for AI or analysis.</p>
          </div>

          {/* Source Selection */}
          <div className="flex gap-2 mb-6 justify-center">
            <Button
              variant={selectedSource === "twitter" ? "default" : "outline"}
              onClick={() => setSelectedSource("twitter")}
              className="bg-gray-800 hover:bg-gray-700 border-gray-700"
            >
              X/Twitter
            </Button>
          </div>

          {/* Search Interface */}
          <Card className="bg-gray-800 border-gray-700 p-6 mb-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search X/Twitter by keyword, account or trending topic"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search X
                  </>
                )}
              </Button>
            </div>

            {/* Search Options */}
            <div className="flex gap-4">
              <Select value={resultCount} onValueChange={setResultCount}>
                <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="10">Up to 10 results</SelectItem>
                  <SelectItem value="20">Up to 20 results</SelectItem>
                  <SelectItem value="50">Up to 50 results</SelectItem>
                  <SelectItem value="100">Up to 100 results</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                <Settings className="w-4 h-4 mr-2" />
                Query builder
              </Button>

              <Button variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                <Brain className="w-4 h-4 mr-2" />
                Deep Archive (All)
              </Button>
            </div>
          </Card>

          {/* Dashboard Toggle */}
          <div className="flex gap-4 mb-6 justify-center">
            <Button
              variant={showDashboard ? "default" : "outline"}
              onClick={() => setShowDashboard(!showDashboard)}
              className="bg-gray-800 hover:bg-gray-700 border-gray-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Track & Manage Users
            </Button>
            <Link href="/bulk-scraper">
              <Button variant="outline" className="bg-gray-800 hover:bg-gray-700 border-gray-700">
                <Download className="w-4 h-4 mr-2" />
                Bulk Download
              </Button>
            </Link>
          </div>

          {/* Real-time Dashboard */}
          {showDashboard && (
            <div className="space-y-6">
              <div className="flex gap-6">
                <div className="w-80">
                  <UserSidebar onUserSelect={setSelectedUsername} />
                  <div className="mt-4">
                    <CronControl />
                  </div>
                </div>
                <div className="flex-1">
                  <RealTimeDashboard 
                    username={selectedUsername} 
                    resultCount={parseInt(resultCount)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
