import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  try {
    const csvDir = path.join(process.cwd(), "storecsv")
    const jsonDir = path.join(process.cwd(), "storejson")
    
    const users: Array<{ username: string; lastTimestampScrape: string | null }> = []
    
    // Read CSV files
    try {
      const csvFiles = await fs.readdir(csvDir)
      for (const file of csvFiles) {
        if (file.endsWith('.csv')) {
          const username = file.replace('.csv', '')
          users.push({ username, lastTimestampScrape: null })
        }
      }
    } catch (error) {
      console.log("CSV directory not found or empty")
    }
    
    // Read JSON files
    try {
      const jsonFiles = await fs.readdir(jsonDir)
      for (const file of jsonFiles) {
        if (file.endsWith('.json')) {
          const username = file.replace('.json', '')
          // Check if user already exists from CSV
          if (!users.find(u => u.username === username)) {
            users.push({ username, lastTimestampScrape: null })
          }
        }
      }
    } catch (error) {
      console.log("JSON directory not found or empty")
    }
    
    return NextResponse.json({ 
      success: true, 
      users: users.sort((a, b) => a.username.localeCompare(b.username))
    })
  } catch (error) {
    console.error("Error loading users from files:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load users from files" },
      { status: 500 }
    )
  }
}

