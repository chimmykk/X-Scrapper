import { NextResponse } from "next/server"
import { runScraper } from "@/lib/twitter-scraper"

export async function POST() {
  try {
    console.log("Manual scraper run initiated...")
    await runScraper()

    return NextResponse.json({
      success: true,
      message: "Scraper run completed successfully",
    })
  } catch (error) {
    console.error("Error running scraper:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run scraper",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
