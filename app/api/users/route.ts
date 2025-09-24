import { type NextRequest, NextResponse } from "next/server"
import { TwitterScraper } from "@/lib/twitter-scraper"
import CronManager from "@/lib/cron-manager"

export async function GET() {
  try {
    const scraper = new TwitterScraper()
    await scraper.loadConfig()
    const config = scraper.getConfig()

    return NextResponse.json({
      users: config?.users || [],
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Invalid or missing username" }, { status: 400 })
    }

    const scraper = new TwitterScraper()
    await scraper.loadConfig()
    const config = scraper.getConfig()

    if (!config) {
      return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 })
    }

    // Check if username already exists
    const existingUser = config.users.find((user) => user.username === username)
    if (existingUser) {
      return NextResponse.json({ error: `Username '${username}' already exists` }, { status: 409 })
    }

    // Create new user object
    const newUser = {
      username,
      lastTimestampScrape: null,
    }

    // Add new user to the users array
    config.users.push(newUser)
    await scraper.saveConfig()

    // Restart cron job to pick up the new user
    try {
      const cronManager = CronManager.getInstance()
      await cronManager.restartCronJob()
      console.log(`Cron job restarted after adding user: ${username}`)
    } catch (cronError) {
      console.error("Error restarting cron job:", cronError)
      // Continue with the response even if cron restart fails
    }

    return NextResponse.json(
      {
        message: `User '${username}' added successfully`,
        user: newUser,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error in /api/users POST:", error)
    return NextResponse.json(
      { error: "Failed to add user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
