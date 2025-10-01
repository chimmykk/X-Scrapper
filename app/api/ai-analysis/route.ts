import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

function cleanJSON(raw: string): string {
  // Remove code fences and extra whitespace
  return raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .replace(/^\s*[\r\n]/gm, '')
    .trim()
}

async function localParse(instruction: string, csvData: string) {
  const prompt = `
  You are a crypto Twitter + blockchain analyst.
  The user will pass tweet threads in CSV format.
  Your job is to analyze them and return ONLY valid JSON with the structure:
  {
    "summary": "Brief high-level summary of the thread",
    "keyInsights": ["list of main insights extracted from the tweets"],
    "sentiment": "positive | negative | neutral",
    "topics": ["list of major crypto/blockchain topics discussed"],
    "notableAccounts": ["list of mentioned or important Twitter accounts"]
  }

  Keep analysis concise and structured.
  Do not include extra commentary or code fences.
  Input thread (CSV): ${instruction}
  CSV Data: ${csvData}
  `;

  try {
    if (!model) throw new Error('AI model not configured');
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const cleaned = cleanJSON(raw);
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('AI Analysis Error:', err);
    // Fallback: return basic shell if analysis fails
    return {
      summary: "Unable to parse thread",
      keyInsights: [],
      sentiment: "neutral",
      topics: [],
      notableAccounts: []
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, query } = await request.json()

    if (!username || !query) {
      return NextResponse.json({ error: "Username and query are required" }, { status: 400 })
    }

    // Try to read the CSV file from storecsv
    const csvPath = path.join(process.cwd(), "storecsv", `${username}.csv`)
    
    let csvData = ""
    try {
      csvData = await fs.readFile(csvPath, "utf8")
    } catch (error) {
      return NextResponse.json({ 
        error: `No CSV data found for user ${username}. Please ensure the user has been scraped first.` 
      }, { status: 404 })
    }

    // Limit CSV data to last 300-400 lines to stay within Gemini's limits
    const lines = csvData.split('\n')
    const header = lines[0] // Keep header
    const dataLines = lines.slice(1) // All data lines
    const limitedLines = dataLines.slice(-350) // Take last 350 lines
    const limitedCsvData = [header, ...limitedLines].join('\n')

    console.log(`[AI Analysis] Analyzing ${username} with ${limitedLines.length} tweets`)

    // Perform AI analysis
    const analysisResult = await localParse(query, limitedCsvData)

    return NextResponse.json({
      success: true,
      username,
      query,
      analysis: analysisResult,
      tweetCount: limitedLines.length
    })

  } catch (error) {
    console.error("Error in AI analysis:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform AI analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
