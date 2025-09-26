import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  try {
    const storeCsvDir = path.join(process.cwd(), "storecsv")
    
    // Read all files in the storecsv directory
    const files = await fs.readdir(storeCsvDir)
    
    // Filter for CSV files and extract usernames
    const users = files
      .filter(file => file.endsWith('.csv'))
      .map(file => file.replace('.csv', ''))
      .filter(username => username.length > 0) // Filter out empty names
    
    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error("Error fetching tracked users:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tracked users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
