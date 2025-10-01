"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  const [searchResults, setSearchResults] = useState<any>(null)
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  // AI Analysis states
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [aiUsername, setAiUsername] = useState("")
  const [aiQuery, setAiQuery] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery: searchQuery.trim(),
          resultCount: parseInt(resultCount)
        })
      })

      const data = await response.json()
      
      if (data.success) {
        console.log('Search results:', data.data)
        setSearchResults(data.data)
        setShowSearchResults(true)
        setShowDashboard(false) // Hide dashboard when showing search results
      } else {
        console.error('Search failed:', data.error)
        alert(`Search failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleAIAnalysis = async () => {
    if (!aiUsername.trim() || !aiQuery.trim()) {
      alert("Please enter both username and query")
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: aiUsername.trim(),
          query: aiQuery.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setAnalysisResult(data)
    } catch (error) {
      console.error("Error analyzing with AI:", error)
      alert("Failed to analyze with AI. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
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
            <Button 
              onClick={() => setShowAIAnalysis(true)} 
              variant="outline" 
              className="bg-gray-800 hover:bg-gray-700 border-gray-700"
            >
              <Brain className="w-4 h-4 mr-2" />
              Analyze with AI
            </Button>
          </div>

          {/* Search Results */}
          {showSearchResults && searchResults && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Search Results</h2>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowSearchResults(false)
                    setSearchResults(null)
                  }}
                  className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close Results
                </Button>
              </div>
              
              <div className="space-y-4">
                {searchResults.tweets && searchResults.tweets.length > 0 ? (
                  searchResults.tweets.map((tweet: any, index: number) => (
                    <Card key={tweet.id || index} className="bg-gray-800 border-gray-700 p-4">
                      <div className="flex items-start gap-3">
                        {tweet.author?.profilePicture && (
                          <img 
                            src={tweet.author.profilePicture} 
                            alt={tweet.author.userName}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">{tweet.author?.name}</span>
                            <span className="text-gray-400">@{tweet.author?.userName}</span>
                            <span className="text-gray-500 text-sm">{new Date(tweet.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-gray-200 mb-3">{tweet.text}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>❤️ {tweet.likeCount || 0}</span>
                            <span>🔄 {tweet.retweetCount || 0}</span>
                            <span>💬 {tweet.replyCount || 0}</span>
                            <span>👁️ {tweet.viewCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="bg-gray-800 border-gray-700 p-6 text-center">
                    <p className="text-gray-400">No tweets found for your search query.</p>
                  </Card>
                )}
              </div>
            </div>
          )}

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

          {/* AI Analysis Dialog */}
          <Dialog open={showAIAnalysis} onOpenChange={setShowAIAnalysis}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Analysis
                </DialogTitle>
                <DialogDescription>
                  Analyze user's tweets with AI to get insights and summaries.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="ai-username">Username</Label>
                  <Input
                    id="ai-username"
                    placeholder="Enter username (e.g., elonmusk)"
                    value={aiUsername}
                    onChange={(e) => setAiUsername(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="ai-query">Analysis Query</Label>
                  <Textarea
                    id="ai-query"
                    placeholder="What would you like to analyze? (e.g., 'Analyze sentiment and key topics in recent tweets')"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleAIAnalysis} 
                    disabled={isAnalyzing || !aiUsername.trim() || !aiQuery.trim()}
                    className="flex-1"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAIAnalysis(false)}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Analysis Results */}
                {analysisResult && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-3">Analysis Results</h3>
                    <div className="space-y-3">
                      <div>
                        <strong>Summary:</strong>
                        <p className="text-sm text-gray-600 mt-1">{analysisResult.analysis?.summary}</p>
                      </div>
                      <div>
                        <strong>Sentiment:</strong>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          analysisResult.analysis?.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          analysisResult.analysis?.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {analysisResult.analysis?.sentiment}
                        </span>
                      </div>
                      {analysisResult.analysis?.keyInsights && analysisResult.analysis.keyInsights.length > 0 && (
                        <div>
                          <strong>Key Insights:</strong>
                          <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                            {analysisResult.analysis.keyInsights.map((insight: string, index: number) => (
                              <li key={index}>{insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysisResult.analysis?.topics && analysisResult.analysis.topics.length > 0 && (
                        <div>
                          <strong>Topics:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {analysisResult.analysis.topics.map((topic: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysisResult.analysis?.notableAccounts && analysisResult.analysis.notableAccounts.length > 0 && (
                        <div>
                          <strong>Notable Accounts:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {analysisResult.analysis.notableAccounts.map((account: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                @{account}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
