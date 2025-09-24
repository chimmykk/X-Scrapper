import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const { username } = params

    // Path to the JSON file - using storejson/{username}.json structure
    const filePath = path.join(process.cwd(), "storejson", `${username}.json`)

    try {
      // Try to read the JSON file
      const data = await fs.readFile(filePath, "utf8")
      const tweets = JSON.parse(data)
      return NextResponse.json({ success: true, tweets })
    } catch (fileError: any) {
      // If file doesn't exist (ENOENT), return empty array for new users
      if (fileError.code === "ENOENT") {
        console.log(`No tweets file found for ${username} yet - returning empty array`)
        return NextResponse.json({ success: true, tweets: [] })
      }
      // Re-throw other file errors
      throw fileError
    }
  } catch (error) {
    console.error(`Error fetching tweets for ${params.username}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tweets",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
