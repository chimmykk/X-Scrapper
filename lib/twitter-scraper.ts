import { promises as fs } from "fs"
import path from "path"

export interface User {
  username: string
  lastTimestampScrape: string | null
}

export interface Config {
  users: User[]
  apiKey: string
  maxPages: number
  storageFolder: {
    csv: string
    json: string
  }
}

export interface Tweet {
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

export class TwitterScraper {
  private configPath: string
  private config: Config | null = null

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

    const dirs = [this.config.storageFolder.csv, this.config.storageFolder.json]
    for (const dir of dirs) {
      try {
        await fs.mkdir(path.join(process.cwd(), dir), { recursive: true })
      } catch (_) {
        // Directory already exists
      }
    }
  }

  formatTimestamp(date: Date): string {
    return date.toISOString().replace(/:/g, "%3A").replace(/\./g, "_")
  }

  parseTimestamp(timestampStr: string): string {
    return timestampStr.replace(/%3A/g, ":").replace(/_/g, ".")
  }

  async fetchTweets(username: string, sinceTimestamp: string, cursor: string | null = null): Promise<any> {
    if (!this.config) {
      throw new Error("Config not loaded")
    }

    const baseUrl = "https://api.twitterapi.io/twitter/tweet/advanced_search"
    const queryParams = new URLSearchParams({
      queryType: "Latest",
      query: `from:${username} since:${sinceTimestamp}`,
    })

    if (cursor) {
      queryParams.append("cursor", cursor)
    }

    const url = `${baseUrl}?${queryParams.toString()}`

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

      return await response.json()
    } catch (error) {
      console.error(`Error fetching tweets for ${username}:`, error)
      throw error
    }
  }

  async loadExistingData(username: string, format: "json" | "csv"): Promise<Tweet[] | null> {
    if (!this.config) {
      throw new Error("Config not loaded")
    }

    const folder = this.config.storageFolder[format]
    const ext = format === "json" ? "json" : "csv"
    const file = path.join(process.cwd(), folder, `${username}.${ext}`)

    try {
      if (format === "json") {
        const data = await fs.readFile(file, "utf8")
        return JSON.parse(data)
      } else {
        return null
      }
    } catch (_) {
      return format === "json" ? [] : null
    }
  }

  async saveData(username: string, tweets: Tweet[], format: "json" | "csv"): Promise<void> {
    if (!this.config) {
      throw new Error("Config not loaded")
    }

    const folder = path.join(process.cwd(), this.config.storageFolder[format])
    const ext = format === "json" ? "json" : "csv"
    const filepath = path.join(folder, `${username}.${ext}`)

    // Ensure directory exists
    await fs.mkdir(folder, { recursive: true })

    if (format === "json") {
      const existing = (await this.loadExistingData(username, "json")) || []
      const combined = [...existing, ...tweets]
      await fs.writeFile(filepath, JSON.stringify(combined, null, 2))
      console.log(`JSON file saved/updated for ${username}: ${filepath}`)
    } else {
      await this.saveToCsv(filepath, tweets)
    }
  }

  async saveToCsv(filepath: string, tweets: Tweet[]): Promise<void> {
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

    let fileExists = false
    try {
      await fs.access(filepath)
      fileExists = true
    } catch (_) {
      // File doesn't exist
    }

    let csv = ""
    if (!fileExists) {
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

    await fs.appendFile(filepath, csv)
  }

  async scrapeUser(userConfig: User): Promise<void> {
    if (!this.config) {
      throw new Error("Config not loaded")
    }

    const { username } = userConfig
    console.log(`\nScraping tweets for: ${username}`)

    const existingTweets = await this.loadExistingData(username, "json")
    if (existingTweets === null) {
      // Create empty JSON file for new users
      await this.saveData(username, [], "json")
      console.log(`Created empty JSON file for new user: ${username}`)
    }

    let since = userConfig.lastTimestampScrape
    if (!since) {
      const now = new Date()
      since = this.formatTimestamp(now)
      console.log(`First time scraping ${username}, using: ${this.parseTimestamp(since)}`)
    }

    const allTweets: Tweet[] = []
    let cursor: string | null = null
    let pageCount = 0
    let latestTimestamp: string | null = null

    try {
      while (pageCount < this.config.maxPages) {
        console.log(`Fetching page ${pageCount + 1}...`)
        const response = await this.fetchTweets(username, since, cursor)

        if (!response.tweets || response.tweets.length === 0) break

        const newTweets = response.tweets.filter((tweet: Tweet) => {
          if (!userConfig.lastTimestampScrape) return true
          return new Date(tweet.createdAt) > new Date(this.parseTimestamp(userConfig.lastTimestampScrape))
        })

        if (newTweets.length === 0) break

        allTweets.push(...newTweets)

        for (const tweet of newTweets) {
          const tweetDate = new Date(tweet.createdAt)
          if (!latestTimestamp || tweetDate > new Date(this.parseTimestamp(latestTimestamp))) {
            latestTimestamp = this.formatTimestamp(tweetDate)
          }
        }

        if (!response.has_next_page || !response.next_cursor) break

        cursor = response.next_cursor
        pageCount++
        await new Promise((res) => setTimeout(res, 1000)) // Delay
      }

      if (allTweets.length > 0) {
        await this.saveData(username, allTweets, "json")
        await this.saveData(username, allTweets, "csv")
        userConfig.lastTimestampScrape = latestTimestamp || since
        console.log(`Saved ${allTweets.length} tweets for ${username}`)
      } else {
        console.log(`No new tweets for ${username}`)
      }
    } catch (err) {
      console.error(`Failed to scrape ${username}:`, err)
    }
  }

  async scrapeAll(): Promise<void> {
    await this.loadConfig()
    await this.ensureDirectories()

    if (!this.config) {
      throw new Error("Config not loaded")
    }

    for (const user of this.config.users) {
      await this.scrapeUser(user)
    }

    await this.saveConfig()
    console.log("✅ Scraping complete. Config updated.")
  }

  getConfig(): Config | null {
    return this.config
  }
}

export async function runScraper(configPath = "config.json"): Promise<void> {
  try {
    const scraper = new TwitterScraper(configPath)
    await scraper.scrapeAll()
  } catch (error) {
    console.error("❌ Error running scraper:", error)
    throw error
  }
}
