import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { getEnvVar, validateFeatureEnv } from "@/lib/env-check"

export async function POST(request: NextRequest) {
  try {
    // Validate OpenAI API key
    if (!validateFeatureEnv("openai")) {
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: getEnvVar("OPENAI_API_KEY"),
    })

    const requestData = await request.json()
    const { prompt, model = "gpt-4o" } = requestData

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    })

    return NextResponse.json({
      text: response.choices[0]?.message?.content || "",
    })
  } catch (error) {
    console.error("AI API error:", error)
    return NextResponse.json({ error: "Failed to process AI request" }, { status: 500 })
  }
}
