"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StreamingText } from "@/components/ui/streaming-text"
import { Bot, Send, StopCircle } from "lucide-react"

interface AIAssistantProps {
  initialPrompt?: string
  className?: string
}

export function AIAssistant({ initialPrompt = "", className = "" }: AIAssistantProps) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [response, setResponse] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [controller, setController] = useState<AbortController | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    setResponse("")

    try {
      const abortController = new AbortController()
      setController(abortController)

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: abortController.signal,
      })

      if (!res.ok) throw new Error("Failed to generate response")

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No reader available")

      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunk = decoder.decode(value)
        setResponse((prev) => prev + chunk)
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error generating response:", error)
        setResponse((prev) => prev + "\n\nError: Failed to generate response. Please try again.")
      }
    } finally {
      setIsGenerating(false)
      setController(null)
    }
  }

  const handleStopGeneration = () => {
    if (controller) {
      controller.abort()
      setIsGenerating(false)
      setController(null)
    }
  }

  return (
    <Card className={`w-full overflow-hidden border border-border shadow-sm ${className}`}>
      <CardHeader className="pb-2 bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Bot className="h-5 w-5 text-primary" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="min-h-[150px] max-h-[300px] overflow-y-auto bg-muted/20 rounded-md p-3 border border-border">
          <StreamingText text={response} isLoading={isGenerating} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Ask a question about your transcript..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[80px] resize-none border-input focus:ring-primary/30"
            disabled={isGenerating}
          />
          <div className="flex justify-end gap-2">
            {isGenerating ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleStopGeneration}
                className="flex items-center gap-1"
              >
                <StopCircle className="h-4 w-4" />
                Stop
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-white"
                disabled={!prompt.trim()}
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
