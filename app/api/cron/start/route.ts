import { type NextRequest, NextResponse } from "next/server"
import CronManager from "@/lib/cron-manager"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const intervalMinutes = body.intervalMinutes || 480 // Default 8 hours

    const cronManager = CronManager.getInstance()
    await cronManager.startCronJob(intervalMinutes)

    return NextResponse.json({
      success: true,
      message: `Cron job started with ${intervalMinutes} minute interval`,
    })
  } catch (error) {
    console.error("Error starting cron job:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to start cron job",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
