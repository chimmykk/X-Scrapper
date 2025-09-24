"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Repeat2 } from "lucide-react"
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
  isReply: boolean
  author: {
    name: string
    userName: string
    profilePicture?: string
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

interface TweetDisplayProps {
  username: string | null
}

export function TweetDisplay({ username }: TweetDisplayProps) {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (username) {
      fetchTweets(username)
    }
  }, [username])

  const fetchTweets = async (user: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tweets/${encodeURIComponent(user)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      if (data.success && data.tweets) {
        // Sort tweets by date (newest first) and filter out replies
        const sortedTweets = data.tweets
          .filter((tweet: Tweet) => !tweet.isReply)
          .sort((a: Tweet, b: Tweet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setTweets(sortedTweets)
      } else {
        setTweets([])
      }
    } catch (err) {
      console.error("Error fetching tweets:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch tweets")
      setTweets([])
    } finally {
      setIsLoading(false)
    }
  }

  const processTweetText = (text: string) => {
    if (!text) return ""

    // Replace URLs
    let processedText = text.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$&" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$&</a>',
    )

    // Replace mentions
    processedText = processedText.replace(
      /@(\w+)/g,
      '<a href="https://twitter.com/$1" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">@$1</a>',
    )

    // Replace hashtags
    processedText = processedText.replace(
      /#(\w+)/g,
      '<a href="https://twitter.com/hashtag/$1" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">#$1</a>',
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

  if (!username) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Select a user to view their tweets</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Loading tweets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-destructive">
          <p className="text-lg">Error: {error}</p>
        </div>
      </div>
    )
  }

  if (tweets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">No tweets found for @{username}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">@{username} Tweets</h2>
        <Badge variant="secondary">{tweets.length} tweets</Badge>
      </div>

      <div className="space-y-4">
        {tweets.map((tweet) => (
          <Card key={tweet.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex gap-3">
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
                    className="font-bold hover:underline"
                  >
                    {tweet.author.name}
                  </a>
                  <a
                    href={`https://twitter.com/${tweet.author.userName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:underline"
                  >
                    @{tweet.author.userName}
                  </a>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground text-sm">{dayjs(tweet.createdAt).fromNow()}</span>
                </div>

                <div
                  className="mb-3 whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: processTweetText(tweet.text) }}
                />

                {tweet.extendedEntities?.media?.[0] && (
                  <div className="mb-3">
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

                <div className="flex items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{formatNumber(tweet.replyCount || 0)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Repeat2 className="w-4 h-4" />
                    <span className="text-sm">{formatNumber(tweet.retweetCount || 0)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">{formatNumber(tweet.likeCount || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
