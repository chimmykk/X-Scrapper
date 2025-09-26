import { NextResponse } from "next/server"
import { progressTracker } from "@/lib/progress-tracker"

export async function GET() {
  try {
    const progress = progressTracker.getProgress()
    return NextResponse.json({
      success: true,
      progress,
    })
  } catch (error) {
    console.error("Error getting progress:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get progress",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    progressTracker.stopScraping()
    return NextResponse.json({
      success: true,
      message: "Scraping stopped successfully"
    })
  } catch (error) {
    console.error("Error stopping scraping:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to stop scraping",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
