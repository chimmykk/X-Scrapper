"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, Loader2, Play, CheckCircle, XCircle, ArrowLeft, Users, Brain } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function BulkScraperPage() {
  const [username, setUsername] = useState("")
  const [sinceDate, setSinceDate] = useState<Date>()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isScraping, setIsScraping] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // AI Analysis states
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [aiUsername, setAiUsername] = useState("")
  const [aiQuery, setAiQuery] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const startBulkScraping = async () => {
    if (!username.trim()) {
      alert("Please enter a username")
      return
    }

    if (!sinceDate) {
      alert("Please select a start date")
      return
    }

    setIsScraping(true)
    setIsCompleted(false)
    setError(null)

    try {
      const response = await fetch("/api/bulk-scraper/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          sinceDate: format(sinceDate, "yyyy-MM-dd_HH:mm:ss_'UTC'"),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Wait for completion (simplified - no polling)
        setTimeout(() => {
          setIsScraping(false)
          setIsCompleted(true)
        }, 30000) // Wait 30 seconds as a rough estimate
      } else {
        throw new Error(data.error || "Failed to start scraping")
      }
    } catch (error) {
      console.error("Error starting bulk scraping:", error)
      setIsScraping(false)
      setError(error instanceof Error ? error.message : "Unknown error")
    }
  }

  const resetForm = () => {
    setIsScraping(false)
    setIsCompleted(false)
    setError(null)
    setUsername("")
    setSinceDate(undefined)
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

  const handleDateSelect = (date: Date | undefined) => {
    // Only close the popover when a valid date is selected
    if (date) {
      setSinceDate(date)
      setCalendarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Tracked Users
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">Bulk Tweet Scraper</h1>
          <p className="text-center text-muted-foreground">Download all historical tweets from any X/Twitter user</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Enter a username and select a start date</li>
             
              <li>• Files are saved to the "Tracked Users" section on the home page</li>
              <li>• You can download the CSV file from there once scraping is complete</li>
            </ul>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            {/* Username Input */}
            <div className="space-y-2">
              <Label htmlFor="username">X/Twitter Username</Label>
              <Input
                id="username"
                placeholder="Enter username (without @)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isScraping}
              />
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Start Date (scrape tweets since this date)</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !sinceDate && "text-muted-foreground")}
                    disabled={isScraping}
                    type="button"
                    onClick={() => setCalendarOpen(true)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {sinceDate ? format(sinceDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={sinceDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!isScraping && !isCompleted ? (
                <>
                  <Button onClick={startBulkScraping} className="flex-1" size="lg">
                    <Play className="w-4 h-4 mr-2" />
                    Start Bulk Scraping
                  </Button>
                  <Button 
                    onClick={() => setShowAIAnalysis(true)} 
                    variant="outline" 
                    className="flex-1" 
                    size="lg"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Analyze with AI
                  </Button>
                </>
              ) : isScraping ? (
                <Button disabled className="flex-1" size="lg">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scraping in Progress...
                </Button>
              ) : (
                <div className="flex gap-2 w-full">
                  <Button onClick={resetForm} variant="outline" className="flex-1" size="lg">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                  <Button onClick={resetForm} className="flex-1" size="lg">
                    <Play className="w-4 h-4 mr-2" />
                    Scrape Another User
                  </Button>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {isScraping && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Scraping in progress...</p>
                    <p className="text-sm text-blue-700">This may take a few minutes. Please wait.</p>
                  </div>
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Scraping completed!</p>
                    <p className="text-sm text-green-700">
                      Tweets from @{username} have been saved. Check the "Tracked Users" section on the home page to download the CSV file.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">Error occurred</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground space-y-1">
          <p>Files are automatically saved to the "Tracked Users" section on the home page.</p>
        </div>

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
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                      <p className="text-sm text-gray-600 mt-1">{analysisResult.summary}</p>
                    </div>
                    <div>
                      <strong>Sentiment:</strong>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        analysisResult.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                        analysisResult.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {analysisResult.sentiment}
                      </span>
                    </div>
                    {analysisResult.keyInsights && analysisResult.keyInsights.length > 0 && (
                      <div>
                        <strong>Key Insights:</strong>
                        <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                          {analysisResult.keyInsights.map((insight: string, index: number) => (
                            <li key={index}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysisResult.topics && analysisResult.topics.length > 0 && (
                      <div>
                        <strong>Topics:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysisResult.topics.map((topic: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysisResult.notableAccounts && analysisResult.notableAccounts.length > 0 && (
                      <div>
                        <strong>Notable Accounts:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysisResult.notableAccounts.map((account: string, index: number) => (
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
  )
}
