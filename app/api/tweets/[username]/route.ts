import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const { username } = params

    // Path to the JSON file - using storejson/{username}.json structure
    const filePath = path.join(process.cwd(), "storejson", `${username}.json`)

    // Read and parse the JSON file
    const data = await fs.readFile(filePath, "utf8")
    const tweets = JSON.parse(data)

    return NextResponse.json({ success: true, tweets })
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
