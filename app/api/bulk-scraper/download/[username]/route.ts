import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: Request, { params }: { params: { username: string } }) {
  try {
    const { username } = params

    // Try storecsv first, then fall back to bulk-downloads
    const storeCsvPath = path.join(process.cwd(), "storecsv", `${username}.csv`)
    const bulkCsvPath = path.join(process.cwd(), "bulk-downloads", `${username}.csv`)
    
    let csvPath = storeCsvPath
    let csvData = ""

    try {
      // Check if storecsv file exists and has content
      await fs.access(storeCsvPath)
      csvData = await fs.readFile(storeCsvPath, "utf8")
      
      // If storecsv is empty, try bulk-downloads
      if (csvData.trim().length === 0) {
        try {
          await fs.access(bulkCsvPath)
          csvData = await fs.readFile(bulkCsvPath, "utf8")
          csvPath = bulkCsvPath
        } catch (_) {
          // bulk-downloads also doesn't exist or is empty
        }
      }
    } catch (_) {
      // storecsv doesn't exist, try bulk-downloads
      try {
        await fs.access(bulkCsvPath)
        csvData = await fs.readFile(bulkCsvPath, "utf8")
        csvPath = bulkCsvPath
      } catch (fileError) {
        console.error("Error reading CSV file:", fileError)
        return NextResponse.json({ success: false, error: "No CSV file found for this user" }, { status: 404 })
      }
    }

    // Check if we have any data
    if (csvData.trim().length === 0) {
      return NextResponse.json({ success: false, error: "No tweets found for this user" }, { status: 404 })
    }

    // Generate a clean filename for download
    const downloadFilename = `${username}_tweets_${new Date().toISOString().split("T")[0]}.csv`

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${downloadFilename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error downloading CSV:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to download CSV",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
