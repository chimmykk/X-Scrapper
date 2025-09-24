import { NextResponse } from "next/server"
import CronManager from "@/lib/cron-manager"

export async function POST() {
  try {
    const cronManager = CronManager.getInstance()
    cronManager.stopCronJob()

    return NextResponse.json({
      success: true,
      message: "Cron job stopped successfully",
    })
  } catch (error) {
    console.error("Error stopping cron job:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to stop cron job",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
