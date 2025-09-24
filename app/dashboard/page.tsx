"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { EngagementTweetCard } from "@/components/engagement-tweet-card"
import Link from "next/link"

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

interface User {
  username: string
  lastTimestampScrape: string | null
}

export default function DashboardPage() {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState<number>(15) // initial render count (10-20 range)
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const PAGE_SIZE = 10

  useEffect(() => {
    loadTweets()
  }, [])

  const loadTweets = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Step 1: fetch list of users
      const usersRes = await fetch("/api/users")
      if (!usersRes.ok) {
        throw new Error(`Failed to fetch users. status: ${usersRes.status}`)
      }
      const usersData = await usersRes.json()
      const users: User[] = usersData.users || []

      if (users.length === 0) {
        setTweets([])
        setVisibleCount(15)
        return
      }

      // Step 2: fetch tweets for each user in parallel
      const tweetsArrays = await Promise.all(
        users.map(async (user) => {
          try {
            const res = await fetch(`/api/tweets/${encodeURIComponent(user.username)}`)
            if (!res.ok) throw new Error(`status ${res.status}`)
            const json = await res.json()
            return Array.isArray(json.tweets) ? json.tweets : []
          } catch (e) {
            console.error(`Failed fetching tweets for ${user.username}:`, e)
            return []
          }
        }),
      )

      // Flatten all tweets into one array
      const allTweets = tweetsArrays.flat()

      if (allTweets.length > 0) {
        // Sort tweets by date (newest first) and filter out replies
        const sortedTweets = allTweets
          .filter((tweet: Tweet) => !tweet.isReply)
          .sort((a: Tweet, b: Tweet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        setTweets(sortedTweets)
        setVisibleCount(15)
      } else {
        setTweets([])
        setVisibleCount(15)
      }
    } catch (error) {
      console.error("Error loading tweets:", error)
      setError(error instanceof Error ? error.message : "Failed to load tweets")
    } finally {
      setIsLoading(false)
    }
  }

  const loadMore = useCallback(() => {
    if (isFetchingMore) return
    // Do nothing if we've already displayed all tweets
    if (visibleCount >= tweets.length) return
    setIsFetchingMore(true)
    // Simulate async expansion to keep UX consistent; no extra network calls needed since we already have all tweets
    requestAnimationFrame(() => {
      setVisibleCount((prev) => prev + PAGE_SIZE)
      setIsFetchingMore(false)
    })
  }, [isFetchingMore, visibleCount, tweets.length])

  useEffect(() => {
    if (!sentinelRef.current) return
    const node = sentinelRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && visibleCount < tweets.length) {
          loadMore()
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 },
    )

    observer.observe(node)
    return () => {
      observer.unobserve(node)
      observer.disconnect()
    }
  }, [loadMore, visibleCount, tweets.length])

  const displayedTweets = tweets.slice(0, visibleCount)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">Loading tweets...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center text-destructive">
              <p className="text-lg">Error loading tweets</p>
              <p className="text-sm mt-2">{error}</p>
              <Button onClick={loadTweets} className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scraper
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Engagement Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={loadTweets} disabled={isLoading}>
              Refresh
            </Button>
          </div>
        </div>

        {tweets.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">No tweets found</p>
              <p className="text-sm mt-2">Try adding some users and running the scraper first.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 text-sm text-muted-foreground">
              Showing {Math.min(displayedTweets.length, tweets.length)} of {tweets.length} tweets
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedTweets.map((tweet) => (
                <EngagementTweetCard key={tweet.id} tweet={tweet} />
              ))}
            </div>
            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-10 w-full" />
            {isFetchingMore && (
              <div className="flex items-center justify-center py-6 text-muted-foreground">Loading more…</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
