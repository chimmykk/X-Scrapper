"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Repeat2, Eye, Bookmark, Share, RefreshCw } from "lucide-react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

interface Tweet {
  id: string
  text: string
  createdAt: string
  likeCount: number
  retweetCount: number
  replyCount: number
  quoteCount: number
  viewCount: number
  bookmarkCount: number
  isReply: boolean
  author: {
    name: string
    userName: string
    profilePicture?: string
    followers: number
    following: number
  }
  extendedEntities?: {
    media?: Array<{
      type: string
      media_url_https: string
      video_info?: {
        variants: Array<{
          url: string
        }>
      }
    }>
  }
}

interface RealTimeDashboardProps {
  username: string | null
  resultCount: number
}

export function RealTimeDashboard({ username, resultCount }: RealTimeDashboardProps) {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoRefresh, setIsAutoRefresh] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchTweets = useCallback(async () => {
    if (!username) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tweets/${encodeURIComponent(username)}?limit=${resultCount}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      if (data.success && data.tweets) {
        // Filter out replies and sort by date (newest first)
        const filteredTweets = data.tweets
          .filter((tweet: Tweet) => !tweet.isReply)
          .sort((a: Tweet, b: Tweet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, resultCount)
        
        setTweets(filteredTweets)
        setLastUpdate(new Date())
      } else {
        setTweets([])
      }
    } catch (err) {
      console.error("Error fetching tweets:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch tweets")
    } finally {
      setIsLoading(false)
    }
  }, [username, resultCount])

  // Auto-refresh functionality
  useEffect(() => {
    if (isAutoRefresh && username) {
      const interval = setInterval(fetchTweets, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isAutoRefresh, username, fetchTweets])

  // Initial fetch
  useEffect(() => {
    if (username) {
      fetchTweets()
    }
  }, [username, fetchTweets])

  const processTweetText = (text: string) => {
    if (!text) return ""

    // Replace URLs
    let processedText = text.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$&" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$&</a>',
    )

    // Replace mentions
    processedText = processedText.replace(
      /@(\w+)/g,
      '<a href="https://twitter.com/$1" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">@$1</a>',
    )

    // Replace hashtags
    processedText = processedText.replace(
      /#(\w+)/g,
      '<a href="https://twitter.com/hashtag/$1" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">#$1</a>',
    )

    return processedText
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + "B"
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh)
  }

  if (!username) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-96">
        <div className="text-center text-gray-400">
          <p className="text-lg">Select a user to view their tweets</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">@{username} Tweets</h2>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
              {tweets.length} tweets
            </Badge>
            {lastUpdate && (
              <span className="text-sm text-gray-400">
                Last updated: {dayjs(lastUpdate).format("HH:mm:ss")}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchTweets}
            disabled={isLoading}
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant={isAutoRefresh ? "default" : "outline"}
            onClick={toggleAutoRefresh}
            className={isAutoRefresh ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"}
          >
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-red-900/20 border-red-800">
          <p className="text-red-400">Error: {error}</p>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && tweets.length === 0 && (
        <div className="flex-1 flex items-center justify-center min-h-96">
          <div className="text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg">Loading tweets...</p>
          </div>
        </div>
      )}

      {/* No Tweets State */}
      {!isLoading && tweets.length === 0 && !error && (
        <div className="flex-1 flex items-center justify-center min-h-96">
          <div className="text-center text-gray-400">
            <p className="text-lg">No tweets found for @{username}</p>
          </div>
        </div>
      )}

      {/* Tweets List */}
      {tweets.length > 0 && (
        <div className="space-y-4">
          {tweets.map((tweet) => (
            <Card key={tweet.id} className="p-6 bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
              <div className="flex gap-4">
                <img
                  src={
                    tweet.author.profilePicture ||
                    "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png"
                  }
                  alt={tweet.author.name}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png"
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <a
                      href={`https://twitter.com/${tweet.author.userName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-white hover:underline"
                    >
                      {tweet.author.name}
                    </a>
                    <a
                      href={`https://twitter.com/${tweet.author.userName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:underline"
                    >
                      @{tweet.author.userName}
                    </a>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-400 text-sm">{dayjs(tweet.createdAt).fromNow()}</span>
                  </div>

                  <div
                    className="mb-4 whitespace-pre-line text-white"
                    dangerouslySetInnerHTML={{ __html: processTweetText(tweet.text) }}
                  />

                  {/* Media */}
                  {tweet.extendedEntities?.media?.[0] && (
                    <div className="mb-4">
                      {tweet.extendedEntities.media[0].type === "photo" ? (
                        <img
                          src={tweet.extendedEntities.media[0].media_url_https || "/placeholder.svg"}
                          alt="Tweet media"
                          className="max-w-full rounded-lg"
                          loading="lazy"
                        />
                      ) : (
                        tweet.extendedEntities.media[0].type === "video" && (
                          <video
                            controls
                            className="max-w-full rounded-lg"
                            src={tweet.extendedEntities.media[0].video_info?.variants?.[0]?.url}
                          >
                            Your browser does not support the video tag.
                          </video>
                        )
                      )}
                    </div>
                  )}

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-6 text-gray-400">
                    <div className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">{formatNumber(tweet.replyCount || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-green-400 transition-colors">
                      <Repeat2 className="w-4 h-4" />
                      <span className="text-sm">{formatNumber(tweet.retweetCount || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-red-400 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">{formatNumber(tweet.likeCount || 0)}</span>
                    </div>
                    {tweet.quoteCount > 0 && (
                      <div className="flex items-center gap-1 hover:text-purple-400 transition-colors">
                        <Share className="w-4 h-4" />
                        <span className="text-sm">{formatNumber(tweet.quoteCount)}</span>
                      </div>
                    )}
                    {tweet.viewCount > 0 && (
                      <div className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">{formatNumber(tweet.viewCount)}</span>
                      </div>
                    )}
                    {tweet.bookmarkCount > 0 && (
                      <div className="flex items-center gap-1 hover:text-yellow-400 transition-colors">
                        <Bookmark className="w-4 h-4" />
                        <span className="text-sm">{formatNumber(tweet.bookmarkCount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

