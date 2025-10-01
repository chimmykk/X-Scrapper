import { type NextRequest, NextResponse } from "next/server"
import { searchLiveTweets } from "@/lib/live-twitter-scraper"

export async function POST(request: NextRequest) {
  try {
    const { searchQuery, resultCount = 10 } = await request.json()

    if (!searchQuery || typeof searchQuery !== "string") {
      return NextResponse.json({ error: "Invalid or missing search query" }, { status: 400 })
    }

    // Use the dedicated live scraper
    const result = await searchLiveTweets(searchQuery, resultCount)
    
    return NextResponse.json({
      success: true,
      data: {
        tweets: result.tweets,
        totalCount: result.totalCount
      },
      query: searchQuery
    })

  } catch (error) {
    console.error("Error in search API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform search",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
