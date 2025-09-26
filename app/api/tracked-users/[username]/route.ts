import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function DELETE(request: Request, { params }: { params: { username: string } }) {
  try {
    const { username } = params

    if (!username) {
      return NextResponse.json({ success: false, error: "Username is required" }, { status: 400 })
    }

    const storeCsvDir = path.join(process.cwd(), "storecsv")
    const csvPath = path.join(storeCsvDir, `${username}.csv`)
    const jsonPath = path.join(process.cwd(), "storejson", `${username}.json`)

    try {
      // Check if CSV file exists
      await fs.access(csvPath)
      
      // Delete CSV file
      await fs.unlink(csvPath)
      console.log(`Deleted CSV file: ${csvPath}`)
    } catch (error) {
      console.log(`CSV file ${csvPath} not found or already deleted`)
    }

    try {
      // Check if JSON file exists and delete it too
      await fs.access(jsonPath)
      await fs.unlink(jsonPath)
      console.log(`Deleted JSON file: ${jsonPath}`)
    } catch (error) {
      console.log(`JSON file ${jsonPath} not found or already deleted`)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${username} from tracked users`,
    })
  } catch (error) {
    console.error("Error deleting tracked user:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete tracked user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
