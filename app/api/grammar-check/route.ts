import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import OpenAI from "openai"

export async function POST(request: Request) {
  try {
    // Get the current user from the session
    const supabase = createServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the text from the request body
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Initialize OpenAI client with the provided API key
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Call OpenAI API to check grammar
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that corrects grammar and improves text. Maintain the original meaning and medical terminology.",
        },
        {
          role: "user",
          content: `Please correct the grammar and improve the following medical text. Return only the corrected text without any explanations or additional comments:\n\n${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const correctedText = response.choices[0]?.message?.content || text

    // Return the corrected text
    return NextResponse.json({ correctedText })
  } catch (error) {
    console.error("Error checking grammar:", error)
    return NextResponse.json({ error: "Failed to check grammar" }, { status: 500 })
  }
}
