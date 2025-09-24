import { NextResponse } from "next/server"
import CronManager from "@/lib/cron-manager"

export async function GET() {
  try {
    const cronManager = CronManager.getInstance()
    const isRunning = cronManager.isJobRunning()

    return NextResponse.json({
      isRunning,
      status: isRunning ? "active" : "inactive",
    })
  } catch (error) {
    console.error("Error checking cron status:", error)
    return NextResponse.json({ error: "Failed to check cron status" }, { status: 500 })
  }
}
