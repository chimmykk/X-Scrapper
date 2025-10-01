import { promises as fs } from "fs"
import path from "path"

export interface BulkTweet {
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

export interface BulkScrapingResult {
  totalTweets: number
  totalPages: number
  csvPath: string | null
}

export interface BulkProgress {
  isRunning: boolean
  currentPage: number
  totalTweets: number
  status: string
  error?: string
  downloadUrl?: string
}

export class BulkTwitterScraper {
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

  async saveConfig(): Promise<void> {
    if (!this.config) {
      throw new Error("Config not loaded")
    }
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2))
  }

  async ensureDirectories(): Promise<void> {
    if (!this.config) {
      throw new Error("Config not loaded")
    }

    const bulkDir = path.join(process.cwd(), "bulk-downloads")
    const storeCsvDir = path.join(process.cwd(), this.config.storageFolder.csv)
    const storeJsonDir = path.join(process.cwd(), this.config.storageFolder.json)
    
    try {
      await fs.mkdir(bulkDir, { recursive: true })
      await fs.mkdir(storeCsvDir, { recursive: true })
      await fs.mkdir(storeJsonDir, { recursive: true })
    } catch (_) {
      // Directory already exists
    }
  }

  async fetchTweets(username: string, sinceDate: string, cursor: string | null = null): Promise<any> {
    if (!this.config) {
      throw new Error("Config not loaded")
    }

    const baseUrl = "https://api.twitterapi.io/twitter/tweet/advanced_search"
    const queryParams = new URLSearchParams({
      queryType: "Latest",
      query: `from:${username} since:${sinceDate} -filter:nativeretweets -filter:retweets`,
    })

    if (cursor) {
      queryParams.append("cursor", cursor)
    }

    const url = `${baseUrl}?${queryParams.toString()}`

    console.log(`[v0] Fetching tweets from: ${url}`)

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
      console.log(`[v0] API Response - tweets: ${data.tweets?.length || 0}, has_next: ${data.has_next_page}`)

      return data
    } catch (error) {
      console.error(`[v0] Error fetching tweets for ${username}:`, error)
      throw error
    }
  }

  async saveToCsv(filepath: string, tweets: BulkTweet[], isFirstBatch = false): Promise<void> {
    const headers = [
      "id",
      "url",
      "text",
      "source",
      "retweetCount",
      "replyCount",
      "likeCount",
      "quoteCount",
      "viewCount",
      "createdAt",
      "lang",
      "bookmarkCount",
      "isReply",
      "inReplyToId",
      "conversationId",
      "authorUserName",
      "authorName",
      "authorFollowers",
      "authorFollowing",
      "authorDescription",
    ]

    let csv = ""
    if (isFirstBatch) {
      csv += headers.join(",") + "\n"
    }

    for (const tweet of tweets) {
      const row = [
        `"${tweet.id || ""}"`,
        `"${tweet.url || ""}"`,
        `"${(tweet.text || "").replace(/"/g, '""')}"`,
        `"${tweet.source || ""}"`,
        tweet.retweetCount || 0,
        tweet.replyCount || 0,
        tweet.likeCount || 0,
        tweet.quoteCount || 0,
        tweet.viewCount || 0,
        `"${tweet.createdAt || ""}"`,
        `"${tweet.lang || ""}"`,
        tweet.bookmarkCount || 0,
        tweet.isReply || false,
        `"${tweet.inReplyToId || ""}"`,
        `"${tweet.conversationId || ""}"`,
        `"${tweet.author?.userName || ""}"`,
        `"${tweet.author?.name || ""}"`,
        tweet.author?.followers || 0,
        tweet.author?.following || 0,
        `"${(tweet.author?.description || "").replace(/"/g, '""')}"`,
      ]
      csv += row.join(",") + "\n"
    }

    if (isFirstBatch) {
      await fs.writeFile(filepath, csv)
    } else {
      await fs.appendFile(filepath, csv)
    }
  }

  async saveToJson(filepath: string, tweets: BulkTweet[], isFirstBatch = false): Promise<void> {
    let existingTweets: BulkTweet[] = []
    
    // If not first batch, try to read existing tweets
    if (!isFirstBatch) {
      try {
        const existingData = await fs.readFile(filepath, "utf8")
        existingTweets = JSON.parse(existingData)
      } catch (_) {
        // File doesn't exist or is invalid, start fresh
        existingTweets = []
      }
    }
    
    // Combine existing and new tweets
    const allTweets = [...existingTweets, ...tweets]
    
    // Write all tweets to file
    await fs.writeFile(filepath, JSON.stringify(allTweets, null, 2))
  }

  async updateUserTimestamp(username: string, sinceDate: string): Promise<void> {
    if (!this.config) {
      throw new Error("Config not loaded")
    }

    // Find the user in config
    const userIndex = this.config.users.findIndex((user: any) => user.username === username)
    
    if (userIndex !== -1) {
      // Update existing user's timestamp
      this.config.users[userIndex].lastTimestampScrape = sinceDate
      console.log(`[v0] Updated lastTimestampScrape for ${username}: ${sinceDate}`)
    } else {
      // Add new user to config if not found
      const newUser = {
        username,
        lastTimestampScrape: sinceDate
      }
      this.config.users.push(newUser)
      console.log(`[v0] Added new user ${username} to config with timestamp: ${sinceDate}`)
    }

    // Save updated config
    await this.saveConfig()
    console.log(`[v0] Config.json updated for user: ${username}`)
  }

  async scrapeUserBulk(
    username: string,
    sinceDate: string,
    onProgress: (progress: BulkProgress) => void,
    sessionId?: string,
    shouldStop?: () => boolean,
  ): Promise<BulkScrapingResult> {
    console.log(`[v0] Starting bulk scrape for: ${username} since: ${sinceDate}`)

    await this.loadConfig()
    await this.ensureDirectories()

    if (!this.config) {
      throw new Error("Config not loaded")
    }

    // Use config-based paths
    const csvPath = path.join(process.cwd(), this.config.storageFolder.csv, `${username}.csv`)
    const bulkCsvPath = path.join(process.cwd(), "bulk-downloads", `${username}.csv`)
    const jsonPath = path.join(process.cwd(), this.config.storageFolder.json, `${username}.json`)

    // Check if files already exist to determine if we should append
    let isFirstBatch = true
    try {
      await fs.access(csvPath)
      isFirstBatch = false
    } catch (_) {
      // File doesn't exist, will create new
    }

    let cursor: string | null = null
    let pageCount = 0
    let totalTweets = 0
    let allTweets: BulkTweet[] = []

    try {
      // Unlimited pagination - keep going until no more tweets
      while (true) {
        // Check if we should stop
        if (shouldStop && shouldStop()) {
          console.log(`[v0] Scraping stopped by user for ${username}`)
          break
        }

        pageCount++

        onProgress({
          isRunning: true,
          currentPage: pageCount,
          totalTweets,
          status: `Fetching page ${pageCount}...`,
        })

        console.log(`[v0] Fetching page ${pageCount}...`)
        const response = await this.fetchTweets(username, sinceDate, cursor)

        if (!response.tweets || response.tweets.length === 0) {
          console.log(`[v0] No more tweets found, stopping at page ${pageCount}`)
          break
        }

        // Filter out replies using both isReply field and text content
        const originalTweets: BulkTweet[] = response.tweets.filter((tweet: any) => {
          const isNotReply = !tweet.isReply
          const isNotReplyByText = !tweet.text?.startsWith('@')
          const isNotRetweet = !tweet.text?.startsWith('RT @')
          
          return isNotReply && isNotReplyByText && isNotRetweet
        })
        
        console.log(
          `[v0] Found ${response.tweets.length} total tweets, ${originalTweets.length} original tweets on page ${pageCount}`,
        )

        // Save only original tweets (not replies)
        if (originalTweets.length > 0) {
          // Add to our collection
          allTweets.push(...originalTweets)
          totalTweets += originalTweets.length
        }

        onProgress({
          isRunning: true,
          currentPage: pageCount,
          totalTweets,
          status: `Downloaded ${totalTweets} original tweets...`,
        })

        // Check if there are more pages
        if (!response.has_next_page || !response.next_cursor) {
          console.log(`[v0] No more pages available, stopping at page ${pageCount}`)
          break
        }

        cursor = response.next_cursor

        // Add delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      console.log(`[v0] Bulk scraping completed. Total original tweets: ${totalTweets}, Total pages: ${pageCount}`)

      // Save all tweets to files if we have any
      if (totalTweets > 0) {
        // Save to storecsv (append to existing file)
        await this.saveToCsv(csvPath, allTweets, isFirstBatch)
        
        // Save copy to bulk-downloads (overwrite)
        await this.saveToCsv(bulkCsvPath, allTweets, true)
        
        // Save JSON version to storejson
        await this.saveToJson(jsonPath, allTweets, isFirstBatch)

        // Update config.json with lastTimestampScrape
        await this.updateUserTimestamp(username, sinceDate)
      }

      return {
        totalTweets,
        totalPages: pageCount,
        csvPath: totalTweets > 0 ? bulkCsvPath : null,
      }
    } catch (error) {
      console.error(`[v0] Bulk scraping failed:`, error)
      throw error
    }
  }
}
