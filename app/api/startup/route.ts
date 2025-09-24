import { NextResponse } from "next/server"
import CronManager from "@/lib/cron-manager"

// This endpoint can be called to initialize the cron job on app startup
export async function POST() {
  try {
    const cronManager = CronManager.getInstance()

    // Start with default 8-hour interval
    await cronManager.startCronJob(480)

    return NextResponse.json({
      success: true,
      message: "Cron job initialized successfully",
    })
  } catch (error) {
    console.error("Error initializing cron job:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize cron job",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
