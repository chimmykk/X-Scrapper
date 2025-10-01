import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { searchQuery, resultCount = 10 } = await request.json()

    if (!searchQuery || typeof searchQuery !== "string") {
      return NextResponse.json({ error: "Invalid or missing search query" }, { status: 400 })
    }

    // Use the exact API call as specified
    const url = 'https://api.twitterapi.io/twitter/tweet/advanced_search?queryType=Latest'
    const queryParams = new URLSearchParams({
      query: searchQuery,
      limit: resultCount.toString()
    })
    
    const fullUrl = `${url}&${queryParams.toString()}`

    const options = {
      method: 'GET', 
      headers: {
        'X-API-Key': '8c692c9487c54f9f814ae5823b7a0eba'
      }
    }

    const response = await fetch(fullUrl, options)
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: data,
      query: searchQuery
    })

  } catch (error) {
    console.error("Error in search API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform search",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
