import { promises as fs } from "fs"
import path from "path"

export interface LiveTweet {
  id: string
  url: string
  text: string
  source: string
  retweetCount: number
  replyCount: number
  likeCount: number
  quoteCount: number
  viewCount: number
  createdAt: string
  lang: string
  bookmarkCount: number
  isReply: boolean
  inReplyToId: string
  conversationId: string
  author: {
    userName: string
    name: string
    followers: number
    following: number
    description: string
    profilePicture?: string
  }
}

export interface LiveScrapingResult {
  tweets: LiveTweet[]
  totalCount: number
  query: string
}

export class LiveTwitterScraper {
  private configPath: string
  private config: any = null

  constructor(configPath = "config.json") {
    this.configPath = path.join(process.cwd(), configPath)
  }

  async loadConfig(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, "utf8")
      this.config = JSON.parse(configData)
    } catch (error) {
      throw new Error(`Failed to load config.json: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async fetchLiveTweets(searchQuery: string, resultCount: number = 10): Promise<LiveScrapingResult> {
    if (!this.config) {
      throw new Error("Config not loaded")
    }

    const baseUrl = "https://api.twitterapi.io/twitter/tweet/advanced_search"
    const queryParams = new URLSearchParams({
      queryType: "Latest",
      query: searchQuery,
      limit: resultCount.toString()
    })

    const url = `${baseUrl}?${queryParams.toString()}`

    console.log(`[LiveScraper] Fetching live tweets for query: ${searchQuery}`)

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-Key": this.config.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`[LiveScraper] Found ${data.tweets?.length || 0} tweets for query: ${searchQuery}`)

      return {
        tweets: data.tweets || [],
        totalCount: data.tweets?.length || 0,
        query: searchQuery
      }
    } catch (error) {
      console.error(`[LiveScraper] Error fetching live tweets for ${searchQuery}:`, error)
      throw error
    }
  }

  async searchTweets(searchQuery: string, resultCount: number = 10): Promise<LiveScrapingResult> {
    await this.loadConfig()
    return await this.fetchLiveTweets(searchQuery, resultCount)
  }
}

export async function searchLiveTweets(searchQuery: string, resultCount: number = 10): Promise<LiveScrapingResult> {
  const scraper = new LiveTwitterScraper()
  return await scraper.searchTweets(searchQuery, resultCount)
}
