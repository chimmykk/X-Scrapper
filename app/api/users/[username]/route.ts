import { type NextRequest, NextResponse } from "next/server"
import { TwitterScraper } from "@/lib/twitter-scraper"

export async function DELETE(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const { username } = params
    const scraper = new TwitterScraper()
    await scraper.loadConfig()
    const config = scraper.getConfig()

    if (!config) {
      return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 })
    }

    // Find user index
    const userIndex = config.users.findIndex((u) => u.username === username)
    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove user
    config.users.splice(userIndex, 1)
    await scraper.saveConfig()

    return NextResponse.json({
      success: true,
      message: `User '${username}' removed successfully`,
    })
  } catch (error) {
    console.error(`Error deleting user ${params.username}:`, error)
    return NextResponse.json(
      { error: "Failed to delete user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
