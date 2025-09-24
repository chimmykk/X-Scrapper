"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Repeat2, ExternalLink } from "lucide-react"
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

interface EngagementTweetCardProps {
  tweet: Tweet
}

export function EngagementTweetCard({ tweet }: EngagementTweetCardProps) {
  const [isEngaged, setIsEngaged] = useState(() => {
    if (typeof window !== "undefined") {
      const engagedTweets = JSON.parse(localStorage.getItem("engagedTweets") || "[]")
      return engagedTweets.includes(tweet.id)
    }
    return false
  })

  const toggleEngagement = () => {
    const engagedTweets = JSON.parse(localStorage.getItem("engagedTweets") || "[]")

    if (isEngaged) {
      // Remove from engaged tweets
      const updatedTweets = engagedTweets.filter((id: string) => id !== tweet.id)
      localStorage.setItem("engagedTweets", JSON.stringify(updatedTweets))
      setIsEngaged(false)
    } else {
      // Add to engaged tweets
      if (!engagedTweets.includes(tweet.id)) {
        engagedTweets.push(tweet.id)
        localStorage.setItem("engagedTweets", JSON.stringify(engagedTweets))
      }
      setIsEngaged(true)

      // Open tweet in new tab
      window.open(`https://twitter.com/i/web/status/${tweet.id}`, "_blank")
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

  return (
    <Card className={`p-4 transition-all hover:shadow-md ${isEngaged ? "border-l-4 border-l-green-500" : ""}`}>
      {isEngaged && <Badge className="mb-2 bg-green-500 hover:bg-green-600">Engaged</Badge>}

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

          <div className="flex items-center justify-between">
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

            <div className="flex gap-2">
              <Button
                variant={isEngaged ? "default" : "outline"}
                size="sm"
                onClick={toggleEngagement}
                className={isEngaged ? "bg-green-500 hover:bg-green-600" : ""}
              >
                <Heart className="w-4 h-4 mr-1" />
                {isEngaged ? "Engaged!" : "Engage"}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://twitter.com/${tweet.author.userName}/status/${tweet.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
