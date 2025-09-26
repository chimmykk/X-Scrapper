import { NextResponse } from "next/server"
import { BulkTwitterScraper } from "@/lib/bulk-twitter-scraper"
import { progressTracker } from "@/lib/progress-tracker"

export async function POST(request: Request) {
  try {
    const { username, sinceDate } = await request.json()

    if (!username || !sinceDate) {
      return NextResponse.json({ success: false, error: "Username and sinceDate are required" }, { status: 400 })
    }

    // Check if already scraping
    if (progressTracker.isScraping()) {
      return NextResponse.json({ success: false, error: "Scraping is already in progress" }, { status: 409 })
    }

    // Start progress tracking
    progressTracker.startScraping(username)

    // Start scraping in background
    startBulkScraping(username, sinceDate)

    return NextResponse.json({
      success: true,
      message: "Bulk scraping started",
    })
  } catch (error) {
    console.error("Error starting bulk scraper:", error)
    progressTracker.failScraping("Failed to start bulk scraper")
    return NextResponse.json(
      {
        success: false,
        error: "Failed to start bulk scraper",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function startBulkScraping(username: string, sinceDate: string) {
  console.log(`[BulkScraping] Starting for user: ${username}`)

  try {
    const scraper = new BulkTwitterScraper()

    // Update progress callback
    const onProgress = (progress: any) => {
      progressTracker.updateProgress(progress)
      console.log(`[BulkScraping] Updated progress: ${progress.status}`)
    }

    // Stop checking function
    const shouldStop = () => {
      return !progressTracker.isScraping()
    }

    const result = await scraper.scrapeUserBulk(username, sinceDate, onProgress, undefined, shouldStop)

    // Update final status
    progressTracker.completeScraping(result.totalTweets, result.totalPages)
    console.log(`[BulkScraping] Completed: ${result.totalTweets} tweets, ${result.totalPages} pages`)
  } catch (error) {
    console.error(`Bulk scraping failed for ${username}:`, error)
    progressTracker.failScraping(error instanceof Error ? error.message : "Unknown error")
  }
}

